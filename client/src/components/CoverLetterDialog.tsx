import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check, FileText } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface CoverLetterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  projectName: string;
  professorName: string;
  university: string;
  loading?: boolean;
}

export function CoverLetterDialog({
  open,
  onOpenChange,
  content,
  projectName,
  professorName,
  university,
  loading = false,
}: CoverLetterDialogProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success(t.coverLetter?.copied || "已复制到剪贴板");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t.coverLetter?.copyFailed || "复制失败");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t.coverLetter?.title || "申请文书"}
          </DialogTitle>
          <DialogDescription>
            {projectName} - {professorName} ({university})
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">
              {t.coverLetter?.generating || "正在生成文书..."}
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-6 whitespace-pre-wrap text-sm leading-relaxed">
              {content}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {t.coverLetter?.copied || "已复制"}
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    {t.coverLetter?.copy || "复制"}
                  </>
                )}
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                {t.common?.close || "关闭"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
