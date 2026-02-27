import { Link, useLocation } from "wouter";
import { Home, Heart, FileText, User, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

export function BottomNav() {
  const [location] = useLocation();
  const { language } = useLanguage();

  const navItems: NavItem[] = [
    { icon: Home, label: language === "en" ? "Swipe" : "滑动", path: "/" },
    { icon: Heart, label: language === "en" ? "Matches" : "匹配", path: "/history" },
    { icon: FileText, label: language === "en" ? "Letters" : "文书", path: "/cover-letters" },
    { icon: User, label: language === "en" ? "Profile" : "资料", path: "/profile" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));

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
