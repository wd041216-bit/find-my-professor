import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Save, Loader2, GraduationCap } from "lucide-react";
import { Footer } from "@/components/Footer";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MobileNav } from "@/components/MobileNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
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
      toast.success(t.common.success);
    },
    onError: (error) => {
      toast.error(`${t.common.error}: ${error.message}`);
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

      <div className="container px-4 py-4 md:py-8 max-w-4xl">
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-xl md:text-3xl">{t.profile.title}</CardTitle>
            <CardDescription className="text-sm md:text-base">
              {t.profile.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
              {/* Basic Information */}
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.profile.academicInfo}</h3>
                
                {/* Academic Level - First */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="academicLevel" className="text-sm">{t.profile.academicLevel}</Label>
                  <Select
                    value={formData.academicLevel}
                    onValueChange={(value: "high_school" | "undergraduate" | "graduate") => 
                      setFormData(prev => ({ ...prev, academicLevel: value }))
                    }
                  >
                    <SelectTrigger className="h-9 md:h-10">
                      <SelectValue placeholder="Select your academic level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_school">{t.profile.highSchool}</SelectItem>
                      <SelectItem value="undergraduate">{t.profile.undergraduate}</SelectItem>
                      <SelectItem value="graduate">{t.profile.graduate}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* GPA Input */}
                {formData.academicLevel && (
                  <div className="space-y-1.5 md:space-y-2">
                    <Label htmlFor="gpa" className="text-sm">{t.profile.gpa}</Label>
                    <Input
                      id="gpa"
                      value={formData.gpa}
                      onChange={(e) => setFormData(prev => ({ ...prev, gpa: e.target.value }))}
                      placeholder="e.g., 3.8/4.0"
                      className="h-9 md:h-10"
                    />
                  </div>
                )}
              </div>

              {/* Target Universities */}
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.profile.targetUniversities}</h3>
                <div className="flex gap-2">
                  <Input
                    value={targetUnivInput}
                    onChange={(e) => setTargetUnivInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("targetUniversities", targetUnivInput))}
                    placeholder={t.profile.addUniversity}
                    className="h-9 md:h-10 text-sm"
                  />
                  <Button type="button" size="sm" onClick={() => addItem("targetUniversities", targetUnivInput)} className="h-9 md:h-10">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {formData.targetUniversities.map((univ, index) => (
                    <div key={index} className="bg-secondary text-secondary-foreground px-2.5 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm flex items-center gap-1.5 md:gap-2">
                      {univ}
                      <button type="button" onClick={() => removeItem("targetUniversities", index)} className="hover:text-destructive">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Majors */}
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.profile.targetMajors}</h3>
                <div className="flex gap-2">
                  <Input
                    value={targetMajorInput}
                    onChange={(e) => setTargetMajorInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("targetMajors", targetMajorInput))}
                    placeholder={t.profile.addMajor}
                    className="h-9 md:h-10 text-sm"
                  />
                  <Button type="button" size="sm" onClick={() => addItem("targetMajors", targetMajorInput)} className="h-9 md:h-10">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {formData.targetMajors.map((major, index) => (
                    <div key={index} className="bg-secondary text-secondary-foreground px-2.5 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm flex items-center gap-1.5 md:gap-2">
                      {major}
                      <button type="button" onClick={() => removeItem("targetMajors", index)} className="hover:text-destructive">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.profile.skills}</h3>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("skills", skillInput))}
                    placeholder={t.profile.addSkill}
                    className="h-9 md:h-10 text-sm"
                  />
                  <Button type="button" size="sm" onClick={() => addItem("skills", skillInput)} className="h-9 md:h-10">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {formData.skills.map((skill, index) => (
                    <div key={index} className="bg-primary/10 text-primary px-2.5 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm flex items-center gap-1.5 md:gap-2">
                      {skill}
                      <button type="button" onClick={() => removeItem("skills", index)} className="hover:text-destructive">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.profile.interests}</h3>
                <div className="flex gap-2">
                  <Input
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("interests", interestInput))}
                    placeholder={t.profile.addInterest}
                    className="h-9 md:h-10 text-sm"
                  />
                  <Button type="button" size="sm" onClick={() => addItem("interests", interestInput)} className="h-9 md:h-10">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {formData.interests.map((interest, index) => (
                    <div key={index} className="bg-accent/10 text-accent-foreground px-2.5 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm flex items-center gap-1.5 md:gap-2">
                      {interest}
                      <button type="button" onClick={() => removeItem("interests", index)} className="hover:text-destructive">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">{t.profile.bio}</h3>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder={t.profile.bioPlaceholder}
                  rows={4}
                  className="text-sm"
                />
              </div>

              <Button type="submit" size="default" className="w-full h-10 md:h-11" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.profile.saving}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t.profile.saveProfile}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
