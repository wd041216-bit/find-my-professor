import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Edit, Trash2, X } from "lucide-react";

export function ActivitiesSection() {
  const { data: activities, isLoading, refetch } = trpc.activities.list.useQuery();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    category: "project" as "research" | "volunteer" | "competition" | "internship" | "project" | "leadership" | "other",
    organization: "",
    role: "",
    description: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    skills: [] as string[],
    achievements: [] as string[],
  });

  const createMutation = trpc.activities.create.useMutation({
    onSuccess: () => {
      toast.success("Activity added!");
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to add activity: ${error.message}`);
    },
  });

  const updateMutation = trpc.activities.update.useMutation({
    onSuccess: () => {
      toast.success("Activity updated!");
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to update activity: ${error.message}`);
    },
  });

  const deleteMutation = trpc.activities.delete.useMutation({
    onSuccess: () => {
      toast.success("Activity deleted!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete activity: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      category: "project",
      organization: "",
      role: "",
      description: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      skills: [],
      achievements: [],
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error("Title is required");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (activity: any) => {
    setFormData({
      title: activity.title,
      category: activity.category,
      organization: activity.organization || "",
      role: activity.role || "",
      description: activity.description || "",
      startDate: activity.startDate ? new Date(activity.startDate).toISOString().split('T')[0] : "",
      endDate: activity.endDate ? new Date(activity.endDate).toISOString().split('T')[0] : "",
      isCurrent: activity.isCurrent,
      skills: activity.skills ? (typeof activity.skills === 'string' ? JSON.parse(activity.skills) : activity.skills) : [],
      achievements: activity.achievements ? (typeof activity.achievements === 'string' ? JSON.parse(activity.achievements) : activity.achievements) : [],
    });
    setEditingId(activity.id);
    setIsAdding(true);
  };

  const categoryLabels: Record<string, string> = {
    research: "Research",
    volunteer: "Volunteer",
    competition: "Competition",
    internship: "Internship",
    project: "Project",
    leadership: "Leadership",
    other: "Other",
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add/Edit Form */}
      {isAdding ? (
        <Card className="border-2 border-purple-200">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  {editingId ? "Edit Activity" : "Add New Activity"}
                </h3>
                <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Machine Learning Research Project"
                    required
                  />
                </div>

                <div>
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Organization</Label>
                  <Input
                    value={formData.organization}
                    onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                    placeholder="e.g., MIT CSAIL"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Role</Label>
                  <Input
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g., Research Assistant"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your role and contributions..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    disabled={formData.isCurrent}
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isCurrent}
                      onChange={(e) => setFormData(prev => ({ ...prev, isCurrent: e.target.checked, endDate: e.target.checked ? "" : prev.endDate }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Currently active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-gradient-to-r from-purple-600 to-pink-600">
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingId ? "Update" : "Add Activity"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full border-2 border-dashed border-purple-300 hover:border-purple-500">
          <Plus className="mr-2 h-4 w-4" />
          Add Activity
        </Button>
      )}

      {/* Activities List */}
      <div className="space-y-3">
        {activities && activities.length > 0 ? (
          activities.map((activity: any) => (
            <Card key={activity.id} className="border-l-4 border-l-purple-500">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-gray-800">{activity.title}</h4>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {categoryLabels[activity.category]}
                      </span>
                      {activity.source === 'resume_upload' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          From Resume
                        </span>
                      )}
                    </div>
                    {activity.organization && (
                      <p className="text-sm text-gray-600">{activity.organization}</p>
                    )}
                    {activity.role && (
                      <p className="text-sm text-gray-600 italic">{activity.role}</p>
                    )}
                    {activity.description && (
                      <p className="text-sm text-gray-700 mt-2">{activity.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {activity.startDate ? new Date(activity.startDate).toLocaleDateString() : "N/A"} - {activity.isCurrent ? "Present" : (activity.endDate ? new Date(activity.endDate).toLocaleDateString() : "N/A")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(activity)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: activity.id })} disabled={deleteMutation.isPending}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">
            No activities yet. Add your first activity or upload your resume to get started!
          </p>
        )}
      </div>
    </div>
  );
}
