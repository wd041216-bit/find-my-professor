import { Footer } from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Bell, BellOff, Loader2, CheckCheck, Trash2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Notifications() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const { data: notifications = [], refetch, isLoading } = trpc.notifications.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: announcements = [], isLoading: announcementsLoading } = trpc.announcements.getActive.useQuery();

  const markReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      toast.success("Notification marked as read");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to mark as read: ${error.message}`);
    },
  });

  const markAllReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      toast.success("All notifications marked as read");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to mark all as read: ${error.message}`);
    },
  });

  const deleteMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      toast.success("Notification deleted");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to delete notification: ${error.message}`);
    },
  });

  const handleMarkAsRead = (id: number) => {
    markReadMutation.mutate({ id });
  };

  const handleMarkAllAsRead = () => {
    // Mark all unread notifications as read
    const unreadNotifications = notifications.filter(n => !n.read);
    unreadNotifications.forEach(n => markReadMutation.mutate({ id: n.id }));
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this notification?")) {
      // For now, just mark as read since we don't have a delete endpoint
      markReadMutation.mutate({ id });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <span className="font-semibold">Notifications</span>
          </div>
        </div>
      </nav>

      <div className="container py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              variant="outline"
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Active Announcements */}
        {!announcementsLoading && announcements.length > 0 && (
          <div className="mb-6 space-y-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              {t.notifications?.announcements || "System Announcements"}
            </h2>
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="border-primary/50 bg-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-primary" />
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
                    <Badge variant="default" className="text-xs">
                      {t.notifications?.announcement || "Announcement"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap mb-2">{announcement.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(announcement.startDate).toLocaleDateString()} - {new Date(announcement.endDate).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Notifications List */}
        <h2 className="text-xl font-semibold mb-4">{t.notifications?.yourNotifications || "Your Notifications"}</h2>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <BellOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No notifications yet</h3>
              <p className="text-muted-foreground mb-6">
                We'll notify you when there are updates about your research matches
              </p>
              <Link href="/explore">
                <Button>Explore Projects</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all ${
                  notification.read
                    ? "bg-background"
                    : "bg-accent/5 border-l-4 border-l-primary"
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{notification.title}</h3>
                        {!notification.read && (
                          <Badge variant="default" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-3">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markReadMutation.isPending}
                        >
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
