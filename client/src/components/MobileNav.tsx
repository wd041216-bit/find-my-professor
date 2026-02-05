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
  LayoutDashboard,
  User,
  Search,
  FileText,
  Bell,
  MessageSquare,
  Shield,
  LogOut,
  LogIn,
  GraduationCap,
  History,
  Sparkles,
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

  const navItems = [
    { href: "/", icon: Home, label: t.nav.home },
    ...(isAuthenticated
      ? [
          { href: "/dashboard", icon: LayoutDashboard, label: t.nav.dashboard },
          { href: "/profile", icon: User, label: t.nav.profile },
          { href: "/activities", icon: FileText, label: t.nav.activities },
          { href: "/explore", icon: Search, label: t.nav.explore },
          { href: "/history", icon: History, label: t.dashboard?.matchHistory || "Match History" },
          { href: "/cover-letters", icon: Sparkles, label: t.dashboard?.yourCoverLetters || "Cover Letters" },
          {
            href: "/notifications",
            icon: Bell,
            label: t.nav.notifications,
            badge: unreadCount,
          },
        ]
      : [{ href: "/explore", icon: Search, label: t.nav.explore }]),
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
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader className="border-b pb-4 mb-4">
          <SheetTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Find My Professor
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-80px)]">
          {/* Navigation Links */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={closeNav}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            ))}

            {/* Admin links for admin users */}
            {isAuthenticated && user?.role === "admin" && (
              <>
                <Link href="/admin/messages" onClick={closeNav}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive("/admin/messages")
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span>Messages</span>
                  </div>
                </Link>
                <Link href="/admin/announcements" onClick={closeNav}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive("/admin/announcements")
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    <Shield className="h-5 w-5" />
                    <span>{t.admin?.announcements?.title || "Announcements"}</span>
                  </div>
                </Link>
              </>
            )}
          </nav>

          {/* Bottom Section */}
          <div className="border-t pt-4 space-y-3">
            {/* Language Switcher */}
            <div className="flex items-center justify-between px-3">
              <span className="text-sm text-muted-foreground">Language</span>
              <LanguageSwitcher />
            </div>

            {/* Auth Actions */}
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {user?.name || user?.email}
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start"
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
                <Button className="w-full justify-start">
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
