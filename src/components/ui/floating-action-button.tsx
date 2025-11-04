import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Plus,
  MessageSquare,
  Upload,
  Settings,
  HelpCircle,
  Search,
  Zap,
  Users,
  BarChart3,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action: () => void;
  description?: string;
}

interface FloatingActionButtonProps {
  actions?: QuickAction[];
  className?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  size?: "sm" | "md" | "lg";
}

const defaultActions: QuickAction[] = [
  {
    id: "new-chat",
    label: "New Chat",
    icon: MessageSquare,
    color: "bg-blue-500 hover:bg-blue-600",
    description: "Start a new conversation",
    action: () => window.location.href = "/chat"
  },
  {
    id: "upload",
    label: "Upload Document",
    icon: Upload,
    color: "bg-green-500 hover:bg-green-600",
    description: "Upload a new document",
    action: () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx';
      input.click();
    }
  },
  {
    id: "search",
    label: "Search Knowledge",
    icon: Search,
    color: "bg-purple-500 hover:bg-purple-600",
    description: "Search the knowledge base",
    action: () => {
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    color: "bg-orange-500 hover:bg-orange-600",
    description: "View usage analytics",
    action: () => window.location.href = "/analytics"
  },
  {
    id: "users",
    label: "Manage Users",
    icon: Users,
    color: "bg-cyan-500 hover:bg-cyan-600",
    description: "User management",
    action: () => window.location.href = "/admin/users"
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    color: "bg-gray-500 hover:bg-gray-600",
    description: "Application settings",
    action: () => window.location.href = "/settings"
  }
];

export default function FloatingActionButton({
  actions = defaultActions,
  className,
  position = "bottom-right",
  size = "md"
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6"
  };

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-14 h-14",
    lg: "w-16 h-16"
  };

  const iconSizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7"
  };

  // Close FAB when clicking outside and handle keyboard shortcuts
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle FAB with Ctrl/Cmd + K
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        toggleFAB();
        return;
      }

      // Handle number key shortcuts when FAB is open
      if (isOpen && event.key >= '1' && event.key <= '6') {
        event.preventDefault();
        const actionIndex = parseInt(event.key) - 1;
        if (actions[actionIndex]) {
          handleActionClick(actions[actionIndex]);
        }
        return;
      }

      // Close FAB with Escape
      if (isOpen && event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        return;
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, actions]);

  const toggleFAB = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setIsOpen(prev => !prev);

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleActionClick = (action: QuickAction) => {
    action.action();
    setIsOpen(false);
  };

  const getActionPosition = (index: number) => {
    // Use vertical dropdown positioning to keep items on screen
    const spacing = 60; // Space between items
    const direction = position.includes('bottom') ? -1 : 1; // Up for bottom position, down for top
    const offset = (index + 1) * spacing * direction;

    return {
      transform: isOpen
        ? `translateY(${offset}px) scale(1)`
        : 'translateY(0) scale(0)',
      opacity: isOpen ? 1 : 0
    };
  };

  return (
    <TooltipProvider>
      <div
        ref={fabRef}
        className={cn(
          "fixed z-50 flex flex-col items-center",
          positionClasses[position],
          className
        )}
      >
        {/* Dropdown Menu */}
        {isOpen && (
          <Card className={cn(
            "absolute z-40 min-w-52 shadow-lg",
            position.includes('bottom') ? "bottom-16" : "top-16",
            position.includes('right') ? "right-0" : "left-0"
          )}>
            <CardContent className="p-2">
              <div className="space-y-1">
                {actions.slice(0, 6).map((action, index) => (
                  <Button
                    key={action.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-3 px-3 py-2 h-auto hover:bg-accent"
                    onClick={() => handleActionClick(action)}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white",
                      action.color
                    )}>
                      <action.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{action.label}</div>
                      {action.description && (
                        <div className="text-xs text-muted-foreground">
                          {action.description}
                        </div>
                      )}
                    </div>
                    <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border font-mono">
                      {index + 1}
                    </kbd>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main FAB Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className={cn(
                "rounded-full shadow-lg transition-all duration-300 ease-out",
                "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
                "transform-gpu will-change-transform hover:scale-110",
                sizeClasses[size],
                isOpen && "rotate-45"
              )}
              onClick={toggleFAB}
            >
              {isOpen ? (
                <X className={cn("text-white transition-transform duration-300", iconSizeClasses[size])} />
              ) : (
                <Zap className={cn("text-white transition-transform duration-300", iconSizeClasses[size])} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="ml-2">
            <div className="flex items-center gap-2">
              <div>
                <p className="font-medium">Quick Actions</p>
                <p className="text-xs text-muted-foreground">
                  {isOpen ? "Close menu (Esc)" : "Click for quick actions"}
                </p>
              </div>
              <kbd className="px-2 py-1 text-xs bg-muted rounded border font-mono">
                ⌘K
              </kbd>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Background Overlay for better visibility */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/10 backdrop-blur-[1px] -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

// Hook for custom FAB actions
export function useQuickActions() {
  const [customActions, setCustomActions] = useState<QuickAction[]>([]);

  const addAction = (action: QuickAction) => {
    setCustomActions(prev => [...prev, action]);
  };

  const removeAction = (actionId: string) => {
    setCustomActions(prev => prev.filter(action => action.id !== actionId));
  };

  const clearActions = () => {
    setCustomActions([]);
  };

  return {
    customActions,
    addAction,
    removeAction,
    clearActions
  };
}