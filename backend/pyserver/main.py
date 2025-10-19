from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import yfinance as yf
import io
import csv
import re
from typing import Dict
try:
    from pypdf import PdfReader  # optional; install with: pip install pypdf
except Exception:
    PdfReader = None  # optional dependency not installed

app = FastAPI(title="Cosmic Stock Quest API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}

# A reasonable default top list (can be replaced by dynamic sources later)
DEFAULT_TOP = [
    "AAPL","MSFT","AMZN","GOOGL","META","NVDA","TSLA","AMD","NFLX","INTC",
    "CRM","ADBE","ORCL","CSCO","IBM","PYPL","SHOP","UBER","ABNB","SQ",
    "SNOW","PLTR","DDOG","MDB","ZS","OKTA","CRWD","TEAM","ETSY","PINS",
    "SPOT","RBLX","DASH","COIN","AFRM","ASAN","CFLT","APP","AI","PATH",
    "GTLB","NET","TTD","ROKU","U","DOCN","TWLO","ZM","DIS","NVDA"
]

@app.get("/api/stocks/top")
def top_stocks(limit: int = 50):
    syms = DEFAULT_TOP[: max(1, min(limit, 100))]
    data = []
    tickers = yf.Tickers(" ".join(syms))
    for sym in syms:
        try:
            info = tickers.tickers[sym].fast_info
            price = float(info.last_price) if info.last_price is not None else None
            prev = float(info.previous_close) if info.previous_close is not None else None
            change = None
            if price is not None and prev is not None and prev != 0:
                change = (price - prev) / prev * 100.0
            data.append({"symbol": sym, "price": price, "change": change})
        except Exception:
            data.append({"symbol": sym, "price": None, "change": None})
    return {"stocks": data}


def _parse_csv_holdings(f: io.BytesIO) -> List[Dict]:
    f.seek(0)
    text = f.read().decode("utf-8", errors="ignore")
    f = io.StringIO(text)
    reader = csv.DictReader(f)
    results = []
    for row in reader:
        # Try common header variants
        sym = (row.get("Symbol") or row.get("Ticker") or row.get("SYMBOL") or row.get("TICKER") or "").strip()
        qty = row.get("Quantity") or row.get("Qty") or row.get("Shares") or row.get("QUANTITY") or row.get("QTY")
        try:
            q = float(qty) if qty is not None and str(qty).strip() != "" else None
        except Exception:
            q = None
        if sym:
            results.append({"symbol": sym.upper(), "quantity": q})
    return results


def _parse_pdf_holdings(f: io.BytesIO) -> List[Dict]:
    if PdfReader is None:
        raise HTTPException(status_code=400, detail="PDF parsing not available. Install with: pip install pypdf")
    f.seek(0)
    reader = PdfReader(f)
    pages_text = [page.extract_text() or "" for page in reader.pages]
    text = "\n".join(pages_text)
    if not text.strip():
        raise HTTPException(status_code=400, detail="No extractable text found in PDF (scanned image?). OCR not supported.")

    # Regex for tickers: allow dot and hyphen class suffixes (e.g., BRK.B, BRK-B)
    ticker_re = re.compile(r"\b[A-Z]{1,5}(?:[\.-][A-Z0-9]{1,3})?\b")
    qty_inline_re = re.compile(r"(Qty|Quantity|Shares)\s*[:]?\s*([\d,.]+)", re.IGNORECASE)

    # Common words and abbreviations that are NOT tickers and often appear in statements
    stop = {
        "QTY", "PDF", "DATE", "PAGE", "CUSIP", "TOTAL", "BALANCE", "SUMMARY",
        "DIV", "INT", "CASH", "MONEY", "MARKET", "VALUE", "SYMBOL", "TICKER",
        # Entities/disclaimers/common noise
        "LLC", "INC", "CORP", "COMPANY", "HOLDINGS", "ACCOUNT", "BROKERAGE", "CLIENT",
        "FINRA", "SIPC", "IRS", "SEC", "ETF", "REIT", "NYSE", "NASDAQ", "AMEX",
        "USD", "US", "U.S", "USA", "NBBO", "PFOF", "SWEEP", "CASH-001", "CASH",
        "BUY", "SELL", "TRADE", "TRD"
    }

    results: List[Dict] = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        tickers = [t for t in ticker_re.findall(line) if t.upper() not in stop]
        if not tickers:
            continue
        q = None
        m = qty_inline_re.search(line)
        if m:
            try:
                q = float(m.group(2).replace(",", ""))
            except Exception:
                q = None
        # Secondary heuristic: if line looks like table columns, pick trailing number
        if q is None:
            parts = [p for p in re.split(r"\s+", line) if p]
            for token in reversed(parts[-5:]):  # last few tokens
                if re.fullmatch(r"[\d,.]+", token):
                    try:
                        q = float(token.replace(",", ""))
                        break
                    except Exception:
                        pass
        # Only accept entries that have a detected quantity to avoid false positives from headers/footers
        if q is None or q <= 0:
            continue
        for t in tickers:
            results.append({"symbol": t.upper(), "quantity": q})

    # De-duplicate symbols, keep first quantity found
    seen: Dict[str, Dict] = {}
    for r in results:
        seen.setdefault(r["symbol"], r)
    return list(seen.values())


@app.post("/api/portfolio/parse")
async def parse_portfolio(file: UploadFile = File(...)):
    data = await file.read()
    buf = io.BytesIO(data)
    name = (file.filename or "").lower()
    try:
        if name.endswith(".csv"):
            holdings = _parse_csv_holdings(buf)
        elif name.endswith(".pdf"):
            holdings = _parse_pdf_holdings(buf)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Upload CSV or PDF.")
        # Filter invalid rows
        holdings = [h for h in holdings if h.get("symbol")]
        # Validate symbols by checking current price > 0 to eliminate false positives
        unique_syms = []
        seen_syms = set()
        for h in holdings:
            sym = h["symbol"].upper()
            if sym not in seen_syms:
                seen_syms.add(sym)
                unique_syms.append(sym)
        validated = []
        # Stricter validation: require recent price history to exist (prevents FINRA/LLC/etc.)
        for h in holdings:
            sym = h["symbol"].upper()
            ok = False
            try:
                t = yf.Ticker(sym)
                fi = t.fast_info
                price = float(fi.last_price) if fi.last_price is not None else None
                # Quick reject if no price
                if price is not None and price > 0:
                    hist = t.history(period="5d", interval="1d")
                    ok = (not hist.empty) and float(hist["Close"].iloc[-1]) > 0
            except Exception:
                ok = False
            if ok:
                validated.append({"symbol": sym, "quantity": h.get("quantity")})
        # Limit to reasonable size
        validated = validated[:200]
        return {"holdings": validated}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Parse failed: {e}")

@app.get("/api/stocks/{symbol}/quote")
def quote(symbol: str):
    try:
        t = yf.Ticker(symbol)
        info = t.fast_info
        price = float(info.last_price) if info.last_price is not None else None
        prev = float(info.previous_close) if info.previous_close is not None else None
        change = None
        if price is not None and prev is not None and prev != 0:
            change = (price - prev) / prev * 100.0
        return {"symbol": symbol.upper(), "price": price, "change": change}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/stocks/{symbol}/history")
def history(symbol: str, period: str = "1y", interval: str = "1d"):
    try:
        t = yf.Ticker(symbol)
        hist = t.history(period=period, interval=interval)
        # Return minimal OHLCV for charting
        records = [
            {
                "date": str(idx.date()),
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": float(row["Close"]),
                "volume": float(row["Volume"]),
            }
            for idx, row in hist.iterrows()
        ]
        return {"symbol": symbol.upper(), "data": records}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
