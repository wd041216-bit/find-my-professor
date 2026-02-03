import { Footer } from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Plus, Edit, Trash2, Loader2, Calendar, Building, GraduationCap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MobileNav } from "@/components/MobileNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

type ActivityCategory = "research" | "volunteer" | "competition" | "internship" | "project" | "leadership" | "other";

export default function Activities() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<number | null>(null);
  const { t } = useLanguage();

  const { data: activities = [], refetch } = trpc.activities.list.useQuery(undefined, {
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
    title: "",
    category: "" as ActivityCategory | "",
    organization: "",
    role: "",
    description: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    skills: [] as string[],
    achievements: [] as string[],
  });

  const [skillInput, setSkillInput] = useState("");
  const [achievementInput, setAchievementInput] = useState("");

  const createMutation = trpc.activities.create.useMutation({
    onSuccess: () => {
      toast.success(t.common.success);
      setIsDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`${t.common.error}: ${error.message}`);
    },
  });

  const updateMutation = trpc.activities.update.useMutation({
    onSuccess: () => {
      toast.success(t.common.success);
      setIsDialogOpen(false);
      setEditingActivity(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`${t.common.error}: ${error.message}`);
    },
  });

  const deleteMutation = trpc.activities.delete.useMutation({
    onSuccess: () => {
      toast.success(t.common.success);
      refetch();
    },
    onError: (error) => {
      toast.error(`${t.common.error}: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      category: "",
      organization: "",
      role: "",
      description: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      skills: [],
      achievements: [],
    });
    setSkillInput("");
    setAchievementInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category) {
      toast.error("Please fill in required fields");
      return;
    }

    const submitData = {
      title: formData.title,
      category: formData.category as ActivityCategory,
      organization: formData.organization || undefined,
      role: formData.role || undefined,
      description: formData.description || undefined,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      isCurrent: formData.isCurrent,
      skills: formData.skills.length > 0 ? formData.skills : undefined,
      achievements: formData.achievements.length > 0 ? formData.achievements : undefined,
    };

    if (editingActivity) {
      updateMutation.mutate({ id: editingActivity, ...submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (activity: typeof activities[0]) => {
    setEditingActivity(activity.id);
    setFormData({
      title: activity.title,
      category: activity.category,
      organization: activity.organization || "",
      role: activity.role || "",
      description: activity.description || "",
      startDate: activity.startDate ? new Date(activity.startDate).toISOString().split("T")[0] : "",
      endDate: activity.endDate ? new Date(activity.endDate).toISOString().split("T")[0] : "",
      isCurrent: activity.isCurrent || false,
      skills: activity.skills || [],
      achievements: activity.achievements || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this activity?")) {
      deleteMutation.mutate({ id });
    }
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const addAchievement = () => {
    if (achievementInput.trim()) {
      setFormData(prev => ({
        ...prev,
        achievements: [...prev.achievements, achievementInput.trim()],
      }));
      setAchievementInput("");
    }
  };

  const removeAchievement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index),
    }));
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      research: "bg-primary/10 text-primary",
      volunteer: "bg-green-500/10 text-green-700",
      competition: "bg-yellow-500/10 text-yellow-700",
      internship: "bg-blue-500/10 text-blue-700",
      project: "bg-purple-500/10 text-purple-700",
      leadership: "bg-red-500/10 text-red-700",
      other: "bg-gray-500/10 text-gray-700",
    };
    return colors[category] || colors.other;
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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-14 md:h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <MobileNav />
            <Link href="/dashboard" className="hidden md:block">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.common.back}
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm md:text-base">Find My Professor</span>
          </div>
          <div className="flex items-center">
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      <div className="container px-4 py-4 md:py-8 max-w-6xl">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-3xl font-bold">{t.activities.title}</h1>
            <p className="text-muted-foreground text-sm md:text-base">{t.activities.subtitle}</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingActivity(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                {t.activities.addActivity}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader>
                <DialogTitle className="text-lg md:text-xl">{editingActivity ? t.activities.editActivity : t.activities.addActivity}</DialogTitle>
                <DialogDescription className="text-sm">
                  {editingActivity ? "Update your activity details" : "Add a new experience to your profile"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="title" className="text-sm">{t.activities.activityTitle} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Machine Learning Research Assistant"
                    required
                    className="h-9 md:h-10 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="category" className="text-sm">{t.activities.category} *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: ActivityCategory) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="h-9 md:h-10">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="research">{t.activities.research}</SelectItem>
                        <SelectItem value="volunteer">{t.activities.volunteer}</SelectItem>
                        <SelectItem value="competition">{t.activities.competition}</SelectItem>
                        <SelectItem value="internship">{t.activities.internship}</SelectItem>
                        <SelectItem value="project">{t.activities.project}</SelectItem>
                        <SelectItem value="leadership">{t.activities.leadership}</SelectItem>
                        <SelectItem value="other">{t.activities.other}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="organization" className="text-sm">{t.activities.organization}</Label>
                    <Input
                      id="organization"
                      value={formData.organization}
                      onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                      placeholder="e.g., Stanford AI Lab"
                      className="h-9 md:h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="role" className="text-sm">{t.activities.role}</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g., Research Assistant"
                    className="h-9 md:h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="description" className="text-sm">{t.activities.description}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your responsibilities and contributions..."
                    rows={3}
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="startDate" className="text-sm">{t.activities.startDate}</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="h-9 md:h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="endDate" className="text-sm">{t.activities.endDate}</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      disabled={formData.isCurrent}
                      className="h-9 md:h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isCurrent"
                    checked={formData.isCurrent}
                    onChange={(e) => setFormData(prev => ({ ...prev, isCurrent: e.target.checked, endDate: e.target.checked ? "" : prev.endDate }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isCurrent" className="cursor-pointer text-sm">{t.activities.currentActivity}</Label>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-sm">{t.activities.skillsGained}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      placeholder="Add a skill"
                      className="h-9 md:h-10 text-sm"
                    />
                    <Button type="button" size="sm" onClick={addSkill} className="h-9 md:h-10">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {formData.skills.map((skill, index) => (
                      <div key={index} className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs md:text-sm flex items-center gap-1.5">
                        {skill}
                        <button type="button" onClick={() => removeSkill(index)} className="hover:text-destructive">×</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-sm">{t.activities.achievements}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={achievementInput}
                      onChange={(e) => setAchievementInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAchievement())}
                      placeholder="Add an achievement"
                      className="h-9 md:h-10 text-sm"
                    />
                    <Button type="button" size="sm" onClick={addAchievement} className="h-9 md:h-10">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {formData.achievements.map((achievement, index) => (
                      <div key={index} className="bg-accent/10 text-accent-foreground px-2.5 py-0.5 rounded-full text-xs md:text-sm flex items-center gap-1.5">
                        {achievement}
                        <button type="button" onClick={() => removeAchievement(index)} className="hover:text-destructive">×</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-3 md:pt-4">
                  <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 h-9 md:h-10">
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.common.loading}
                      </>
                    ) : (
                      editingActivity ? t.activities.save : t.activities.save
                    )}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="h-9 md:h-10">
                    {t.common.cancel}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {activities.length === 0 ? (
          <Card>
            <CardContent className="py-12 md:py-16 text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Plus className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">{t.activities.noActivities}</h3>
              <p className="text-muted-foreground text-sm md:text-base mb-4 md:mb-6">
                {t.activities.addFirst}
              </p>
              <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t.activities.addActivity}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {activities.map((activity) => (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:pt-6 md:p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5 md:mb-2">
                        <h3 className="text-base md:text-xl font-semibold truncate">{activity.title}</h3>
                        <Badge className={`${getCategoryColor(activity.category)} text-xs`}>
                          {activity.category}
                        </Badge>
                      </div>
                      
                      {activity.organization && (
                        <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground text-xs md:text-sm mb-1.5 md:mb-2">
                          <Building className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="truncate">{activity.organization}</span>
                          {activity.role && <span className="hidden sm:inline">• {activity.role}</span>}
                        </div>
                      )}
                      
                      {(activity.startDate || activity.endDate) && (
                        <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
                          <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                          <span>
                            {activity.startDate ? new Date(activity.startDate).toLocaleDateString() : "N/A"} - {" "}
                            {activity.isCurrent ? "Present" : activity.endDate ? new Date(activity.endDate).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      )}
                      
                      {activity.description && (
                        <p className="text-muted-foreground text-xs md:text-sm mb-2 md:mb-3 line-clamp-2 md:line-clamp-none">{activity.description}</p>
                      )}
                      
                      {activity.skills && activity.skills.length > 0 && (
                        <div className="mb-1.5 md:mb-2">
                          <div className="flex flex-wrap gap-1 md:gap-2">
                            {activity.skills.slice(0, 4).map((skill: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-[10px] md:text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {activity.skills.length > 4 && (
                              <Badge variant="secondary" className="text-[10px] md:text-xs">+{activity.skills.length - 4}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1 md:gap-2 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9" onClick={() => handleEdit(activity)}>
                        <Edit className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 md:h-9 md:w-9"
                        onClick={() => handleDelete(activity.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
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
