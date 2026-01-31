import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2, MapPin, Clock, DollarSign, Globe, GraduationCap, Target, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Explore() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [calculating, setCalculating] = useState(false);

  const { data: matchesWithDetails = [], refetch, isLoading } = trpc.matching.getMatchesWithDetails.useQuery(undefined, {
    enabled: !!user,
  });

  const calculateMutation = trpc.matching.calculateMatches.useMutation({
    onSuccess: (data) => {
      toast.success(`Found ${data.totalMatches} matching projects!`);
      refetch();
      setCalculating(false);
    },
    onError: (error) => {
      toast.error(`Failed to calculate matches: ${error.message}`);
      setCalculating(false);
    },
  });

  const handleCalculateMatches = () => {
    setCalculating(true);
    calculateMutation.mutate();
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
        <div className="container flex h-16 items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold">Find My Professor</span>
          </div>
        </div>
      </nav>

      <div className="container py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Explore Research Projects</h1>
          <p className="text-muted-foreground text-lg">
            Discover research opportunities matched to your profile
          </p>
        </div>

        {/* Calculate Matches Button */}
        <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Smart Matching
            </CardTitle>
            <CardDescription>
              Calculate your match scores with available research projects based on your profile, skills, and interests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleCalculateMatches}
              disabled={calculating || calculateMutation.isPending}
              size="lg"
            >
              {calculating || calculateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Calculating Matches...
                </>
              ) : (
                <>
                  <Target className="mr-2 h-5 w-5" />
                  Calculate My Matches
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Matches List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : matchesWithDetails.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No matches yet</h3>
              <p className="text-muted-foreground mb-6">
                Click "Calculate My Matches" to find research projects that align with your profile
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Your Matches ({matchesWithDetails.length})</h2>
            </div>

            {matchesWithDetails.map((match) => (
              <Card key={match.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-2xl">{match.project?.title}</CardTitle>
                        <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full">
                          <Target className="h-4 w-4" />
                          <span className="font-bold">{match.matchScore}%</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          <span>{match.university?.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{match.university?.country}</span>
                        </div>
                      </div>

                      <CardDescription className="text-base mb-4">
                        {match.project?.description}
                      </CardDescription>

                      {/* Match Reasons */}
                      {match.matchReasons && match.matchReasons.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Why this matches:</p>
                          <div className="space-y-1">
                            {match.matchReasons.map((reason: string, index: number) => (
                              <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="text-primary mt-1">•</span>
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Professor Info */}
                      {match.professor && (
                        <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                          <p className="font-semibold">{match.professor.name}</p>
                          <p className="text-sm text-muted-foreground">{match.professor.title} • {match.professor.department}</p>
                          {match.professor.labWebsite && (
                            <a href={match.professor.labWebsite} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
                              <Globe className="h-3 w-3" />
                              {match.professor.labName || "Lab Website"}
                            </a>
                          )}
                        </div>
                      )}

                      {/* Project Details */}
                      <div className="flex flex-wrap gap-4 text-sm mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{match.project?.duration}</span>
                        </div>
                        {match.project?.isPaid && (
                          <div className="flex items-center gap-1 text-green-600">
                            <DollarSign className="h-4 w-4" />
                            <span>Paid Position</span>
                          </div>
                        )}
                        {match.project?.isRemote && (
                          <Badge variant="secondary">Remote Available</Badge>
                        )}
                      </div>

                      {/* Research Areas */}
                      {match.project?.researchAreas && match.project.researchAreas.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Research Areas:</p>
                          <div className="flex flex-wrap gap-2">
                            {match.project.researchAreas.map((area: string, index: number) => (
                              <Badge key={index} variant="outline">{area}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Requirements */}
                      {match.project?.requirements && match.project.requirements.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Requirements:</p>
                          <div className="flex flex-wrap gap-2">
                            {match.project.requirements.map((req: string, index: number) => (
                              <Badge key={index} className="bg-accent/10 text-accent-foreground">{req}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Link href={`/project/${match.projectId}`}>
                      <Button>View Details</Button>
                    </Link>
                    <Button variant="outline">Save Project</Button>
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
