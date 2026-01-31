import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
    currentUniversity: "",
    currentMajor: "",
    academicLevel: "" as "high_school" | "undergraduate" | "graduate" | "",
    gpa: "",
    targetUniversities: [] as string[],
    targetMajors: [] as string[],
    skills: [] as string[],
    interests: [] as string[],
    bio: "",
  });

  const [targetUnivInput, setTargetUnivInput] = useState("");
  const [targetMajorInput, setTargetMajorInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  useEffect(() => {
    if (profile) {
      setFormData({
        currentUniversity: profile.currentUniversity || "",
        currentMajor: profile.currentMajor || "",
        academicLevel: profile.academicLevel || "",
        gpa: profile.gpa || "",
        targetUniversities: profile.targetUniversities ? JSON.parse(profile.targetUniversities) : [],
        targetMajors: profile.targetMajors ? JSON.parse(profile.targetMajors) : [],
        skills: profile.skills ? JSON.parse(profile.skills) : [],
        interests: profile.interests ? JSON.parse(profile.interests) : [],
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  const upsertMutation = trpc.profile.upsert.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      academicLevel: formData.academicLevel || undefined,
    };
    upsertMutation.mutate(submitData);
  };

  const addItem = (type: "targetUniversities" | "targetMajors" | "skills" | "interests", value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], value.trim()],
      }));
      
      if (type === "targetUniversities") setTargetUnivInput("");
      if (type === "targetMajors") setTargetMajorInput("");
      if (type === "skills") setSkillInput("");
      if (type === "interests") setInterestInput("");
    }
  };

  const removeItem = (type: "targetUniversities" | "targetMajors" | "skills" | "interests", index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  if (authLoading || profileLoading) {
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
      <div className="container py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Student Profile</CardTitle>
            <CardDescription>
              Complete your profile to get better research project matches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentUniversity">Current University</Label>
                    <Input
                      id="currentUniversity"
                      value={formData.currentUniversity}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentUniversity: e.target.value }))}
                      placeholder="e.g., Stanford University"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentMajor">Current Major</Label>
                    <Input
                      id="currentMajor"
                      value={formData.currentMajor}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentMajor: e.target.value }))}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="academicLevel">Academic Level</Label>
                    <Select
                      value={formData.academicLevel}
                      onValueChange={(value: "high_school" | "undergraduate" | "graduate") => 
                        setFormData(prev => ({ ...prev, academicLevel: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high_school">High School</SelectItem>
                        <SelectItem value="undergraduate">Undergraduate</SelectItem>
                        <SelectItem value="graduate">Graduate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gpa">GPA</Label>
                    <Input
                      id="gpa"
                      type="number"
                      step="0.01"
                      value={formData.gpa}
                      onChange={(e) => setFormData(prev => ({ ...prev, gpa: e.target.value }))}
                      placeholder="e.g., 3.85"
                    />
                  </div>
                </div>
              </div>

              {/* Target Universities */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Target Universities</h3>
                <div className="flex gap-2">
                  <Input
                    value={targetUnivInput}
                    onChange={(e) => setTargetUnivInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("targetUniversities", targetUnivInput))}
                    placeholder="Add a target university"
                  />
                  <Button type="button" onClick={() => addItem("targetUniversities", targetUnivInput)}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.targetUniversities.map((univ, index) => (
                    <div key={index} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {univ}
                      <button type="button" onClick={() => removeItem("targetUniversities", index)} className="hover:text-destructive">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Majors */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Target Majors</h3>
                <div className="flex gap-2">
                  <Input
                    value={targetMajorInput}
                    onChange={(e) => setTargetMajorInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("targetMajors", targetMajorInput))}
                    placeholder="Add a target major"
                  />
                  <Button type="button" onClick={() => addItem("targetMajors", targetMajorInput)}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.targetMajors.map((major, index) => (
                    <div key={index} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {major}
                      <button type="button" onClick={() => removeItem("targetMajors", index)} className="hover:text-destructive">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Skills</h3>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("skills", skillInput))}
                    placeholder="Add a skill"
                  />
                  <Button type="button" onClick={() => addItem("skills", skillInput)}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <div key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {skill}
                      <button type="button" onClick={() => removeItem("skills", index)} className="hover:text-destructive">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Research Interests</h3>
                <div className="flex gap-2">
                  <Input
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("interests", interestInput))}
                    placeholder="Add a research interest"
                  />
                  <Button type="button" onClick={() => addItem("interests", interestInput)}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.interests.map((interest, index) => (
                    <div key={index} className="bg-accent/10 text-accent-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {interest}
                      <button type="button" onClick={() => removeItem("interests", index)} className="hover:text-destructive">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Bio</h3>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself, your academic journey, and research goals..."
                  rows={6}
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
