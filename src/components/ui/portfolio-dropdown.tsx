import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export const PortfolioDropdown = () => {
  const location = useLocation();
  
  const isActive = location.pathname === "/portfolio" || location.pathname === "/crypto-portfolio";
  const currentLabel = location.pathname === "/crypto-portfolio" ? "Crypto" : "Stocks";
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "px-6 py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center gap-2",
          isActive
            ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(0_0%_92%/0.4)]"
            : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/50"
        )}
      >
        Portfolio {isActive && `(${currentLabel})`}
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card border-border z-50">
        <DropdownMenuItem asChild>
          <Link to="/portfolio" className="cursor-pointer">
            Stocks Portfolio
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/crypto-portfolio" className="cursor-pointer">
            Crypto Portfolio
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
