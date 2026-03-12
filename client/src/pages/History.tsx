import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2, Heart, FlaskConical, Sparkles, ExternalLink, Trash2, Search, User, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getLoginUrl } from '@/const';
import { useState } from "react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateUniversity } from "@/lib/universityTranslation";

export default function History() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [selectedProfessor, setSelectedProfessor] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCoverLetterDialog, setShowCoverLetterDialog] = useState(false);
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [coverLetterContent, setCoverLetterContent] = useState("");

  const isZh = language === 'zh';

  // Fetch liked professors
  const { data: likedProfessors = [], isLoading, refetch } = trpc.swipe.getLikedProfessors.useQuery(undefined, {
    enabled: !!user,
  });

  // Unlike professor mutation
  const unlikeMutation = trpc.swipe.unlike.useMutation({
    onSuccess: () => {
      toast.success(isZh ? "已从匹配中移除" : "Removed from matches");
      refetch();
    },
    onError: () => {
      toast.error(isZh ? "移除失败，请重试" : "Failed to remove match");
    },
  });

  // Cover letter generation mutation
  const generateLetterMutation = trpc.coverLetter.generateForProfessor.useMutation();

  const handleViewDetails = (match: any) => {
    setSelectedProfessor(match);
    setShowDetailDialog(true);
  };

  const handleGenerateCoverLetter = async (match: any) => {
    setSelectedProfessor(match);
    setShowCoverLetterDialog(true);
    setGeneratingLetter(true);
    setCoverLetterContent("");

    try {
      const result = await generateLetterMutation.mutateAsync({
        professorId: match.professor.id,
        tone: "formal",
      });
      setCoverLetterContent(result.content);
    } catch (error: any) {
      toast.error(isZh ? "生成申请信失败" : "Failed to generate cover letter");
      setShowCoverLetterDialog(false);
    } finally {
      setGeneratingLetter(false);
    }
  };

  const handleUnlike = (professorId: number) => {
    if (confirm(isZh ? "确定要从匹配中移除该教授吗？" : "Remove this professor from your matches?")) {
      unlikeMutation.mutate({ professorId });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(isZh ? "已复制到剪贴板！" : "Copied to clipboard!");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
              <Heart className="w-16 h-16 text-white fill-white" />
            </div>
          </div>
          <h2 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-4">
            {isZh ? '登录后查看匹配记录' : 'Sign In to View Your Matches'}
          </h2>
          <p className="text-xl text-gray-700 mb-8 font-medium">
            {isZh ? '登录后可以查看所有你喜欢的教授，并一键生成套磁信。' : 'Sign in to see all professors you liked and generate cover letters with one click.'}
          </p>
          <Button
            size="lg"
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white font-bold text-lg px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all"
          >
            <User className="w-6 h-6 mr-2" />
            {isZh ? '立即登录' : 'Sign In'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 pb-32 md:pb-24">
      {/* Header */}
      <div className="p-4 md:p-6 flex items-center justify-between bg-white/80 backdrop-blur-sm shadow-md">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href={isZh ? "/zh/swipe" : "/"}>
            <Button variant="ghost" size="sm" className="hover:bg-purple-100 transition-colors">
              <ArrowLeft className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">{isZh ? "返回" : "Back"}</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 md:w-7 md:h-7 text-pink-500 fill-pink-500" />
            <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {isZh ? '匹配记录' : 'Match History'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Badge variant="secondary" className="text-sm font-semibold">
            {likedProfessors.length} {isZh ? '匹配' : (likedProfessors.length === 1 ? 'Match' : 'Matches')}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <main className="container py-6 md:py-8 max-w-4xl">
        {likedProfessors.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
              <Heart className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isZh ? '还没有匹配记录' : 'No matches yet'}
              </h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                {isZh ? '开始滑动，找到与你研究方向匹配的教授！' : 'Start swiping to find professors that match your research interests!'}
              </p>
              <Link href={isZh ? "/zh/swipe" : "/swipe"}>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Heart className="w-4 h-4 mr-2" />
                  {isZh ? '开始滑动' : 'Start Swiping'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {likedProfessors.map((match: any) => (
              <Card key={match.id} className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl mb-1 flex items-center gap-2">
                        {match.professor.name}
                        {match.likeType === "super_like" && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                            ⭐ Super Like
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="space-y-0.5 text-sm text-muted-foreground">
                        {match.professor.majorName && (
                          <p>{isZh ? (match.professor.department_zh || match.professor.majorName) : match.professor.majorName}</p>
                        )}
                        <p className="font-semibold text-purple-600">
                          {isZh ? translateUniversity(match.professor.university) : match.professor.university}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {match.matchScore != null ? (
                        <Badge
                          variant="secondary"
                          className={`self-start whitespace-nowrap font-bold ${
                            match.matchScore >= 80
                              ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
                              : match.matchScore >= 60
                              ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700'
                              : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700'
                          }`}
                        >
                          {match.matchScore >= 80 ? '🔥' : match.matchScore >= 60 ? '✨' : '💡'} {match.matchScore}% {isZh ? '匹配度' : 'Match'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="self-start whitespace-nowrap text-gray-400 text-xs border-gray-200">
                          🔍 {isZh ? '探索匹配' : 'Explore Match'}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {isZh ? '喜欢于 ' : 'Liked '}{new Date(match.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Research Field */}
                  {match.professor.research_field && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-purple-600" />
                        {isZh ? '研究领域' : 'Research Field'}
                      </h4>
                      <Badge variant="outline" className="text-sm">
                        {isZh ? (match.professor.research_field_zh || match.professor.research_field) : match.professor.research_field}
                      </Badge>
                    </div>
                  )}

                  {/* Research Tags */}
                  {match.professor.tags && match.professor.tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        {isZh ? '研究方向' : 'Research Interests'}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {match.professor.tags.slice(0, 5).map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {match.professor.tags.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{match.professor.tags.length - 5} {isZh ? '更多' : 'more'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleViewDetails(match)}
                      className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {isZh ? '查看详情' : 'View Details'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateCoverLetter(match)}
                      className="gap-2 border-purple-300 hover:bg-purple-50"
                    >
                      <Sparkles className="h-4 w-4" />
                      {isZh ? '生成申请信' : 'Generate Cover Letter'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUnlike(match.professor.id)}
                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isZh ? '移除' : 'Remove'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Professor Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedProfessor?.professor.name}
            </DialogTitle>
          </DialogHeader>
          {selectedProfessor && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">{isZh ? '所在机构' : 'Institution'}</h4>
                <p className="text-muted-foreground">
                  {selectedProfessor.professor.majorName && (
                    <>{isZh ? (selectedProfessor.professor.department_zh || selectedProfessor.professor.majorName) : selectedProfessor.professor.majorName}, </>
                  )}
                  {isZh ? translateUniversity(selectedProfessor.professor.university) : selectedProfessor.professor.university}
                </p>
              </div>

              {selectedProfessor.professor.research_field && (
                <div>
                  <h4 className="font-semibold mb-2">{isZh ? '研究领域' : 'Research Field'}</h4>
                  <Badge>
                    {isZh ? (selectedProfessor.professor.research_field_zh || selectedProfessor.professor.research_field) : selectedProfessor.professor.research_field}
                  </Badge>
                </div>
              )}

              {selectedProfessor.professor.tags && selectedProfessor.professor.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">{isZh ? '研究方向' : 'Research Interests'}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfessor.professor.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedProfessor.professor.bio && (
                <div>
                  <h4 className="font-semibold mb-2">{isZh ? '简介' : 'Bio'}</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedProfessor.professor.bio}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex w-full rounded-md overflow-hidden border border-primary">
                  <Button
                    onClick={() => {
                      const professorName = selectedProfessor.professor.name;
                      const university = selectedProfessor.professor.university;
                      const searchQuery = encodeURIComponent(`${professorName} ${university}`);
                      window.open(`https://www.bing.com/search?q=${searchQuery}`, '_blank');
                    }}
                    className="flex-1 rounded-none border-0"
                    variant="default"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {isZh ? '搜索该教授' : 'Search This Professor'}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="default"
                        className="px-2 rounded-none border-0 border-l border-primary-foreground/30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {[
                        { label: isZh ? '用 Bing 搜索（默认）' : 'Search with Bing (default)', url: (q: string) => `https://www.bing.com/search?q=${q}` },
                        { label: isZh ? '用百度搜索' : 'Search with Baidu', url: (q: string) => `https://www.baidu.com/s?wd=${q}` },
                        { label: isZh ? '用 Google 搜索' : 'Search with Google', url: (q: string) => `https://www.google.com/search?q=${q}` },
                      ].map(({ label, url }) => (
                        <DropdownMenuItem
                          key={label}
                          onClick={() => {
                            const professorName = selectedProfessor.professor.name;
                            const university = selectedProfessor.professor.university;
                            const searchQuery = encodeURIComponent(`${professorName} ${university}`);
                            window.open(url(searchQuery), '_blank');
                          }}
                        >
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cover Letter Dialog */}
      <Dialog open={showCoverLetterDialog} onOpenChange={setShowCoverLetterDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              {isZh ? 'AI 生成的申请信' : 'AI-Generated Cover Letter'}
            </DialogTitle>
          </DialogHeader>
          {generatingLetter ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
              <p className="text-muted-foreground">
                {isZh ? '正在为您生成个性化申请信...' : 'Generating your personalized cover letter...'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-6 border">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {coverLetterContent}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => copyToClipboard(coverLetterContent)} className="flex-1">
                  {isZh ? '复制到剪贴板' : 'Copy to Clipboard'}
                </Button>
                <Button variant="outline" onClick={() => setShowCoverLetterDialog(false)}>
                  {isZh ? '关闭' : 'Close'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
