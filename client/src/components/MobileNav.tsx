import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import {
  Menu,
  Home,
  User,
  Flame,
  Heart,
  LogOut,
  LogIn,
  Globe,
} from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface MobileNavProps {
  unreadCount?: number;
}

export function MobileNav({ unreadCount = 0 }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const [location] = useLocation();

  const closeNav = () => setOpen(false);

  // Simplified nav items for Tinder-style app
  const navItems = [
    { href: "/", icon: Home, label: t.nav.home },
    ...(isAuthenticated
      ? [
          { href: "/swipe", icon: Flame, label: "🔥 Swipe" },
          { href: "/matches", icon: Heart, label: "💖 Matches" },
          { href: "/profile", icon: User, label: t.nav.profile },
        ]
      : []),
  ];

  const isActive = (href: string) => location === href;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <SheetHeader className="border-b border-pink-200/50 pb-4 mb-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-orange-600 bg-clip-text text-transparent font-bold">
              Find My Professor
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-80px)]">
          {/* Navigation Links */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={closeNav}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive(item.href)
                      ? "bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 text-white shadow-lg"
                      : "hover:bg-white/60 text-gray-700"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="flex-1 font-medium">{item.label}</span>
                </div>
              </Link>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className="border-t border-pink-200/50 pt-4 space-y-3">
            {/* Language Switcher */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/60 rounded-xl">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Language</span>
              </div>
              <LanguageSwitcher />
            </div>

            {/* Auth Actions */}
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-4 py-2 text-sm font-medium text-gray-600 bg-white/60 rounded-xl">
                  {user?.name || user?.email}
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start border-pink-200 hover:bg-pink-50"
                  onClick={() => {
                    logout();
                    closeNav();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t.nav.logout}
                </Button>
              </div>
            ) : (
              <a href={getLoginUrl()} className="block">
                <Button className="w-full justify-start bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 hover:from-pink-600 hover:via-purple-600 hover:to-orange-600 text-white shadow-lg">
                  <LogIn className="mr-2 h-4 w-4" />
                  {t.nav.signIn}
                </Button>
              </a>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MobileNav;
