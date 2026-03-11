import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Save, Loader2, GraduationCap, Camera, RotateCcw } from "lucide-react";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MobileNav } from "@/components/MobileNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { SmartInput } from "@/components/SmartInput";
import { ActivitiesSection } from "@/components/ActivitiesSection";
import { getMajorSuggestions, normalizeMajor } from "@shared/translations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const isZh = language === 'zh';
  
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
    academicLevel: "" as "high_school" | "undergraduate" | "graduate" | "",
    gpa: "",
    targetMajors: [] as string[],
    skills: [] as string[],
    interests: [] as string[],
    bio: "",
  });


  const [targetMajorInput, setTargetMajorInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const fileInputRef = useState<HTMLInputElement | null>(null)[0];
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        academicLevel: profile.academicLevel || "",
        gpa: profile.gpa || "",
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
      // Avatar removed - using initials instead
    }
  }, [profile]);

  const upsertMutation = trpc.profile.upsert.useMutation({
    onSuccess: () => {
      toast.success(t.common.success);
      // Redirect to swipe page after successful profile save
      setTimeout(() => {
        setLocation(isZh ? '/zh/swipe' : '/swipe');
      }, 1000);
    },
    onError: (error) => {
      toast.error(`${t.common.error}: ${error.message}`);
    },
  });

  const createActivityMutation = trpc.activities.create.useMutation({
    onSuccess: () => {
      toast.success(isZh ? '活动已保存！' : 'Activity saved!');
    },
    onError: (error: any) => {
      toast.error(isZh ? `保存活动失败: ${error.message}` : `Failed to save activity: ${error.message}`);
    },
  });

  const parseResumeMutation = trpc.profile.parseResume.useMutation({
    onSuccess: async (data: any) => {
      console.log('[Frontend] Resume parsed successfully!');
      console.log('[Frontend] Parsed data:', data);
      toast.success(isZh ? '简历解析成功！' : 'Resume parsed successfully!');
      
      // Save activities from resume
      console.log('[Frontend] Activities count:', data.activities?.length || 0);
      if (data.activities && data.activities.length > 0) {
        console.log('[Frontend] Saving activities...');
        toast.info(isZh ? `正在保存简历中的 ${data.activities.length} 项活动...` : `Saving ${data.activities.length} activities from resume...`);
        
        // Save all activities and wait for completion
        let savedCount = 0;
        let failedCount = 0;
        
        for (const activity of data.activities) {
          try {
            // Convert null values to undefined to satisfy Zod validation
            const activityData = {
              title: activity.title,
              category: activity.category,
              organization: activity.organization || undefined,
              role: activity.role || undefined,
              description: activity.description || undefined,
              startDate: activity.startDate || undefined,
              endDate: activity.endDate || undefined,
              isCurrent: activity.isCurrent || false,
              skills: activity.skills || [],
              achievements: activity.achievements || [],
              source: 'resume_upload' as const,
            };
            await createActivityMutation.mutateAsync(activityData);
            savedCount++;
            console.log(`[Frontend] Activity saved: ${activity.title}`);
          } catch (error) {
            failedCount++;
            console.error(`[Frontend] Failed to save activity: ${activity.title}`, error);
          }
        }
        
        if (savedCount > 0) {
          toast.success(isZh ? `成功保存 ${savedCount} 项活动！` : `Successfully saved ${savedCount} activities!`);
        }
        if (failedCount > 0) {
          toast.error(isZh ? `${failedCount} 项活动保存失败，请重试。` : `Failed to save ${failedCount} activities. Please try again.`);
        }
      }
      
      // Update form data with parsed information
      console.log('[Frontend] Updating form data...');
      console.log('[Frontend] Current skills:', formData.skills);
      console.log('[Frontend] New skills from resume:', data.skills);
      setFormData(prev => ({
        ...prev,
        skills: Array.from(new Set([...prev.skills, ...data.skills])),
        interests: Array.from(new Set([...prev.interests, ...data.interests])),
        targetMajors: data.targetMajors.length > 0 ? data.targetMajors : prev.targetMajors,
        gpa: data.gpa || prev.gpa,
      }));
      
      // Show success message
      toast.success(isZh ? '简历信息已提取！请检查后点击保存更新您的资料。' : 'Resume information extracted! Please review and click Save to update your profile.');
    },
    onError: (error: any) => {
      console.error('[Frontend] Parse resume error:', error);
      toast.error(isZh ? `简历解析失败: ${error.message}` : `Failed to parse resume: ${error.message}`);
    },
  });

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      toast.info(isZh ? `已选择简历文件: ${file.name}` : `Resume file selected: ${file.name}`);
    }
  };

  const handleParseResume = async () => {
    console.log('[Frontend] Starting resume parsing...');
    if (!resumeFile) {
      toast.error(isZh ? '请先选择简历文件' : 'Please select a resume file first');
      return;
    }
    console.log('[Frontend] Resume file:', resumeFile.name, 'Size:', resumeFile.size);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        console.log('[Frontend] File converted to base64, length:', base64.length);
        await parseResumeMutation.mutateAsync({
          fileContent: base64,
          fileName: resumeFile.name,
        });
      };
      reader.readAsDataURL(resumeFile);
    } catch (error) {
      toast.error(isZh ? '读取简历文件失败' : 'Failed to read resume file');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
    setLocation(isZh ? "/zh/swipe" : "/");
    return null;
  }

  const handleAvatarClick = () => {
    document.getElementById('avatar-upload')?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: Upload to S3
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    toast.success("Avatar uploaded successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 pb-32 md:pb-24">
      {/* Navigation */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 flex items-center justify-between">
        <Link href={isZh ? "/zh/swipe" : "/swipe"}>
          <Button variant="ghost" size="sm" className="hover:bg-white/50 rounded-full">
            <ArrowLeft className="w-5 h-5 mr-2" />
            {isZh ? '返回' : 'Back'}
          </Button>
        </Link>
        <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
          {isZh ? '编辑资料' : 'Edit Profile'}
        </h1>
        <Button
            onClick={handleSubmit}
            disabled={upsertMutation.isPending}
            className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white font-bold rounded-full shadow-lg"
          >
            {upsertMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isZh ? '保存' : 'Save'}
          </Button>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-8">
        <Card className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-3xl p-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 p-1 shadow-xl">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover bg-white"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-4xl font-black text-gray-300">
                    {user?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {isZh ? '点击相机图标上传头像' : 'Click the camera icon to upload your photo'}
            </p>
          </div>

          <CardContent className="p-0">
            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">


              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800">{isZh ? '学术信息' : 'Academic Info'}</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="academicLevel" className="text-base font-bold text-gray-700">
                    {isZh ? '学历阶段 *' : 'Academic Level *'}
                  </Label>
                  <Select
                    value={formData.academicLevel}
                    onValueChange={(value: "high_school" | "undergraduate" | "graduate") => 
                      setFormData(prev => ({ ...prev, academicLevel: value }))
                    }
                  >
                    <SelectTrigger className="h-12 text-lg rounded-xl border-2 border-gray-200 focus:border-purple-500">
                      <SelectValue placeholder={isZh ? '请选择学历阶段' : 'Select your academic level'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_school">{t.profile.highSchool}</SelectItem>
                      <SelectItem value="undergraduate">{t.profile.undergraduate}</SelectItem>
                      <SelectItem value="graduate">{t.profile.graduate}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.academicLevel && (
                  <div className="space-y-2">
                    <Label htmlFor="gpa" className="text-base font-bold text-gray-700">
                    {isZh ? '绩点 (GPA)' : 'GPA'}
                  </Label>
                    <Input
                      id="gpa"
                      value={formData.gpa}
                      onChange={(e) => setFormData(prev => ({ ...prev, gpa: e.target.value }))}
                      placeholder={isZh ? '例：3.8/4.0' : 'e.g., 3.8/4.0'}
                      className="h-12 text-lg rounded-xl border-2 border-gray-200 focus:border-purple-500"
                    />
                  </div>
                )}
              </div>

              {/* Target Majors */}
              <div className="space-y-3">
                <Label className="text-lg font-bold text-gray-800">
                  {isZh ? '目标专业' : 'Target Major'}
                </Label>
                <div className="flex gap-2">
                  <SmartInput
                    value={targetMajorInput}
                    onChange={setTargetMajorInput}
                    onBlur={() => {}}
                    placeholder={isZh ? '例：Computer Science' : 'e.g., Computer Science'}
                    type="major"
                    className="h-12 text-lg rounded-xl border-2 border-gray-200 focus:border-purple-500"
                    getSuggestions={getMajorSuggestions}
                    normalize={normalizeMajor}
                  />
                  <Button type="button" onClick={() => addItem("targetMajors", targetMajorInput)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl h-12 px-6">
                    {isZh ? '添加' : 'Add'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.targetMajors.map((major, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-semibold text-sm shadow-md">
                      {major}
                      <button type="button" onClick={() => removeItem("targetMajors", index)} className="hover:bg-white/20 rounded-full p-0.5">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>



              {/* Skills */}
              <div className="space-y-3">
                <Label className="text-lg font-bold text-gray-800">
                  {isZh ? '技能' : 'Skills'}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("skills", skillInput))}
                    placeholder={isZh ? '添加技能（按 Enter）' : 'Add a skill (press Enter)'}
                    className="h-12 text-lg rounded-xl border-2 border-gray-200 focus:border-purple-500"
                  />
                  <Button type="button" onClick={() => addItem("skills", skillInput)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl h-12 px-6">
                    {isZh ? '添加' : 'Add'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-semibold text-sm shadow-md">
                      {skill}
                      <button type="button" onClick={() => removeItem("skills", index)} className="hover:bg-white/20 rounded-full p-0.5">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

                   {/* Interests */}
              <div className="space-y-3">
                <Label className="text-lg font-bold text-gray-800">
                  {isZh ? '研究兴趣' : 'Research Interests'}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("interests", interestInput))}
                    placeholder={isZh ? '添加研究兴趣（按 Enter）' : 'Add an interest (press Enter)'}
                    className="h-12 text-lg rounded-xl border-2 border-gray-200 focus:border-purple-500"
                  />
                  <Button type="button" onClick={() => addItem("interests", interestInput)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl h-12 px-6">
                    {isZh ? '添加' : 'Add'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.interests.map((interest, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold text-sm shadow-md">
                      {interest}
                      <button type="button" onClick={() => removeItem("interests", index)} className="hover:bg-white/20 rounded-full p-0.5">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Activities Section */}
              <div className="space-y-4">
                <Label className="text-lg font-bold text-gray-800">
                  {isZh ? '我的活动' : 'Your Activities'}
                </Label>
                <ActivitiesSection />
              </div>

              {/* Resume Upload */}
              <div className="space-y-3">
                <Label className="text-lg font-bold text-gray-800">
                  {isZh ? '简历上传与解析' : 'Resume Upload & Parse'}
                </Label>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <input
                      id="resume-upload"
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleResumeUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      onClick={() => document.getElementById('resume-upload')?.click()}
                      variant="outline"
                      className="flex-1 h-12 text-lg rounded-xl border-2 border-gray-200 hover:border-purple-500"
                    >
                      {resumeFile ? resumeFile.name : (isZh ? '选择文件' : 'Choose File')}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleParseResume}
                      disabled={!resumeFile || parseResumeMutation.isPending}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold h-12 px-6 rounded-xl shadow-lg"
                    >
                      {parseResumeMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Parsing...
                        </>
                      ) : (
                        isZh ? '解析简历' : 'Parse Resume'
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    {isZh ? '上传简历（PDF 或 DOCX），点击"解析简历"自动提取您的教育背景、技能和研究兴趣。' : 'Upload your resume (PDF or DOCX) and click "Parse Resume" to automatically extract your education, skills, and interests.'}
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Mobile-only footer links - shown here since footer is hidden on mobile */}
      <div className="md:hidden mt-4 pb-24 text-center space-y-3 px-4">
        <p className="text-xs text-gray-400">
          {isZh ? '© 2026 ProfMatch. 保留所有权利。' : '© 2026 ProfMatch. All rights reserved.'}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href={isZh ? '/privacy-policy-zh' : '/privacy-policy'} className="text-xs text-gray-500 hover:text-purple-600 transition-colors">
            {t.policy.privacyPolicy}
          </Link>
          <Link href={isZh ? '/terms-of-service-zh' : '/terms-of-service'} className="text-xs text-gray-500 hover:text-purple-600 transition-colors">
            {t.policy.termsOfService}
          </Link>
          <Link href={isZh ? '/professor-policy-zh' : '/professor-policy'} className="text-xs text-gray-500 hover:text-purple-600 transition-colors">
            {t.policy.professorPolicy}
          </Link>
        </div>
        <a href="mailto:s20316.wei@stu.scie.com.cn" className="text-xs text-gray-400 hover:text-purple-600 transition-colors block">
          s20316.wei@stu.scie.com.cn
        </a>
      </div>
    </div>
  );
}
