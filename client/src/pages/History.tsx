import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2, Heart, Mail, Globe, FlaskConical, Sparkles, X, ExternalLink, Trash2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function History() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedProfessor, setSelectedProfessor] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCoverLetterDialog, setShowCoverLetterDialog] = useState(false);
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [coverLetterContent, setCoverLetterContent] = useState("");

  // Fetch liked professors
  const { data: likedProfessors = [], isLoading, refetch } = trpc.swipe.getLikedProfessors.useQuery(undefined, {
    enabled: !!user,
  });

  // Unlike professor mutation
  const unlikeMutation = trpc.swipe.unlike.useMutation({
    onSuccess: () => {
      toast.success("Removed from matches");
      refetch();
    },
    onError: () => {
      toast.error("Failed to remove match");
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
      });

      setCoverLetterContent(result.content);
    } catch (error: any) {
      toast.error("Failed to generate cover letter");
      setShowCoverLetterDialog(false);
    } finally {
      setGeneratingLetter(false);
    }
  };

  const handleUnlike = (professorId: number) => {
    if (confirm("Remove this professor from your matches?")) {
      unlikeMutation.mutate({ professorId });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
      {/* Header */}
      <div className="p-4 md:p-6 flex items-center justify-between bg-white/80 backdrop-blur-sm shadow-md">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-purple-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Back</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 md:w-7 md:h-7 text-pink-500 fill-pink-500" />
            <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Match History
            </h1>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm font-semibold">
          {likedProfessors.length} {likedProfessors.length === 1 ? "Match" : "Matches"}
        </Badge>
      </div>

      {/* Main Content */}
      <main className="container py-6 md:py-8 max-w-4xl">
        {likedProfessors.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
              <Heart className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Start swiping to find professors that match your research interests!
              </p>
              <Link href="/swipe">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Heart className="w-4 h-4 mr-2" />
                  Start Swiping
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
                      <CardTitle className="text-xl mb-2 flex items-center gap-2">
                        {match.professor.name}
                        {match.likeType === "super_like" && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                            ⭐ Super Like
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="font-medium">{match.professor.title || "Professor"}</p>
                        {match.professor.majorName && <p>{match.professor.majorName}</p>}
                        <p className="font-semibold text-purple-600">{match.professor.university}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {match.matchScore && (
                        <Badge variant="secondary" className="self-start whitespace-nowrap bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-bold">
                          {match.matchScore}% Match
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Liked {new Date(match.createdAt).toLocaleDateString()}
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
                        Research Field
                      </h4>
                      <Badge variant="outline" className="text-sm">
                        {match.professor.research_field}
                      </Badge>
                    </div>
                  )}

                  {/* Research Tags */}
                  {match.professor.tags && match.professor.tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Research Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {match.professor.tags.slice(0, 5).map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {match.professor.tags.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{match.professor.tags.length - 5} more
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
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateCoverLetter(match)}
                      className="gap-2 border-purple-300 hover:bg-purple-50"
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate Cover Letter
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUnlike(match.professor.id)}
                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
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
                <h4 className="font-semibold mb-2">Position</h4>
                <p className="text-muted-foreground">
                  {selectedProfessor.professor.title || "Professor"}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Institution</h4>
                <p className="text-muted-foreground">
                  {selectedProfessor.professor.majorName && (
                    <>{selectedProfessor.professor.majorName}, </>
                  )}
                  {selectedProfessor.professor.university}
                </p>
              </div>

              {selectedProfessor.professor.research_field && (
                <div>
                  <h4 className="font-semibold mb-2">Research Field</h4>
                  <Badge>{selectedProfessor.professor.research_field}</Badge>
                </div>
              )}

              {selectedProfessor.professor.tags && selectedProfessor.professor.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Research Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfessor.professor.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedProfessor.professor.bio && (
                <div>
                  <h4 className="font-semibold mb-2">Bio</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedProfessor.professor.bio}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  onClick={() => {
                    const professorName = selectedProfessor.professor.name;
                    const university = selectedProfessor.professor.university;
                    
                    // Copy professor name to clipboard
                    navigator.clipboard.writeText(professorName).then(() => {
                      toast.success("Professor name copied to clipboard!");
                    }).catch(() => {
                      toast.error("Failed to copy to clipboard");
                    });
                    
                    // Open Google search in new tab
                    const searchQuery = encodeURIComponent(`${professorName} ${university}`);
                    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
                  }}
                  className="w-full"
                  variant="default"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Find This Professor on Google
                </Button>
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
              AI-Generated Cover Letter
            </DialogTitle>
          </DialogHeader>
          {generatingLetter ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
              <p className="text-muted-foreground">Generating your personalized cover letter...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-6 border">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {coverLetterContent}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(coverLetterContent)}
                  className="flex-1"
                >
                  Copy to Clipboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCoverLetterDialog(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
