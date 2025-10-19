import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import StarUI from "@/components/StarUI";
import { StockChart } from "@/components/stock-chart";
import { SettingsMenu } from "@/components/ui/settings-menu";
import { cn } from "@/lib/utils";
import { LiveBadge } from "@/components/live-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const sandboxStocks = [
  { id: 1, name: "Pinterest", symbol: "PINS", value: 500, x: "20%", y: "35%" },
  { id: 2, name: "Amazon", symbol: "AMZN", value: 500, x: "50%", y: "45%" },
  { id: 3, name: "Google", symbol: "GOOGL", value: 500, x: "70%", y: "30%" },
];

const Sandbox = () => {
  const navigate = useNavigate();
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [customSymbols, setCustomSymbols] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [symbolInput, setSymbolInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const { toast } = useToast();

  const API_BASE: string = (import.meta as any).env?.VITE_API_BASE || "http://localhost:5179";

  const handleStockClick = (stock: any) => {
    const entry = customSymbols.find((s) => s.split(':')[0] === stock.symbol);
    const plannedBuy = entry ? Number(entry.split(':')[1]) : undefined;
    setSelectedStock(plannedBuy ? { ...stock, plannedBuy } : { ...stock });
  };

  async function handleAddSymbol(e: FormEvent) {
    e.preventDefault();
    const raw = symbolInput.trim().toUpperCase();
    if (!raw) return;
    if (customSymbols.some((s) => s.split(':')[0] === raw)) {
      toast({ title: "Already added", description: `${raw} is already in your sandbox.` });
      return;
    }
    const buyAmount = Number(amountInput.replace(/[^0-9.]/g, ""));
    if (!isFinite(buyAmount) || buyAmount <= 0) {
      toast({ title: "Enter amount", description: "Please enter a dollar amount > 0.", variant: "destructive" as any });
      return;
    }
    // Try lightweight validation via backend; if offline, still allow adding
    let ok = true;
    try {
      const r = await fetch(`${API_BASE}/api/stocks/${encodeURIComponent(raw)}/quote`, { cache: "no-store" });
      ok = r.ok;
    } catch {
      ok = true; // allow when offline
    }
    if (!ok) {
      toast({ title: "Unknown symbol", description: `${raw} was not found.`, variant: "destructive" as any });
      return;
    }
    setCustomSymbols((prev) => [...prev, `${raw}:${buyAmount}`]);
    setSymbolInput("");
    setAmountInput("");
    setOpen(false);
    toast({ title: "Added", description: `${raw} for $${buyAmount.toLocaleString()} added to your sandbox.` });
  }

  return (
    <div className="min-h-screen p-6 relative">
      {/* Full screen galaxy background */}
      <div className="fixed inset-0 z-0">
        {customSymbols.length === 0 ? (
          <StarUI enableStocks={false} onStockClick={handleStockClick} />
        ) : (
          <StarUI
            enableStocks={true}
            mode="custom"
            customSymbols={customSymbols.map(s => s.split(':')[0])}
            customAmounts={Object.fromEntries(customSymbols.map(s => { const [sym, amt] = s.split(':'); return [sym, Number(amt)]; }))}
            spriteScale={60}
            onStockClick={handleStockClick}
          />
        )}
      </div>
      
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-3rem)] relative z-10 pointer-events-none">
        <div className="flex gap-6 h-full">
          {/* Left Side - Sandbox Galaxy */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 pointer-events-auto">
              <Button
                variant="ghost"
                onClick={() => navigate("/portfolio")}
                className="flex items-center gap-2 hover:bg-secondary"
              >
                <ArrowLeft className="h-4 w-4" />
                BACK
              </Button>
              <div className="flex items-center gap-4">
                <LiveBadge />
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2 cosmic-gradient hover:opacity-90 transition-opacity">
                      <Plus className="h-4 w-4" />
                      ADD
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add a stock</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddSymbol} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground" htmlFor="ticker">Ticker symbol</label>
                        <Input id="ticker" placeholder="e.g. NVDA" value={symbolInput} onChange={(e) => setSymbolInput(e.target.value)} autoFocus />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground" htmlFor="amount">Amount to buy (USD)</label>
                        <Input id="amount" inputMode="decimal" placeholder="e.g. 2500" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit">Add</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                <SettingsMenu />
              </div>
            </div>
          </div>

          {/* Right Side - Info Panel */}
          <div className="w-96 glass-panel rounded-2xl p-6 pointer-events-auto">
            {selectedStock ? (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold mb-1">{selectedStock.symbol}</h2>
                  <p className="text-lg text-primary font-semibold">${selectedStock.price?.toFixed(2)}</p>
                  <p className={cn(
                    "text-sm",
                    selectedStock.change > 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {selectedStock.change > 0 ? '+' : ''}{selectedStock.change?.toFixed(2)}%
                  </p>
                  {typeof selectedStock?.plannedBuy === 'number' && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Planned buy: ${selectedStock.plannedBuy.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>

                <div className="bg-secondary/30 rounded-lg p-4">
                  <StockChart />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button className="bg-secondary hover:bg-secondary/80">
                    Buy
                  </Button>
                  <Button variant="destructive">
                    Sell
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="space-y-2">
                  <h2 className="text-4xl font-bold glow-text">
                    CREATE
                    <br />
                    YOUR
                    <br />
                    DREAM
                    <br />
                    GALAXY
                  </h2>
                </div>
                <p className="text-muted-foreground text-sm">
                  Simulate your perfect portfolio
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sandbox;
