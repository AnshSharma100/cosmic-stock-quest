Cosmic Stock Quest API (FastAPI + yfinance)

Endpoints
- GET /api/health — quick health check
- GET /api/stocks/top?limit=50 — top list with price and % change
- GET /api/stocks/{symbol}/quote — latest price and % change
- GET /api/stocks/{symbol}/history?period=1y&interval=1d — OHLCV for charting
- POST /api/portfolio/parse — parse CSV/PDF statement into holdings (best effort)

Local dev (Windows PowerShell)
1) Create venv and install deps
	- python -m venv .venv
	- . .\.venv\Scripts\Activate.ps1
	- pip install -r requirements.txt

2) Run the server (pick ONE of these):
	- From repo root: uvicorn backend.pyserver.main:app --reload --port 5179
	- Or from backend/: uvicorn pyserver.main:app --reload --port 5179

Notes
- yfinance scrapes Yahoo! Finance. Respect rate limits.
- For multipart uploads in PowerShell, use curl.exe or Invoke-WebRequest -Form.
