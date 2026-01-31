import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { User, FileText, Search, Bell, Plus, ArrowRight, GraduationCap, MessageSquare, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

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
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-foreground">Find My Professor</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/explore">
              <Button variant="ghost">
                <Search className="mr-2 h-4 w-4" />
                Explore
              </Button>
            </Link>
            <Link href="/notifications">
              <Button variant="ghost" className="relative">
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
                <Button variant="ghost">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
            <Button variant="ghost" onClick={() => logout()}>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user.name}!</h1>
          <p className="text-muted-foreground text-lg">
            Manage your profile, activities, and research opportunities
          </p>
        </div>

        {/* Profile Completion Alert */}
        {!profileComplete && (
          <Card className="mb-8 border-accent bg-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Complete Your Profile
              </CardTitle>
              <CardDescription>
                Fill out your profile to get personalized research project recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/profile">
                <Button>
                  Complete Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activities.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Total experiences</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Research projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Letters generated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{unreadCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Unread messages</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Activities */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Activities</CardTitle>
                  <CardDescription>Manage your experiences and achievements</CardDescription>
                </div>
                <Link href="/activities">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Activity
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No activities yet</p>
                    <Link href="/activities">
                      <Button variant="outline">Add Your First Activity</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.slice(0, 3).map((activity) => (
                      <div key={activity.id} className="border rounded-lg p-4 hover:bg-accent/5 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{activity.title}</h4>
                            <p className="text-sm text-muted-foreground">{activity.organization}</p>
                          </div>
                          <Badge variant="secondary">{activity.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{activity.description}</p>
                      </div>
                    ))}
                    {activities.length > 3 && (
                      <Link href="/activities">
                        <Button variant="ghost" className="w-full">
                          View All Activities
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
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <Link href="/explore">
                  <Button variant="outline" className="w-full justify-start">
                    <Search className="mr-2 h-4 w-4" />
                    Search Projects
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full justify-start">
                    <User className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </Link>
                <Link href="/activities">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Activity
                  </Button>
                </Link>
                <Link href="/upload-resume">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Upload Resume
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile & Notifications */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current University</p>
                  <p className="font-medium">{profile?.currentUniversity || "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Major</p>
                  <p className="font-medium">{profile?.currentMajor || "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Academic Level</p>
                  <p className="font-medium capitalize">{profile?.academicLevel?.replace("_", " ") || "Not set"}</p>
                </div>
                <Link href="/profile">
                  <Button variant="outline" className="w-full">
                    Edit Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className={`text-sm p-3 rounded-lg ${notification.read ? "bg-muted/30" : "bg-accent/10"}`}>
                        <p className="font-medium mb-1">{notification.title}</p>
                        <p className="text-muted-foreground text-xs">{notification.message}</p>
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
