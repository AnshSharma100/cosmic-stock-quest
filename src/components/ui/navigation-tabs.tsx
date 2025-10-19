import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavigationTabsProps {
  hidePortfolio?: boolean;
}

export const NavigationTabs = ({ hidePortfolio = false }: NavigationTabsProps) => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="flex gap-2">
      <Link
        to="/discovery"
        className={cn(
          "px-6 py-2.5 rounded-lg font-medium transition-all duration-300",
          isActive("/discovery")
            ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(0_0%_85%/0.3)]"
            : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/50"
        )}
      >
        Discovery
      </Link>
      {!hidePortfolio && (
        <Link
          to="/portfolio"
          className={cn(
            "px-6 py-2.5 rounded-lg font-medium transition-all duration-300",
            isActive("/portfolio")
              ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(0_0%_85%/0.3)]"
              : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/50"
          )}
        >
          Portfolio
        </Link>
      )}
    </div>
  );
};
