import { Footer } from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function UploadResume() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadAndParseMutation = trpc.resume.uploadAndParse.useMutation({
    onSuccess: (data) => {
      setParseResult(data);
      toast.success(`Successfully extracted ${data.activitiesCreated} activities and ${data.skillsExtracted} skills!`);
    },
    onError: (error) => {
      toast.error(`Failed to parse resume: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "doc", "docx"].includes(fileExtension || "")) {
        toast.error("Please upload a PDF or Word document");
        return;
      }
      
      if (selectedFile.size > 16 * 1024 * 1024) {
        toast.error("File size must be less than 16MB");
        return;
      }
      
      setFile(selectedFile);
      setParseResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Content = e.target?.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Data = base64Content.split(",")[1];
        
        // Determine MIME type
        let mimeType = "application/pdf";
        const fileExtension = file.name.split(".").pop()?.toLowerCase();
        if (fileExtension === "doc") {
          mimeType = "application/msword";
        } else if (fileExtension === "docx") {
          mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        
        // Upload and parse
        await uploadAndParseMutation.mutateAsync({
          fileName: file.name,
          fileContent: base64Data,
          mimeType,
        });
      };
      
      reader.onerror = () => {
        toast.error("Failed to read file");
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload file");
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
      <div className="container py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Upload Resume</CardTitle>
            <CardDescription>
              Upload your resume in PDF or Word format. Our AI will automatically extract your activities, skills, and experiences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Section */}
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {!file ? (
                <>
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Choose a file to upload</h3>
                  <p className="text-muted-foreground mb-4">
                    PDF or Word document (max 16MB)
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Select File
                  </Button>
                </>
              ) : (
                <>
                  <FileText className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{file.name}</h3>
                  <p className="text-muted-foreground mb-4">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={handleUpload} disabled={uploadAndParseMutation.isPending}>
                      {uploadAndParseMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload & Parse
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFile(null);
                        setParseResult(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      disabled={uploadAndParseMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Parse Result */}
            {parseResult && (
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-primary" />
                    <CardTitle>Parsing Complete!</CardTitle>
                  </div>
                  <CardDescription>
                    Your resume has been successfully analyzed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-background rounded-lg p-4">
                      <div className="text-3xl font-bold text-primary">{parseResult.activitiesCreated}</div>
                      <p className="text-sm text-muted-foreground">Activities Extracted</p>
                    </div>
                    <div className="bg-background rounded-lg p-4">
                      <div className="text-3xl font-bold text-primary">{parseResult.skillsExtracted}</div>
                      <p className="text-sm text-muted-foreground">Skills Identified</p>
                    </div>
                  </div>

                  {parseResult.activities && parseResult.activities.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Extracted Activities:</h4>
                      <div className="space-y-2">
                        {parseResult.activities.map((activity: any, index: number) => (
                          <div key={index} className="bg-background rounded-lg p-3 border">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{activity.title}</p>
                                {activity.organization && (
                                  <p className="text-sm text-muted-foreground">{activity.organization}</p>
                                )}
                              </div>
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                {activity.category}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link href="/activities">
                      <Button className="flex-1">
                        View All Activities
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFile(null);
                        setParseResult(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      Upload Another
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Tips for Best Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Use a well-formatted resume with clear sections</p>
                <p>• Include dates, organization names, and detailed descriptions</p>
                <p>• List specific skills and achievements for each experience</p>
                <p>• Supported formats: PDF, DOC, DOCX (max 16MB)</p>
                <p>• Review and edit extracted activities after parsing</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
