import { Link, useLocation } from "wouter";
import { Home, Heart, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocale } from "@/hooks/useLocale";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  matchPaths: string[];
}

export function BottomNav() {
  const [location] = useLocation();
  const { language } = useLanguage();
  const { localePath } = useLocale();

  const navItems: NavItem[] = [
    {
      icon: Home,
      label: language === "en" ? "Swipe" : "滑动",
      path: localePath("/"),
      matchPaths: ["/", "/swipe", "/zh", "/zh/swipe"],
    },
    {
      icon: Heart,
      label: language === "en" ? "Matches" : "匹配",
      path: localePath("/history"),
      matchPaths: ["/history", "/zh/history"],
    },
    {
      icon: FileText,
      label: language === "en" ? "Letters" : "文书",
      path: localePath("/cover-letters"),
      matchPaths: ["/cover-letters", "/zh/cover-letters"],
    },
    {
      icon: User,
      label: language === "en" ? "Profile" : "资料",
      path: localePath("/profile"),
      matchPaths: ["/profile", "/zh/profile"],
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.matchPaths.some(
            (p) => location === p || (p !== "/" && p !== "/zh" && location.startsWith(p))
          );
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all",
                  isActive
                    ? "text-purple-600 bg-purple-50"
                    : "text-gray-600 hover:text-purple-600 hover:bg-gray-50"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "fill-purple-600")} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
