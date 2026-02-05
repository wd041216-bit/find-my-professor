import { useAuth } from "@/_core/hooks/useAuth";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Loader2, MapPin, GraduationCap, Mail, Building, FileText, Copy, Check, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ProjectDetail() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const matchId = parseInt(params.id || "0", 10) || 0;
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [showLetterDialog, setShowLetterDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: matchHistory = [] } = trpc.matching.getMatchHistory.useQuery(undefined, {
    enabled: !!user,
  });

  const generateMutation = trpc.application.generateLetter.useMutation({
    onSuccess: (data) => {
      setGeneratedLetter(data.letter);
      setShowLetterDialog(true);
      setIsGenerating(false);
      toast.success("Application letter generated successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to generate letter: ${error.message}`);
      setIsGenerating(false);
    },
  });

  const handleGenerateLetter = () => {
    setIsGenerating(true);
    // Use matchId as projectId since it's the match record ID
    generateMutation.mutate({ projectId: matchId });
  };

  const handleCopyLetter = () => {
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    toast.success("Letter copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLetter = () => {
    const blob = new Blob([generatedLetter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `application-letter-${matchId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Letter downloaded!");
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

  const matchData = matchHistory.find(m => m.id === matchId);
  
  if (!matchData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-2">Project not found</h2>
            <p className="text-muted-foreground">This project may not exist or you don't have access to it.</p>
          </div>
        </div>
      </div>
    );
  }

  const matchReasons = (() => {
    try {
      if (!matchData.matchReasons) return [];
      const parsed = JSON.parse(matchData.matchReasons as string);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse matchReasons:', e);
      return [];
    }
  })();

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

      <div className="container py-8 max-w-5xl">
        {/* Project Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <CardTitle className="text-3xl">{matchData.projectName}</CardTitle>
                  <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                    <span className="text-sm font-medium">Match Score:</span>
                    <span className="text-xl font-bold">{matchData.matchScore}%</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    <span className="font-medium">{matchData.university}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    <span>{matchData.major}</span>
                  </div>
                  {matchData.lab && (
                    <Badge variant="outline" className="text-sm">{matchData.lab}</Badge>
                  )}
                </div>

                <CardDescription className="text-base leading-relaxed">
                  {matchData.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Match Reasons */}
            <Card>
              <CardHeader>
                <CardTitle>Why This Matches You</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {matchReasons && matchReasons.length > 0 ? (
                    matchReasons.map((reason: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <p className="text-sm">{reason}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No match reasons available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Research Direction */}
            <Card>
              <CardHeader>
                <CardTitle>Research Direction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{matchData.researchDirection}</p>
              </CardContent>
            </Card>

            {/* Requirements */}
            {matchData.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{matchData.requirements}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Professor Info */}
            <Card>
              <CardHeader>
                <CardTitle>Professor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold text-lg">{matchData.professorName}</p>
                  {matchData.lab && (
                    <p className="text-sm text-muted-foreground">{matchData.lab}</p>
                  )}
                </div>
                
                {matchData.contactEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${matchData.contactEmail}`} className="text-primary hover:underline">
                      {matchData.contactEmail}
                    </a>
                  </div>
                )}
                
                {matchData.url && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <a href={matchData.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Project Page
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={handleGenerateLetter}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Application Letter
                    </>
                  )}
                </Button>
                
                {matchData.contactEmail && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(`mailto:${matchData.contactEmail}`, '_blank')}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Contact Professor
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Application Letter Dialog */}
      <Dialog open={showLetterDialog} onOpenChange={setShowLetterDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generated Application Letter</DialogTitle>
            <DialogDescription>
              Review and customize your application letter before sending
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm font-sans">{generatedLetter}</pre>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCopyLetter} variant="outline" className="flex-1">
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
              <Button onClick={handleDownloadLetter} variant="outline" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
