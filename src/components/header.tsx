import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type HeaderProps = {
  onNewChat: () => void;
};

export function Header({ onNewChat }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm">
      <h1 className="text-2xl font-bold text-primary font-headline">AuraChat</h1>
      <Button variant="outline" size="sm" onClick={onNewChat} aria-label="Start new chat">
        <RefreshCw className="mr-2 h-4 w-4" />
        New Chat
      </Button>
    </header>
  );
}
