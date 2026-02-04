import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Footer } from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2, MapPin, Clock, DollarSign, Globe, GraduationCap, Target, Sparkles, Filter, Search, AlertCircle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { MobileNav } from "@/components/MobileNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Explore() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searching, setSearching] = useState(false);
  const [scrapingTaskId, setScrapingTaskId] = useState<number | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [minMatchScore, setMinMatchScore] = useState(0);
  const { t } = useLanguage();
  const utils = trpc.useUtils();

  // Get user profile for target universities and majors
  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  });

  // Poll scraping task status
  const { data: taskStatus } = trpc.scraping.getTaskStatus.useQuery(
    { taskId: scrapingTaskId! },
    {
      enabled: !!scrapingTaskId,
      refetchInterval: 3000,
    }
  );

  // When task completes, fetch the cached projects
  useEffect(() => {
    if (taskStatus?.status === 'completed' && profile) {
      const targetUniversities = profile.targetUniversities ? JSON.parse(profile.targetUniversities) : [];
      const targetMajors = profile.targetMajors ? JSON.parse(profile.targetMajors) : [];
      
      if (targetUniversities.length > 0 && targetMajors.length > 0) {
        // Fetch projects for the first target university and major
        handleFetchProjects(targetUniversities[0], targetMajors[0]);
      }
    }
  }, [taskStatus?.status]);

  const handleSearchProjects = async () => {
    if (!profile) {
      toast.error("请先完善个人资料");
      return;
    }

    const targetUniversities = profile.targetUniversities ? JSON.parse(profile.targetUniversities) : [];
    const targetMajors = profile.targetMajors ? JSON.parse(profile.targetMajors) : [];

    if (targetUniversities.length === 0) {
      toast.error("请在个人资料中添加目标大学");
      return;
    }

    if (targetMajors.length === 0) {
      toast.error("请在个人资料中添加目标专业");
      return;
    }

    setSearching(true);
    setProjects([]);
    
    try {
      // Search for the first target university and major
      const universityName = targetUniversities[0];
      const majorName = targetMajors[0];
      
      const result = await utils.scraping.searchProjects.fetch({
        universityName,
        majorName,
        degreeLevel: profile.academicLevel === 'high_school' ? 'undergraduate' : (profile.academicLevel || 'all'),
      });

      if (result.cached) {
        // Cache hit - show results immediately
        setProjects(result.projects);
        toast.success(`找到 ${result.projects.length} 个项目（缓存数据，${result.cacheAge}天前）`);
        setSearching(false);
      } else if (result.scrapingTriggered) {
        // Cache miss - scraping triggered
        setScrapingTaskId(result.taskId!);
        toast.info(`正在爬取 ${universityName} 的 ${majorName} 项目...`);
      }
    } catch (error: any) {
      toast.error(`搜索失败: ${error.message}`);
      setSearching(false);
    }
  };

  const handleFetchProjects = async (universityName: string, majorName: string) => {
    try {
      const result = await utils.scraping.searchProjects.fetch({
        universityName,
        majorName,
        degreeLevel: profile?.academicLevel === 'high_school' ? 'undergraduate' : (profile?.academicLevel || 'all'),
      });

      if (result.cached && result.projects.length > 0) {
        setProjects(result.projects);
        toast.success(`找到 ${result.projects.length} 个项目`);
      }
      setSearching(false);
      setScrapingTaskId(null);
    } catch (error: any) {
      toast.error(`获取项目失败: ${error.message}`);
      setSearching(false);
      setScrapingTaskId(null);
    }
  };

  // Filter projects based on minimum score (if we add matching scores later)
  const filteredProjects = useMemo(() => {
    return projects; // For now, show all scraped projects
  }, [projects]);

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

  const isScrapingInProgress = !!(scrapingTaskId && taskStatus?.status === 'in_progress');

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
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">{t.explore.title}</h1>
          <p className="text-muted-foreground text-sm md:text-lg">
            {t.explore.subtitle}
          </p>
        </div>

        {/* Search Projects Button */}
        <Card className="mb-6 md:mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Search className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              {t.explore.searchTitle}
            </CardTitle>
            <CardDescription className="text-sm">
              {t.explore.searchDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0 flex flex-col gap-3">
            <Button
              onClick={handleSearchProjects}
              disabled={searching || isScrapingInProgress}
              size="default"
              className="w-full sm:w-auto"
            >
              {searching || isScrapingInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                  <span className="text-sm md:text-base">
                    {isScrapingInProgress ? '正在爬取数据...' : '搜索中...'}
                  </span>
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-sm md:text-base">{t.explore.searchButton}</span>
                </>
              )}
            </Button>

            {/* Scraping Progress */}
            {isScrapingInProgress && taskStatus && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  正在爬取 {taskStatus.university_name} 的 {taskStatus.major_name} 项目...
                  <br />
                  <span className="text-xs text-muted-foreground">
                    已找到 {taskStatus.projects_found || 0} 个项目
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* Profile Reminder */}
            {!profile?.targetUniversities || !profile?.targetMajors ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  请先在<Link href="/profile"><a className="underline">个人资料</a></Link>中设置目标大学和专业
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        {/* Projects List */}
        {searching || isScrapingInProgress ? (
          <div className="flex justify-center py-12 md:py-16">
            <div className="text-center">
              <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">
                {isScrapingInProgress ? '正在爬取数据，请稍候...' : '搜索中...'}
              </p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 md:py-16 text-center">
              <Target className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-3 md:mb-4" />
              <h3 className="text-lg md:text-xl font-semibold mb-2">{t.explore.noProjectsTitle}</h3>
              <p className="text-muted-foreground text-sm md:text-base mb-4 md:mb-6">
                {t.explore.noProjectsHint}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-xl md:text-2xl font-bold">
                {t.explore.searchResults} ({filteredProjects.length})
              </h2>
            </div>

            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-base md:text-xl mb-2">
                        {project.projectTitle}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          <MapPin className="mr-1 h-3 w-3" />
                          {project.universityName}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {project.majorName}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          <span>{project.professorName}</span>
                        </div>
                        {project.labName && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span>{project.labName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{t.explore.researchDirection}</h4>
                      <p className="text-sm text-muted-foreground">{project.researchArea}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{t.explore.projectDescription}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {project.projectDescription}
                      </p>
                    </div>
                    {project.requirements && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">{t.explore.applicationRequirements}</h4>
                        <p className="text-sm text-muted-foreground">{project.requirements}</p>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      {project.contactEmail && (
                        <Button variant="default" size="sm" asChild className="w-full sm:w-auto">
                          <a href={`mailto:${project.contactEmail}`}>
                            {t.explore.contactProfessor}
                          </a>
                        </Button>
                      )}
                      {project.sourceUrl && (
                        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                          <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer">
                            {t.explore.viewDetails}
                          </a>
                        </Button>
                      )}
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
