import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2, MapPin, Globe, GraduationCap, Target, Sparkles, Search, AlertCircle, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MobileNav } from "@/components/MobileNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InsufficientCreditsDialog } from "@/components/InsufficientCreditsDialog";
import { CoverLetterDialog } from "@/components/CoverLetterDialog";

export default function Explore() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searching, setSearching] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [showLetterDialog, setShowLetterDialog] = useState(false);
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [currentLetter, setCurrentLetter] = useState<{
    content: string;
    projectName: string;
    professorName: string;
    university: string;
  } | null>(null);
  const { t, language } = useLanguage();

  const calculateMatchesMutation = trpc.matching.calculateMatches.useMutation();
  const generateLetterMutation = trpc.coverLetter.generate.useMutation();

  // Get user profile for target universities and majors
  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  });

  const handleGenerateLetter = async (project: any) => {
    setGeneratingLetter(true);
    setShowLetterDialog(true);
    setCurrentLetter({
      content: "",
      projectName: project.projectName,
      professorName: project.professorName,
      university: project.university,
    });

    try {
      const result = await generateLetterMutation.mutateAsync({
        matchId: project.id,
        tone: "formal",
      });

      setCurrentLetter({
        content: result.content,
        projectName: result.projectName,
        professorName: result.professorName,
        university: result.university,
      });
      toast.success(t.coverLetter.generateSuccess);
    } catch (error: any) {
      if (error.message?.includes('INSUFFICIENT_CREDITS') || error.data?.code === 'INSUFFICIENT_CREDITS') {
        setShowLetterDialog(false);
        setShowCreditsDialog(true);
      } else {
        toast.error(t.coverLetter.generateFailed + ": " + error.message);
        setShowLetterDialog(false);
      }
    } finally {
      setGeneratingLetter(false);
    }
  };

  const handleSearchProjects = async () => {
    if (!profile) {
      toast.error(t.explore.completeProfileFirst || "请先完善个人资料");
      return;
    }

    const targetUniversities = profile.targetUniversities ? JSON.parse(profile.targetUniversities) : [];
    const targetMajors = profile.targetMajors ? JSON.parse(profile.targetMajors) : [];

    if (targetUniversities.length === 0) {
      toast.error(t.explore.addTargetUniversity || "请在个人资料中添加目标大学");
      return;
    }

    if (targetMajors.length === 0) {
      toast.error(t.explore.addTargetMajor || "请在个人资料中添加目标专业");
      return;
    }

    setSearching(true);
    setProjects([]);
    
    try {
      // Use new matching API (deducts 40 credits: matching + normalization)
      const universityName = targetUniversities[0];
      const majorName = targetMajors[0];
      
      const result = await calculateMatchesMutation.mutateAsync({ language });

      setProjects(result.matches);
      toast.success(t.explore.foundProjects?.replace('{count}', result.matches.length.toString()) || `找到 ${result.matches.length} 个匹配项目`);
      setSearching(false);
    } catch (error: any) {
      if (error.message?.includes('INSUFFICIENT_CREDITS') || error.data?.code === 'INSUFFICIENT_CREDITS') {
        setShowCreditsDialog(true);
      } else {
        toast.error(t.explore.searchFailed?.replace('{message}', error.message) || `搜索失败: ${error.message}`);
      }
      setSearching(false);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-14 md:h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <MobileNav />
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{t.common.back}</span>
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <span className="text-lg md:text-xl font-bold text-foreground hidden sm:inline">Find My Professor</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-6 md:py-8 pb-20 md:pb-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{t.explore.title}</h1>
          <p className="text-muted-foreground">{t.explore.subtitle}</p>
        </div>

        {/* Profile Check Alert */}
        {!profile?.targetUniversities || !profile?.targetMajors ? (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t.explore.completeProfilePrompt || "请先在个人资料中设置目标大学和专业"}
              <Link href="/profile">
                <Button variant="link" className="px-2 h-auto">
                  {t.common.goToProfile || "前往设置"}
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Search Button */}
        <Card className="mb-6 md:mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-lg md:text-xl font-semibold mb-2">
                  {t.explore.smartMatching || "智能匹配"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t.explore.smartMatchingDesc || "基于您的个人资料，为您推荐8-10个最匹配的研究项目"}
                </p>
                {profile?.targetUniversities && profile?.targetMajors && (
                  <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge variant="secondary">
                      <Target className="mr-1 h-3 w-3" />
                      {JSON.parse(profile.targetUniversities)[0]}
                    </Badge>
                    <Badge variant="secondary">
                      <GraduationCap className="mr-1 h-3 w-3" />
                      {JSON.parse(profile.targetMajors)[0]}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-2 w-full md:w-auto">
                <Button
                  size="lg"
                  onClick={handleSearchProjects}
                  disabled={searching || !profile?.targetUniversities || !profile?.targetMajors}
                  className="w-full md:w-auto"
                >
                  {searching ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t.explore.searching || "搜索中..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      {t.explore.searchProjects || "搜索研究项目"}
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {language === 'zh' ? '消耗 40 积分' : 'Costs 40 credits'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {projects.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {t.explore.matchResults || "匹配结果"} ({projects.length})
              </h2>
            </div>

            <div className="grid gap-4 md:gap-6">
              {projects.map((project, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-lg md:text-xl flex-1 min-w-0">
                          {project.projectName}
                        </CardTitle>
                        <Badge className="shrink-0">
                          {t.explore.matchScore || "匹配度"}: {project.matchScore}%
                        </Badge>
                      </div>
                      <CardDescription className="flex flex-wrap gap-2 items-center">
                        <Badge variant="secondary" className="font-medium">
                          {project.professorName}
                        </Badge>
                        {project.lab && (
                          <Badge variant="outline" className="max-w-full truncate">
                            {project.lab}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        {t.explore.researchDirection || "研究方向"}
                      </h4>
                      <p className="text-sm text-muted-foreground">{project.researchDirection}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-1">{t.explore.description || "项目描述"}</h4>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    </div>

                    {project.requirements && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">{t.explore.requirements || "要求"}</h4>
                        <p className="text-sm text-muted-foreground">{project.requirements}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-sm mb-1">{t.explore.matchReason || "匹配原因"}</h4>
                      <p className="text-sm text-primary/80">{project.matchReason}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {project.contactEmail && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`mailto:${project.contactEmail}`}>
                            <Mail className="mr-2 h-4 w-4" />
                            {t.explore.contact || "联系"}
                          </a>
                        </Button>
                      )}
                      {project.url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={project.url} target="_blank" rel="noopener noreferrer">
                            <Globe className="mr-2 h-4 w-4" />
                            {t.explore.viewDetails || "查看详情"}
                          </a>
                        </Button>
                      )}
                      <div className="flex flex-col items-start gap-1">
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleGenerateLetter(project)}
                          disabled={generatingLetter}
                        >
                          {generatingLetter ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                          )}
                          {t.common.generateLetter || "生成文书"}
                        </Button>
                        <p className="text-xs text-muted-foreground ml-1">
                          {language === 'zh' ? '消耗 20 积分' : 'Costs 20 credits'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!searching && projects.length === 0 && (
          <Card className="p-12 text-center">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">{t.common.noResults || "暂无搜索结果"}</h3>
            <p className="text-muted-foreground">
              {t.explore.clickToSearch || "点击上方按钮开始搜索匹配的研究项目"}
            </p>
          </Card>
        )}
      </main>

      <Footer />

      {/* Insufficient Credits Dialog */}
      <InsufficientCreditsDialog
        open={showCreditsDialog}
        onOpenChange={setShowCreditsDialog}
        remainingCredits={0}
      />
      
      {/* Cover Letter Dialog */}
      <CoverLetterDialog
        open={showLetterDialog}
        onOpenChange={setShowLetterDialog}
        content={currentLetter?.content || ""}
        projectName={currentLetter?.projectName || ""}
        professorName={currentLetter?.professorName || ""}
        university={currentLetter?.university || ""}
        loading={generatingLetter}
      />
    </div>
  );
}
