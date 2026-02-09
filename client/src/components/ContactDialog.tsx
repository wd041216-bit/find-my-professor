import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";

interface ContactDialogProps {
  trigger?: React.ReactNode;
}

export function ContactDialog({ trigger }: ContactDialogProps) {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messageType, setMessageType] = useState<"business" | "support">("support");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const sendMutation = trpc.contact.send.useMutation({
    onSuccess: () => {
      toast.success(t.contact.messageSent);
      setSubject("");
      setMessage("");
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`${t.contact.sendFailed}: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast.error(t.contact.fillAllFields);
      return;
    }
    sendMutation.mutate({ messageType, subject, message });
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              {t.nav.contact}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.contact.title}</DialogTitle>
            <DialogDescription>
              {t.contact.loginRequired}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <Button asChild>
              <a href={getLoginUrl()}>{t.contact.loginToContinue}</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            {t.nav.contact}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.contact.title}</DialogTitle>
          <DialogDescription>
            {t.contact.subtitle}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="messageType">{t.contact.messageType}</Label>
            <Select value={messageType} onValueChange={(value: "business" | "support") => setMessageType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="support">{t.contact.problemQuestion}</SelectItem>
                <SelectItem value="business">{t.contact.businessCooperation}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">{t.contact.subject}</Label>
            <Input
              id="subject"
              placeholder={t.contact.subjectPlaceholder}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={sendMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">{t.contact.message}</Label>
            <Textarea
              id="message"
              placeholder={t.contact.messagePlaceholder}
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sendMutation.isPending}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={sendMutation.isPending}
            >
              {t.contact.cancel}
            </Button>
            <Button type="submit" disabled={sendMutation.isPending}>
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.contact.sending}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t.contact.send}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ContactDialog;
