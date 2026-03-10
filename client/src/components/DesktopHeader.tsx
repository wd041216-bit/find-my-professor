import { Link, useLocation } from "wouter";
import { Home, Heart, FileText, User, RotateCcw, Filter, Languages, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocale } from "@/hooks/useLocale";

interface DesktopHeaderProps {
  onResetClick?: () => void;
  onFilterClick?: () => void;
  showActions?: boolean;
}

export function DesktopHeader({ onResetClick, onFilterClick, showActions = false }: DesktopHeaderProps) {
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { localePath } = useLocale();

  const navItems = [
    {
      path: localePath("/"),
      matchPaths: ["/", "/swipe", "/zh", "/zh/swipe"],
      label: language === "en" ? "Swipe" : "滑动",
      icon: Home,
    },
    {
      path: localePath("/history"),
      matchPaths: ["/history", "/zh/history"],
      label: language === "en" ? "Matches" : "匹配",
      icon: Heart,
    },
    {
      path: localePath("/cover-letters"),
      matchPaths: ["/cover-letters", "/zh/cover-letters"],
      label: language === "en" ? "Letters" : "文书",
      icon: FileText,
    },
    {
      path: localePath("/profile"),
      matchPaths: ["/profile", "/zh/profile"],
      label: language === "en" ? "Profile" : "资料",
      icon: User,
    },
    {
      path: localePath("/tutorial"),
      matchPaths: ["/tutorial", "/zh/tutorial"],
      label: language === "en" ? "Guide" : "指南",
      icon: BookOpen,
    },
  ];

  return (
    <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href={localePath("/")} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">PM</span>
          </div>
          <span className="font-semibold text-lg">ProfMatch</span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.matchPaths.some(
              (p) => location === p || (p !== "/" && p !== "/zh" && location.startsWith(p))
            );
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Language Switcher & Action Buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === "en" ? "zh" : "en")}
            className="flex items-center space-x-2"
          >
            <Languages className="w-4 h-4" />
            <span>{language === "en" ? "中文" : "EN"}</span>
          </Button>
          
          {showActions && (
            <>
              {onResetClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResetClick}
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t.swipe.reset}</span>
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
                  <span>{t.swipe.filter}</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
