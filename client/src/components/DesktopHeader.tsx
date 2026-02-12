import { Link, useLocation } from "wouter";
import { Home, Heart, FileText, User, RotateCcw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DesktopHeaderProps {
  onResetClick?: () => void;
  onFilterClick?: () => void;
  showActions?: boolean;
}

export function DesktopHeader({ onResetClick, onFilterClick, showActions = false }: DesktopHeaderProps) {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Swipe", icon: Home },
    { path: "/history", label: "Matches", icon: Heart },
    { path: "/cover-letters", label: "Letters", icon: FileText },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <a className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">PM</span>
            </div>
            <span className="font-semibold text-lg">ProfMatch</span>
          </a>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <a
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons (Reset & Filter) */}
        {showActions && (
          <div className="flex items-center space-x-2">
            {onResetClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onResetClick}
                className="flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </Button>
            )}
            {onFilterClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onFilterClick}
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
