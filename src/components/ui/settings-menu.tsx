import { MoreVertical, Newspaper } from "lucide-react";
import { Button } from "./button";
import { Switch } from "./switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

export const SettingsMenu = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="text-foreground hover:bg-secondary">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 glass-panel border-primary/20">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              Latest News
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="p-2 bg-secondary/30 rounded">📈 Market reaches new highs</p>
              <p className="p-2 bg-secondary/30 rounded">🚀 Tech stocks surge forward</p>
              <p className="p-2 bg-secondary/30 rounded">💡 New AI features coming soon</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <label htmlFor="alexa-mode" className="text-sm font-medium">
                Alexa Mode
              </label>
              <Switch id="alexa-mode" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
