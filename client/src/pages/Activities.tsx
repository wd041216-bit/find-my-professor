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
import { ArrowLeft, Plus, Edit, Trash2, Loader2, Calendar, Building } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ActivityCategory = "research" | "volunteer" | "competition" | "internship" | "project" | "leadership" | "other";

export default function Activities() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<number | null>(null);

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
      toast.success("Activity created successfully!");
      setIsDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create activity: ${error.message}`);
    },
  });

  const updateMutation = trpc.activities.update.useMutation({
    onSuccess: () => {
      toast.success("Activity updated successfully!");
      setIsDialogOpen(false);
      setEditingActivity(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update activity: ${error.message}`);
    },
  });

  const deleteMutation = trpc.activities.delete.useMutation({
    onSuccess: () => {
      toast.success("Activity deleted successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete activity: ${error.message}`);
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
      <div className="container py-8 max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingActivity(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingActivity ? "Edit Activity" : "Add New Activity"}</DialogTitle>
                <DialogDescription>
                  {editingActivity ? "Update your activity details" : "Add a new experience to your profile"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Machine Learning Research Assistant"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: ActivityCategory) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="research">Research</SelectItem>
                        <SelectItem value="volunteer">Volunteer</SelectItem>
                        <SelectItem value="competition">Competition</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="leadership">Leadership</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Input
                      id="organization"
                      value={formData.organization}
                      onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                      placeholder="e.g., Stanford AI Lab"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g., Research Assistant"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your responsibilities and contributions..."
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      disabled={formData.isCurrent}
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
                  <Label htmlFor="isCurrent" className="cursor-pointer">Currently active</Label>
                </div>

                <div className="space-y-2">
                  <Label>Skills</Label>
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      placeholder="Add a skill"
                    />
                    <Button type="button" onClick={addSkill}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <div key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {skill}
                        <button type="button" onClick={() => removeSkill(index)} className="hover:text-destructive">×</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Achievements</Label>
                  <div className="flex gap-2">
                    <Input
                      value={achievementInput}
                      onChange={(e) => setAchievementInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAchievement())}
                      placeholder="Add an achievement"
                    />
                    <Button type="button" onClick={addAchievement}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.achievements.map((achievement, index) => (
                      <div key={index} className="bg-accent/10 text-accent-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {achievement}
                        <button type="button" onClick={() => removeAchievement(index)} className="hover:text-destructive">×</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1">
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      editingActivity ? "Update Activity" : "Create Activity"
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Your Activities</CardTitle>
            <CardDescription>
              Manage your experiences, achievements, and extracurricular activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No activities yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start building your profile by adding your first activity
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Activity
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <Card key={activity.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">{activity.title}</h3>
                            <Badge className={getCategoryColor(activity.category)}>
                              {activity.category}
                            </Badge>
                          </div>
                          
                          {activity.organization && (
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                              <Building className="h-4 w-4" />
                              <span>{activity.organization}</span>
                              {activity.role && <span>• {activity.role}</span>}
                            </div>
                          )}
                          
                          {(activity.startDate || activity.endDate) && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {activity.startDate ? new Date(activity.startDate).toLocaleDateString() : "N/A"} - {" "}
                                {activity.isCurrent ? "Present" : activity.endDate ? new Date(activity.endDate).toLocaleDateString() : "N/A"}
                              </span>
                            </div>
                          )}
                          
                          {activity.description && (
                            <p className="text-muted-foreground mb-3">{activity.description}</p>
                          )}
                          
                          {activity.skills && activity.skills.length > 0 && (
                            <div className="mb-2">
                              <p className="text-sm font-medium mb-2">Skills:</p>
                              <div className="flex flex-wrap gap-2">
                                {activity.skills.map((skill: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {activity.achievements && activity.achievements.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Achievements:</p>
                              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                {activity.achievements.map((achievement: string, index: number) => (
                                  <li key={index}>{achievement}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(activity)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(activity.id)}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
