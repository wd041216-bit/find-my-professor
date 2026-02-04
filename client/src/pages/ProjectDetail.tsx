import { useAuth } from "@/_core/hooks/useAuth";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Loader2, MapPin, Clock, DollarSign, Globe, GraduationCap, Mail, Building, FileText, Copy, Check, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ProjectDetail() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [showLetterDialog, setShowLetterDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: matchesWithDetails = [] } = trpc.matching.getMatchesWithDetails.useQuery(undefined, {
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
    generateMutation.mutate({ projectId });
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
    a.download = `application-letter-${projectId}.txt`;
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

  const matchData = matchesWithDetails.find(m => m.projectId === projectId);
  
  if (!matchData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Link href="/explore">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Explore
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

  const { project, professor, university, matchScore, matchReasons } = matchData;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/explore">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Explore
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
                  <CardTitle className="text-3xl">{project?.title}</CardTitle>
                  <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                    <span className="text-sm font-medium">Match Score:</span>
                    <span className="text-xl font-bold">{matchScore}%</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    <span className="font-medium">{university?.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{university?.country}</span>
                  </div>
                  <Badge variant="outline" className="text-sm">{project?.status}</Badge>
                </div>

                <CardDescription className="text-base leading-relaxed">
                  {project?.description}
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

            {/* Research Areas */}
            {project?.researchAreas && project.researchAreas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Research Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.researchAreas.map((area: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            {project?.requirements && project.requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {project.requirements.map((req: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Duration:</span>
                  <span>{project?.duration}</span>
                </div>
                {project?.isPaid && (
                  <div className="flex items-center gap-2 text-green-600">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">Paid Position</span>
                  </div>
                )}
                {project?.isRemote && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Remote Work Available</span>
                  </div>
                )}
                {project?.majors && project.majors.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Preferred Majors:</p>
                    <div className="flex flex-wrap gap-2">
                      {project.majors.map((major: string, index: number) => (
                        <Badge key={index} variant="outline">{major}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Professor Info */}
            {professor && (
              <Card>
                <CardHeader>
                  <CardTitle>Professor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold text-lg">{professor.name}</p>
                    <p className="text-sm text-muted-foreground">{professor.title}</p>
                    <p className="text-sm text-muted-foreground">{professor.department}</p>
                  </div>
                  
                  {professor.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${professor.email}`} className="text-primary hover:underline">
                        {professor.email}
                      </a>
                    </div>
                  )}
                  
                  {professor.labName && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{professor.labName}</span>
                    </div>
                  )}
                  
                  {professor.labWebsite && (
                    <a
                      href={professor.labWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Visit Lab Website
                    </a>
                  )}
                  
                  {professor.bio && (
                    <p className="text-sm text-muted-foreground pt-2 border-t">
                      {professor.bio}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle>Apply Now</CardTitle>
                <CardDescription>Generate a personalized application letter</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleGenerateLetter}
                  disabled={isGenerating || generateMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating || generateMutation.isPending ? (
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
                <Button variant="outline" className="w-full">
                  Save Project
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Generated Letter Dialog */}
      <Dialog open={showLetterDialog} onOpenChange={setShowLetterDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Your Application Letter</DialogTitle>
            <DialogDescription>
              Review and customize your personalized application letter
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted/30 p-6 rounded-lg">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {generatedLetter}
                </ReactMarkdown>
              </div>
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
                Download as Text
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground bg-accent/10 p-4 rounded-lg">
              <p className="font-medium mb-1">💡 Next Steps:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Review and personalize the letter with your own voice</li>
                <li>Check professor's email and lab website for submission instructions</li>
                <li>Attach your CV and any required documents</li>
                <li>Send your application and follow up if needed</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}
