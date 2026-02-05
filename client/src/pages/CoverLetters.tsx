import { useAuth } from "@/_core/hooks/useAuth";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2, FileText, Copy, Check, Sparkles } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { toast } from "sonner";

export default function CoverLetters() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Fetch cover letters
  const { data: coverLetters = [], isLoading } = trpc.coverLetter.getMyLetters.useQuery(undefined, {
    enabled: !!user,
  });

  const handleCopy = async (content: string, id: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      toast.success(t.coverLetter?.copied || "已复制到剪贴板");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error(t.coverLetter?.copyFailed || "复制失败");
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
          <h1 className="text-lg md:text-xl font-bold">{t.dashboard.yourCoverLetters || "Your Cover Letters"}</h1>
          <LanguageSwitcher />
        </div>
      </nav>

      <main className="container py-6 md:py-8">
        {coverLetters.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
              <Sparkles className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t.dashboard.noCoverLetters || "No cover letters yet"}</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                {t.dashboard.searchProjects || "Generate your first cover letter from matched projects"}
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
                {coverLetters.length} {t.dashboard.yourCoverLetters || "cover letters"}
              </p>
            </div>

            {coverLetters.map((letter: any) => (
              <Card key={letter.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-2">{letter.projectName}</CardTitle>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="font-medium">{letter.professorName}</p>
                        <p>{letter.university}</p>
                        <p className="text-xs">
                          Generated: {new Date(letter.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="self-start whitespace-nowrap">
                      {letter.tone === "formal" ? "正式" : "随意"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cover Letter Content */}
                  <div className="bg-muted/50 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{letter.content}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleCopy(letter.content, letter.id)}
                      className="gap-2"
                    >
                      {copiedId === letter.id ? (
                        <>
                          <Check className="h-4 w-4" />
                          {t.coverLetter?.copied || "已复制"}
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          {t.coverLetter?.copy || "复制"}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
