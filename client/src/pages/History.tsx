import { useAuth } from "@/_core/hooks/useAuth";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2, Search, Sparkles } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { CoverLetterDialog } from "@/components/CoverLetterDialog";
import { toast } from "sonner";

export default function History() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [showLetterDialog, setShowLetterDialog] = useState(false);
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [currentLetter, setCurrentLetter] = useState<{
    content: string;
    projectName: string;
    professorName: string;
    university: string;
  } | null>(null);

  const generateLetterMutation = trpc.coverLetter.generate.useMutation();

  // Fetch match history
  const { data: matchHistory = [], isLoading } = trpc.matching.getMatchHistory.useQuery(undefined, {
    enabled: !!user,
  });

  const handleGenerateLetter = async (match: any) => {
    setGeneratingLetter(true);
    setShowLetterDialog(true);
    setCurrentLetter({
      content: "",
      projectName: match.projectName,
      professorName: match.professorName,
      university: match.university,
    });

    try {
      const result = await generateLetterMutation.mutateAsync({
        matchId: match.id,
        tone: "formal",
      });

      setCurrentLetter({
        content: result.content,
        projectName: result.projectName,
        professorName: result.professorName,
        university: result.university,
      });
    } catch (error: any) {
      toast.error(t.coverLetter?.generateFailed || "文书生成失败");
      setShowLetterDialog(false);
    } finally {
      setGeneratingLetter(false);
    }
  };

  if (authLoading || isLoading) {
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
          </div>
          <h1 className="text-lg md:text-xl font-bold">{t.dashboard.matchHistory || "Match History"}</h1>
          <LanguageSwitcher />
        </div>
      </nav>

      <main className="container py-6 md:py-8">
        {matchHistory.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
              <Search className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t.dashboard.noMatches || "No matches yet"}</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                {t.dashboard.searchProjects || "Start searching for research projects to see your match history"}
              </p>
              <Link href="/explore">
                <Button>{t.dashboard.searchProjects || "Search Projects"}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-muted-foreground">
                {matchHistory.length} {t.dashboard.matches || "matches"}
              </p>
            </div>

            {matchHistory.map((match: any) => (
              <Card key={match.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-2">{match.projectName}</CardTitle>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="font-medium">{match.professorName}</p>
                        {match.lab && <p className="truncate">{match.lab}</p>}
                        <p>{match.university}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="self-start whitespace-nowrap">
                      {t.explore.matchScore || "匹配分数"}: {match.matchScore}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Research Direction */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      {t.explore.researchDirection || "研究方向"}
                    </h4>
                    <p className="text-sm text-muted-foreground">{match.researchDirection}</p>
                  </div>

                  {/* Match Reason */}
                  {match.matchReasons && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">{t.explore.matchReason || "匹配原因"}</h4>
                      <p className="text-sm text-muted-foreground">
                        {typeof match.matchReasons === 'string' 
                          ? JSON.parse(match.matchReasons)[0] 
                          : match.matchReasons[0]}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleGenerateLetter(match)}
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      {t.coverLetter?.title || "生成文书"}
                    </Button>
                    {match.url && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a href={match.url} target="_blank" rel="noopener noreferrer">
                          {t.explore.viewDetails || "查看详情"}
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />

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
