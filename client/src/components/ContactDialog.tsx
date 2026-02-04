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

interface ContactDialogProps {
  trigger?: React.ReactNode;
}

export function ContactDialog({ trigger }: ContactDialogProps) {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [messageType, setMessageType] = useState<"business" | "support" | "purchase">("support");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [paymentAccount, setPaymentAccount] = useState("");
  const [creditAmount, setCreditAmount] = useState("");

  const sendMutation = trpc.contact.send.useMutation({
    onSuccess: () => {
      toast.success("Message sent successfully! We'll get back to you soon.");
      setSubject("");
      setMessage("");
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (messageType === "purchase") {
      if (!paymentAccount.trim() || !creditAmount.trim()) {
        toast.error("Please provide your payment account and credit amount");
        return;
      }
      const purchaseSubject = `Credit Purchase Request: ${creditAmount} credits`;
      const purchaseMessage = `Payment Account: ${paymentAccount}\nCredits Requested: ${creditAmount}\n\nAdditional Notes:\n${message || "None"}`;
      sendMutation.mutate({ messageType, subject: purchaseSubject, message: purchaseMessage });
    } else {
      if (!subject.trim() || !message.trim()) {
        toast.error("Please fill in all fields");
        return;
      }
      sendMutation.mutate({ messageType, subject, message });
    }
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Us</DialogTitle>
            <DialogDescription>
              Please log in to send us a message.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <Button asChild>
              <a href={getLoginUrl()}>Log in to Continue</a>
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
            Contact
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Contact Us</DialogTitle>
          <DialogDescription>
            Have a question or feedback? Send us a message and we'll get back to you soon.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="messageType">Message Type</Label>
            <Select value={messageType} onValueChange={(value: "business" | "support" | "purchase") => setMessageType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="support">Problem / Question</SelectItem>
                <SelectItem value="business">Business Cooperation</SelectItem>
                <SelectItem value="purchase">Purchase Credits (China Only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {messageType === "purchase" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="paymentAccount">WeChat / Alipay Account</Label>
                <Input
                  id="paymentAccount"
                  placeholder="Your WeChat ID or Alipay account"
                  value={paymentAccount}
                  onChange={(e) => setPaymentAccount(e.target.value)}
                  disabled={sendMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditAmount">Credits to Purchase</Label>
                <Input
                  id="creditAmount"
                  type="number"
                  placeholder="e.g., 500"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  disabled={sendMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  We'll contact you with pricing and payment details.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Additional Notes (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Any special requirements or questions..."
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={sendMutation.isPending}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="What's this about?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={sendMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us more..."
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={sendMutation.isPending}
                />
              </div>
            </>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={sendMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sendMutation.isPending}>
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
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
