import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2, MapPin, Clock, DollarSign, Globe, GraduationCap, Target, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MobileNav } from "@/components/MobileNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Explore() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [calculating, setCalculating] = useState(false);
  const [minMatchScore, setMinMatchScore] = useState(0); // Minimum match score filter
  const { t } = useLanguage();

  const { data: allMatches = [], refetch, isLoading } = trpc.matching.getMatchesWithDetails.useQuery(
    { randomize: false },
    {
      enabled: !!user,
      refetchOnMount: true,
      staleTime: 0, // Always consider data stale to force refetch
    }
  );

  // Filter matches based on minimum score
  const matchesWithDetails = allMatches.filter(
    match => {
      const scoreStr = (match.matchScore || "0").toString();
      const score = parseFloat(scoreStr.replace('%', ''));
      return score >= minMatchScore;
    }
  );

  const utils = trpc.useUtils();

  const calculateMutation = trpc.matching.calculateMatches.useMutation({
    onSuccess: async (data) => {
      toast.success(`Found ${data.totalMatches} matching projects!`);
      // Invalidate the query cache to force a fresh fetch
      await utils.matching.getMatchesWithDetails.invalidate();
      setCalculating(false);
    },
    onError: (error) => {
      toast.error(`Failed to calculate matches: ${error.message}`);
      setCalculating(false);
    },
  });

  const handleCalculateMatches = () => {
    setCalculating(true);
    setMinMatchScore(0); // Reset filter when recalculating
    calculateMutation.mutate();
  };

  const handleFilterChange = (value: string) => {
    setMinMatchScore(Number(value));
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

        {/* Calculate Matches Button */}
        <Card className="mb-6 md:mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              {t.home.smartMatching}
            </CardTitle>
            <CardDescription className="text-sm">
              {t.home.smartMatchingDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleCalculateMatches}
              disabled={calculating || calculateMutation.isPending}
              size="default"
              className="w-full sm:w-auto"
            >
              {calculating || calculateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                  <span className="text-sm md:text-base">{t.common.loading}</span>
                </>
              ) : (
                <>
                  <Target className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-sm md:text-base">{t.explore.calculateMatch}</span>
                </>
              )}
            </Button>
            {allMatches.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-sm whitespace-nowrap">
                  Match Score ≥
                </label>
                <Select value={minMatchScore.toString()} onValueChange={(value) => handleFilterChange(value)}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="All (0%)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All (0%)</SelectItem>
                    <SelectItem value="50">50%+</SelectItem>
                    <SelectItem value="60">60%+</SelectItem>
                    <SelectItem value="70">70%+</SelectItem>
                    <SelectItem value="80">80%+</SelectItem>
                    <SelectItem value="90">90%+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Matches List */}
        {isLoading ? (
          <div className="flex justify-center py-12 md:py-16">
            <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-primary" />
          </div>
        ) : matchesWithDetails.length === 0 ? (
          <Card>
            <CardContent className="py-12 md:py-16 text-center">
              <Target className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-3 md:mb-4" />
              <h3 className="text-lg md:text-xl font-semibold mb-2">{t.explore.noProjects}</h3>
              <p className="text-muted-foreground text-sm md:text-base mb-4 md:mb-6">
                {t.explore.tryDifferentFilters}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-xl md:text-2xl font-bold">{t.explore.match} ({matchesWithDetails.length})</h2>
            </div>

            {matchesWithDetails.map((match) => (
              <Card key={match.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex flex-col gap-3 md:gap-4">
                    {/* Title and Score */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <CardTitle className="text-lg md:text-2xl">{match.project?.title}</CardTitle>
                      <div className="flex items-center gap-2 bg-primary/10 text-primary px-2.5 py-1 rounded-full self-start">
                        <Target className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="font-bold text-sm md:text-base">{match.matchScore}%</span>
                      </div>
                    </div>
                    
                    {/* University Info */}
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span>{match.university?.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span>{match.university?.country}</span>
                      </div>
                    </div>

                    <CardDescription className="text-sm md:text-base line-clamp-3 md:line-clamp-none">
                      {match.project?.description}
                    </CardDescription>

                    {/* Match Reasons */}
                    {match.matchReasons && match.matchReasons.length > 0 && (
                      <div>
                        <p className="text-xs md:text-sm font-medium mb-1.5 md:mb-2">Why this matches:</p>
                        <div className="space-y-0.5 md:space-y-1">
                          {match.matchReasons.slice(0, 5).map((reason: string, index: number) => (
                            <div key={index} className="flex items-start gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Professor Info */}
                    {match.professor && (
                      <div className="p-2.5 md:p-3 bg-muted/30 rounded-lg">
                        <p className="font-semibold text-sm md:text-base">{match.professor.name}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">{match.professor.title} • {match.professor.department}</p>
                        {match.professor.labWebsite && (
                          <a href={match.professor.labWebsite} target="_blank" rel="noopener noreferrer" className="text-xs md:text-sm text-primary hover:underline flex items-center gap-1 mt-1">
                            <Globe className="h-3 w-3" />
                            {match.professor.labName || "Lab Website"}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Project Details */}
                    <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                        <span>{match.project?.duration}</span>
                      </div>
                      {match.project?.isPaid && (
                        <div className="flex items-center gap-1 text-green-600">
                          <DollarSign className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          <span>{t.projectDetail.paid}</span>
                        </div>
                      )}
                      {match.project?.isRemote && (
                        <Badge variant="secondary" className="text-xs">{t.projectDetail.remote}</Badge>
                      )}
                    </div>

                    {/* Research Areas */}
                    {match.project?.researchAreas && match.project.researchAreas.length > 0 && (
                      <div>
                        <p className="text-xs md:text-sm font-medium mb-1.5 md:mb-2">{t.projectDetail.researchAreas}:</p>
                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                          {match.project.researchAreas.slice(0, 4).map((area: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">{area}</Badge>
                          ))}
                          {match.project.researchAreas.length > 4 && (
                            <Badge variant="outline" className="text-xs">+{match.project.researchAreas.length - 4}</Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link href={`/project/${match.projectId}`} className="flex-1 sm:flex-none">
                      <Button size="sm" className="w-full sm:w-auto">{t.explore.viewDetails}</Button>
                    </Link>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => toast.info("Feature coming soon")}>
                      Save Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
