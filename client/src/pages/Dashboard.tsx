import { useAuth } from "@/_core/hooks/useAuth";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { User, FileText, Search, Bell, Plus, ArrowRight, GraduationCap, Shield, Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MobileNav } from "@/components/MobileNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: activities = [] } = trpc.activities.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: notifications = [] } = trpc.notifications.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: !!user,
  });

  // Credits balance removed - payment feature not yet launched
  // TODO: Implement daily free credits display

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  // Only check profile completeness after data is loaded to avoid flashing
  const profileComplete = profileLoading ? true : (profile && profile.currentUniversity && profile.currentMajor && profile.academicLevel);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-14 md:h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <MobileNav unreadCount={unreadCount} />
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <GraduationCap className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                <span className="text-lg md:text-xl font-bold text-foreground hidden sm:inline">Find My Professor</span>
              </div>
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-2 lg:gap-4">
            <Link href="/explore">
              <Button variant="ghost" size="sm">
                <Search className="mr-2 h-4 w-4" />
                {t.nav.explore}
              </Button>
            </Link>
            {/* Credits button removed - payment feature not yet launched */}
            <Link href="/notifications">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </Link>
            {user.role === "admin" && (
              <Link href="/admin/messages">
                <Button variant="ghost" size="sm">
                  <Shield className="mr-2 h-4 w-4" />
                  {t.nav.admin}
                </Button>
              </Link>
            )}
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              {t.nav.logout}
            </Button>
          </div>
          {/* Mobile right side */}
          <div className="flex md:hidden items-center gap-1">
            {/* Credits button removed - payment feature not yet launched */}
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      <div className="container px-4 py-4 md:py-8 max-w-4xl">
        {/* Welcome Section */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">{t.dashboard.welcomeBack}, {user.name}!</h1>
          <p className="text-muted-foreground text-sm md:text-lg">
            {t.dashboard.manageProfile}
          </p>
        </div>

        {/* Profile Completion Alert */}
        {!profileComplete && (
          <Card className="mb-6 md:mb-8 border-accent bg-accent/5">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <User className="h-4 w-4 md:h-5 md:w-5" />
                {t.dashboard.completeProfile}
              </CardTitle>
              <CardDescription className="text-sm">
                {t.dashboard.completeProfileDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              <Link href="/profile">
                <Button size="sm">
                  {t.dashboard.completeProfile}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Smart Matching - Hero CTA */}
        <Card className="mb-6 md:mb-8 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Search className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-bold mb-2">
                  {t.dashboard.smartMatching || "Smart Matching"}
                </h2>
                <p className="text-muted-foreground text-sm md:text-base">
                  {t.dashboard.smartMatchingDesc || "Find research opportunities that match your profile and interests"}
                </p>
              </div>
              <Link href="/explore">
                <Button size="lg" className="w-full md:w-auto">
                  {t.dashboard.searchProjects}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-6 md:mb-8">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">{t.dashboard.quickActions}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0 grid grid-cols-2 gap-3 md:gap-4">
            <Link href="/profile">
              <Button variant="outline" size="lg" className="w-full h-auto py-4 flex-col gap-2">
                <User className="h-6 w-6" />
                <span className="text-sm">{t.dashboard.editProfile || "Edit Profile"}</span>
              </Button>
            </Link>
            <Link href="/upload-resume">
              <Button variant="outline" size="lg" className="w-full h-auto py-4 flex-col gap-2">
                <FileText className="h-6 w-6" />
                <span className="text-sm">{t.dashboard.uploadResume}</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Activities - Hidden on mobile since Activities page is in navigation */}
        <Card className="mb-6 md:mb-8 hidden md:block">
          <CardHeader className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div>
              <CardTitle className="text-base md:text-lg">{t.dashboard.yourActivities}</CardTitle>
              <CardDescription className="text-sm">{activities.length} {t.dashboard.totalExperiences}</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Link href="/activities" className="flex-1 sm:flex-initial">
                <Button size="sm" variant="default" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  {t.dashboard.addActivity}
                </Button>
              </Link>
              <Link href="/activities" className="flex-1 sm:flex-initial">
                <Button size="sm" variant="outline" className="w-full">
                  {t.dashboard.viewAllActivities}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            {activities.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <FileText className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
                <p className="text-muted-foreground mb-3 md:mb-4 text-sm">{t.dashboard.noActivities}</p>
                <Link href="/activities">
                  <Button variant="outline" size="sm">{t.dashboard.addFirstActivity}</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {activities.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="border rounded-lg p-3 md:p-4 hover:bg-accent/5 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1 md:mb-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm md:text-base truncate">{activity.title}</h4>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">{activity.organization}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">{activity.category}</Badge>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{activity.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications removed - notification bar in header is sufficient */}
      </div>
      <Footer />
    </div>
  );
}
