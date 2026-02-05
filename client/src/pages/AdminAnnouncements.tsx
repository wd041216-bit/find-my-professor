import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, Plus, Trash2, Megaphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminAnnouncements() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    durationDays: 7,
  });

  const { data: announcements, isLoading, refetch } = trpc.announcements.getAll.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const createMutation = trpc.announcements.create.useMutation({
    onSuccess: () => {
      toast.success(t.admin.announcements.createSuccess || "Announcement created successfully");
      setFormData({ title: "", content: "", durationDays: 7 });
      setShowCreateForm(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`${t.common.error}: ${error.message}`);
    },
  });

  const deleteMutation = trpc.announcements.delete.useMutation({
    onSuccess: () => {
      toast.success(t.admin.announcements.deleteSuccess || "Announcement deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`${t.common.error}: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error(t.admin.announcements.validationError || "Title and content are required");
      return;
    }
    
    createMutation.mutate(formData);
  };

  const handleDelete = (id: number) => {
    if (confirm(t.admin.announcements.confirmDelete || "Are you sure you want to delete this announcement?")) {
      deleteMutation.mutate({ id });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isActive = (startDate: Date, endDate: Date) => {
    const now = new Date();
    return new Date(startDate) <= now && new Date(endDate) >= now;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t.admin.announcements.title || "Announcements Management"}</h1>
            <p className="text-muted-foreground mt-2">
              {t.admin.announcements.subtitle || "Create and manage system announcements for all users"}
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="mr-2 h-4 w-4" />
            {t.admin.announcements.createNew || "Create Announcement"}
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>{t.admin.announcements.createTitle || "New Announcement"}</CardTitle>
              <CardDescription>
                {t.admin.announcements.createDescription || "Create a new announcement that will be visible to all users"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t.admin.announcements.titleLabel || "Title"}</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={t.admin.announcements.titlePlaceholder || "Enter announcement title"}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">{t.admin.announcements.contentLabel || "Content"}</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder={t.admin.announcements.contentPlaceholder || "Enter announcement content"}
                    rows={5}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">{t.admin.announcements.durationLabel || "Duration (days)"}</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    max={365}
                    value={formData.durationDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, durationDays: parseInt(e.target.value) }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t.admin.announcements.durationHint || "How many days this announcement will be active"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.common.processing || "Processing..."}
                      </>
                    ) : (
                      t.admin.announcements.create || "Create"
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    {t.common.cancel}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Announcements List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : announcements && announcements.length > 0 ? (
            announcements.map((announcement) => (
              <Card key={announcement.id} className={isActive(announcement.startDate, announcement.endDate) ? "border-primary" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-primary" />
                      <CardTitle>{announcement.title}</CardTitle>
                      {isActive(announcement.startDate, announcement.endDate) && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                          {t.admin.announcements.active || "Active"}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(announcement.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <CardDescription>
                    {formatDate(announcement.startDate)} - {formatDate(announcement.endDate)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {t.admin.announcements.noAnnouncements || "No announcements yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
