import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { User, FileText, Search, Bell, Plus, ArrowRight, GraduationCap, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MobileNav } from "@/components/MobileNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const { data: profile } = trpc.profile.get.useQuery(undefined, {
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

  const profileComplete = profile && profile.currentUniversity && profile.currentMajor && profile.academicLevel;

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

      <div className="container px-4 py-4 md:py-8">
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

        {/* Quick Stats - Scrollable on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader className="p-3 md:pb-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{t.dashboard.activities}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-2xl md:text-3xl font-bold">{activities.length}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">{t.dashboard.totalExperiences}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 md:pb-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{t.dashboard.matches}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-2xl md:text-3xl font-bold">0</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">{t.dashboard.researchProjects}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 md:pb-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{t.dashboard.applications}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-2xl md:text-3xl font-bold">0</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">{t.dashboard.lettersGenerated}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 md:pb-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{t.nav.notifications}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-2xl md:text-3xl font-bold">{unreadCount}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">{t.dashboard.unreadMessages}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column - Activities */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <Card>
              <CardHeader className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div>
                  <CardTitle className="text-base md:text-lg">{t.dashboard.yourActivities}</CardTitle>
                  <CardDescription className="text-sm">{t.dashboard.manageExperiences}</CardDescription>
                </div>
                <Link href="/activities">
                  <Button size="sm" className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    {t.dashboard.addActivity}
                  </Button>
                </Link>
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
                    {activities.length > 3 && (
                      <Link href="/activities">
                        <Button variant="ghost" size="sm" className="w-full">
                          {t.dashboard.viewAllActivities}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">{t.dashboard.quickActions}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 md:p-6 md:pt-0 grid grid-cols-2 gap-2 md:gap-4">
                <Link href="/explore">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs md:text-sm h-9 md:h-10">
                    <Search className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                    {t.dashboard.searchProjects}
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs md:text-sm h-9 md:h-10">
                    <User className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                    {t.dashboard.editProfile}
                  </Button>
                </Link>
                <Link href="/activities">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs md:text-sm h-9 md:h-10">
                    <Plus className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                    {t.dashboard.addActivity}
                  </Button>
                </Link>
                <Link href="/upload-resume">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs md:text-sm h-9 md:h-10">
                    <FileText className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                    {t.dashboard.uploadResume}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile & Notifications */}
          <div className="space-y-4 md:space-y-6">
            {/* Profile Summary */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">{t.dashboard.profileSummary}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 md:p-6 md:pt-0 space-y-3 md:space-y-4">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-0.5 md:mb-1">{t.dashboard.currentUniversity}</p>
                  <p className="font-medium text-sm md:text-base">{profile?.currentUniversity || t.dashboard.notSet}</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-0.5 md:mb-1">{t.dashboard.major}</p>
                  <p className="font-medium text-sm md:text-base">{profile?.currentMajor || t.dashboard.notSet}</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-0.5 md:mb-1">{t.dashboard.academicLevel}</p>
                  <p className="font-medium text-sm md:text-base capitalize">{profile?.academicLevel?.replace("_", " ") || t.dashboard.notSet}</p>
                </div>
                <Link href="/profile">
                  <Button variant="outline" size="sm" className="w-full">
                    {t.dashboard.editProfile}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">{t.dashboard.recentNotifications}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 md:py-8">
                    <Bell className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs md:text-sm text-muted-foreground">{t.dashboard.noNotifications}</p>
                  </div>
                ) : (
                  <div className="space-y-2 md:space-y-3">
                    {notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className={`text-sm p-2.5 md:p-3 rounded-lg ${notification.read ? "bg-muted/30" : "bg-accent/10"}`}>
                        <p className="font-medium mb-0.5 md:mb-1 text-xs md:text-sm">{notification.title}</p>
                        <p className="text-muted-foreground text-[10px] md:text-xs">{notification.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
