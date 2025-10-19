import { useEffect, useMemo, useState } from "react";

type LiveStatus = "checking" | "live" | "offline";

export function LiveBadge() {
  const API_BASE: string = (import.meta as any).env?.VITE_API_BASE || "http://localhost:5179";
  const [status, setStatus] = useState<LiveStatus>("checking");

  const label = useMemo(() => {
    if (status === "live") return "Live Data";
    if (status === "offline") return "Offline";
    return "Checking…";
  }, [status]);

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      try {
        const r = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
        if (!cancelled) setStatus(r.ok ? "live" : "offline");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    }

    // initial + interval
    ping();
    const id = setInterval(ping, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [API_BASE]);

  const dotClass = status === "live"
    ? "bg-green-500"
    : status === "offline"
    ? "bg-red-500"
    : "bg-amber-500";

  return (
    <div title={`API: ${API_BASE}`} className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-xs bg-background/60">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotClass}`} />
      <span className="font-medium">{label}</span>
    </div>
  );
}
