import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2, FileText, Download, Trash2, Eye, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateUniversity } from "@/lib/universityTranslation";

export default function CoverLetters() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [selectedLetter, setSelectedLetter] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const isZh = language === 'zh';

  // Fetch cover letters
  const { data: letters = [], isLoading, refetch } = trpc.coverLetter.getMyLetters.useQuery(undefined, {
    enabled: !!user,
  });

  // Delete mutation
  const deleteMutation = trpc.coverLetter.delete.useMutation({
    onSuccess: () => {
      toast.success(isZh ? "申请信已删除" : "Cover letter deleted");
      refetch();
    },
    onError: () => {
      toast.error(isZh ? "删除失败，请重试" : "Failed to delete cover letter");
    },
  });

  // Mark downloaded mutation
  const markDownloadedMutation = trpc.coverLetter.markDownloaded.useMutation();

  // Mark viewed mutation
  const markViewedMutation = trpc.coverLetter.markViewed.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleViewLetter = (letter: any) => {
    setSelectedLetter(letter);
    setShowDetailDialog(true);
    if (!letter.viewed) {
      markViewedMutation.mutate({ id: letter.id });
    }
  };

  const handleDelete = (letterId: number) => {
    if (confirm(isZh ? "确定要删除这封申请信吗？" : "Delete this cover letter?")) {
      deleteMutation.mutate({ id: letterId });
    }
  };

  const handleDownload = (letter: any) => {
    const blob = new Blob([letter.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-letter-${letter.professorName.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    markDownloadedMutation.mutate({ id: letter.id });
    toast.success(isZh ? "申请信已下载" : "Cover letter downloaded");
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
    setLocation(isZh ? "/zh/swipe" : "/");
    return null;
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
            <FileText className="w-6 h-6 md:w-7 md:h-7 text-purple-500" />
            <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {isZh ? '我的申请文书' : 'My Cover Letters'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Badge variant="secondary" className="text-sm font-semibold">
            {letters.length} {isZh ? '文书' : (letters.length === 1 ? 'Letter' : 'Letters')}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <main className="container py-6 md:py-8 max-w-4xl">
        {letters.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isZh ? '还没有申请文书' : 'No cover letters yet'}
              </h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                {isZh ? '在匹配记录中为教授生成申请信以开始！' : 'Generate cover letters from your Match History to get started!'}
              </p>
              <Link href={isZh ? "/zh/history" : "/history"}>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <FileText className="w-4 h-4 mr-2" />
                  {isZh ? '前往匹配记录' : 'Go to Match History'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {letters.map((letter: any) => (
              <Card key={letter.id} className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl mb-1 flex items-center gap-2">
                        {letter.professorName}
                        {!letter.viewed && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            {isZh ? '新' : 'New'}
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="space-y-0.5 text-sm text-muted-foreground">
                        <p className="font-semibold text-purple-600">
                          {isZh ? translateUniversity(letter.university) : letter.university}
                        </p>
                        <p>{letter.projectName}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge variant="outline" className="self-start whitespace-nowrap capitalize">
                        {isZh
                          ? (letter.tone === 'formal' ? '正式' : letter.tone === 'casual' ? '轻松' : letter.tone === 'enthusiastic' ? '热情' : letter.tone)
                          : letter.tone}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(letter.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Preview — letter content always in English */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {letter.content}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleViewLetter(letter)}
                      className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Eye className="h-4 w-4" />
                      {isZh ? '查看全文' : 'View Full'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(letter)}
                      className="gap-2 border-green-300 hover:bg-green-50"
                    >
                      <Download className="h-4 w-4" />
                      {isZh ? '下载' : 'Download'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(letter.id)}
                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isZh ? '删除' : 'Delete'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Letter Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {isZh ? `${selectedLetter?.professorName} 的申请信` : `Cover Letter for ${selectedLetter?.professorName}`}
            </DialogTitle>
          </DialogHeader>
          {selectedLetter && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">{isZh ? '基本信息' : 'Details'}</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    <strong>{isZh ? '大学：' : 'University:'}</strong>{' '}
                    {isZh ? translateUniversity(selectedLetter.university) : selectedLetter.university}
                  </p>
                  <p>
                    <strong>{isZh ? '研究方向：' : 'Research Area:'}</strong>{' '}
                    {selectedLetter.projectName}
                  </p>
                  <p>
                    <strong>{isZh ? '语气：' : 'Tone:'}</strong>{' '}
                    <span className="capitalize">
                      {isZh
                        ? (selectedLetter.tone === 'formal' ? '正式' : selectedLetter.tone === 'casual' ? '轻松' : selectedLetter.tone === 'enthusiastic' ? '热情' : selectedLetter.tone)
                        : selectedLetter.tone}
                    </span>
                  </p>
                  <p>
                    <strong>{isZh ? '生成时间：' : 'Created:'}</strong>{' '}
                    {new Date(selectedLetter.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">{isZh ? '申请信内容' : 'Letter Content'}</h4>
                {/* Letter content always displayed in English as generated */}
                <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                  {selectedLetter.content}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(selectedLetter.content)}
                  className="flex-1"
                  variant="outline"
                >
                  {isZh ? '复制到剪贴板' : 'Copy to Clipboard'}
                </Button>
                <Button
                  onClick={() => handleDownload(selectedLetter)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isZh ? '下载' : 'Download'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
