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
import { SmartInput } from "@/components/SmartInput";
import { getUniversitySuggestions, getMajorSuggestions, normalizeUniversity, normalizeMajor } from "@shared/translations";

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
    targetUniversity: "" as string,
    targetMajors: [] as string[],
    skills: [] as string[],
    interests: [] as string[],
    bio: "",
  });


  const [targetMajorInput, setTargetMajorInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  useEffect(() => {
    if (profile) {
      setFormData({
        academicLevel: profile.academicLevel || "",
        gpa: profile.gpa || "",
        targetUniversity: (() => {
          try {
            const universities = profile.targetUniversities ? JSON.parse(profile.targetUniversities) : [];
            return Array.isArray(universities) && universities.length > 0 ? universities[0] : "";
          } catch (e) {
            return "";
          }
        })(),
        targetMajors: (() => {
          try {
            const parsed = profile.targetMajors ? JSON.parse(profile.targetMajors) : [];
            return Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            return [];
          }
        })(),
        skills: (() => {
          try {
            const parsed = profile.skills ? JSON.parse(profile.skills) : [];
            return Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            return [];
          }
        })(),
        interests: (() => {
          try {
            const parsed = profile.interests ? JSON.parse(profile.interests) : [];
            return Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            return [];
          }
        })(),
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
    
    // Validation: Target university is required
    if (!formData.targetUniversity || formData.targetUniversity.trim() === "") {
      toast.error(t.profile.validationRequired);
      return;
    }
    
    // Friendly reminder: Multiple universities
    if (formData.targetUniversity && !formData.targetUniversity.includes(",")) {
      // Show info toast for single university (non-blocking)
      toast.info(t.profile.validationMultipleUniversities, { duration: 5000 });
    }
    
    // Friendly reminder: Target majors
    if (formData.targetMajors.length === 0) {
      toast.info(t.profile.validationMajorRequired, { duration: 5000 });
    }
    
    // Friendly reminder: Skills
    if (formData.skills.length === 0) {
      toast.info(t.profile.validationSkillsRecommended, { duration: 5000 });
    }
    
    const submitData = {
      ...formData,
      targetUniversities: formData.targetUniversity ? [formData.targetUniversity] : [],
      academicLevel: formData.academicLevel || undefined,
    };
    upsertMutation.mutate(submitData);
  };

  const addItem = (type: "targetMajors" | "skills" | "interests", value: string) => {
    if (value.trim()) {
      // Normalize major input if it's Chinese
      const normalizedValue = type === "targetMajors" ? normalizeMajor(value.trim()) : value.trim();
      
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], normalizedValue],
      }));
      
      if (type === "targetMajors") setTargetMajorInput("");
      if (type === "skills") setSkillInput("");
      if (type === "interests") setInterestInput("");
    }
  };

  const removeItem = (type: "targetMajors" | "skills" | "interests", index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_: any, i: number) => i !== index),
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
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleSubmit} 
              disabled={upsertMutation.isPending}
              size="sm"
            >
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
              {/* Required Fields Info */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 md:p-4">
                <h3 className="text-sm md:text-base font-semibold text-primary mb-1">{t.profile.requiredFields}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{t.profile.requiredFieldsDesc}</p>
              </div>

              {/* Basic Information */}
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base md:text-lg font-semibold">{t.profile.academicInfo}</h3>
                  <span className="text-xs text-muted-foreground">({t.profile.required})</span>
                </div>
                
                {/* Academic Level - First */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="academicLevel" className="text-sm flex items-center gap-1.5">
                    {t.profile.academicLevel}
                    <span className="text-destructive">*</span>
                  </Label>
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
                    <Label htmlFor="gpa" className="text-sm flex items-center gap-1.5">
                      {t.profile.gpa}
                      <span className="text-xs text-muted-foreground">({t.profile.optional})</span>
                    </Label>
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

              {/* Target University (Single Selection) */}
              <div className="space-y-3 md:space-y-4">
                <Label htmlFor="targetUniversity" className="text-base md:text-lg font-semibold flex items-center gap-1.5">
                  {t.profile.targetUniversity || t.profile.targetUniversities}
                  <span className="text-destructive">*</span>
                </Label>
                <SmartInput
                  value={formData.targetUniversity}
                  onChange={(value) => setFormData(prev => ({ ...prev, targetUniversity: value }))}
                  placeholder={t.profile.addUniversity}
                  type="university"
                  className="h-9 md:h-10 text-sm"
                  getSuggestions={getUniversitySuggestions}
                  normalize={normalizeUniversity}
                />
                {formData.targetUniversity && (
                  <div className="bg-secondary text-secondary-foreground px-2.5 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm inline-flex items-center gap-1.5 md:gap-2">
                    {formData.targetUniversity}
                  </div>
                )}
                {!formData.targetUniversity && (
                  <p className="text-xs text-muted-foreground">{t.profile.validationRequired}</p>
                )}
              </div>

              {/* Target Majors */}
              <div className="space-y-3 md:space-y-4">
                <Label className="text-base md:text-lg font-semibold flex items-center gap-1.5">
                  {t.profile.targetMajors}
                  <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <SmartInput
                    value={targetMajorInput}
                    onChange={setTargetMajorInput}
                    onBlur={() => {}}
                    placeholder={t.profile.addMajor}
                    type="major"
                    className="h-9 md:h-10 text-sm"
                    getSuggestions={getMajorSuggestions}
                    normalize={normalizeMajor}
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

              {/* Optional Fields Info */}
              <div className="bg-muted/50 border border-muted rounded-lg p-3 md:p-4">
                <h3 className="text-sm md:text-base font-semibold mb-1">{t.profile.optionalFields}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{t.profile.optionalFieldsDesc}</p>
              </div>

              {/* Skills */}
              <div className="space-y-3 md:space-y-4">
                <Label className="text-base md:text-lg font-semibold flex items-center gap-1.5">
                  {t.profile.skills}
                  <span className="text-xs text-muted-foreground">({t.profile.optional})</span>
                </Label>
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
                <Label className="text-base md:text-lg font-semibold flex items-center gap-1.5">
                  {t.profile.interests}
                  <span className="text-xs text-muted-foreground">({t.profile.optional})</span>
                </Label>
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
                <Label className="text-base md:text-lg font-semibold flex items-center gap-1.5">
                  {t.profile.bio}
                  <span className="text-xs text-muted-foreground">({t.profile.optional})</span>
                </Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder={t.profile.bioPlaceholder}
                  rows={4}
                  className="text-sm"
                />
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
