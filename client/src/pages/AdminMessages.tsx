import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2, MessageSquare, Mail, Clock, User, Send, CheckCircle, XCircle, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminMessages() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [showReplyDialog, setShowReplyDialog] = useState(false);

  const { data: messages = [], refetch, isLoading } = trpc.contact.allMessages.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const replyMutation = trpc.contact.reply.useMutation({
    onSuccess: () => {
      toast.success("Reply sent successfully!");
      setReplyText("");
      setShowReplyDialog(false);
      setSelectedMessage(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to send reply: ${error.message}`);
    },
  });

  const updateStatusMutation = trpc.contact.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const handleReply = () => {
    if (!selectedMessage || !replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }
    replyMutation.mutate({ messageId: selectedMessage.id, reply: replyText });
  };

  const handleMarkAsRead = (messageId: number) => {
    updateStatusMutation.mutate({ messageId, status: "read" });
  };

  const handleClose = (messageId: number) => {
    updateStatusMutation.mutate({ messageId, status: "closed" });
  };

  const openReplyDialog = (message: any) => {
    setSelectedMessage(message);
    setReplyText("");
    setShowReplyDialog(true);
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

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Card>
            <CardContent className="py-16 text-center">
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground mb-6">
                You don't have permission to access this page.
              </p>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "read":
        return <Badge variant="outline">Read</Badge>;
      case "replied":
        return <Badge className="bg-green-500">Replied</Badge>;
      case "closed":
        return <Badge variant="destructive">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
            <MessageSquare className="h-5 w-5 text-primary" />
            <span className="font-semibold">Admin Messages</span>
          </div>
        </div>
      </nav>

      <div className="container py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Message Center</h1>
          <p className="text-muted-foreground">
            Manage and respond to user messages
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{messages.length}</div>
              <p className="text-sm text-muted-foreground">Total Messages</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-500">
                {messages.filter((m: any) => m.status === "pending").length}
              </div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">
                {messages.filter((m: any) => m.status === "replied").length}
              </div>
              <p className="text-sm text-muted-foreground">Replied</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-500">
                {messages.filter((m: any) => m.status === "closed").length}
              </div>
              <p className="text-sm text-muted-foreground">Closed</p>
            </CardContent>
          </Card>
        </div>

        {/* Messages List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
              <p className="text-muted-foreground">
                When users send messages, they'll appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {messages.map((message: any) => (
              <Card
                key={message.id}
                className={`transition-all ${
                  message.status === "pending"
                    ? "border-l-4 border-l-yellow-500"
                    : message.status === "replied"
                    ? "border-l-4 border-l-green-500"
                    : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{message.subject}</CardTitle>
                        {getStatusBadge(message.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{message.userName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>{message.userEmail}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(message.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 p-4 rounded-lg mb-4">
                    <p className="whitespace-pre-wrap">{message.message}</p>
                  </div>

                  {message.adminReply && (
                    <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-lg mb-4">
                      <p className="text-sm font-medium text-primary mb-2">Your Reply:</p>
                      <p className="whitespace-pre-wrap">{message.adminReply}</p>
                      {message.repliedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Replied at: {new Date(message.repliedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {message.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(message.id)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Mark as Read
                      </Button>
                    )}
                    {message.status !== "closed" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => openReplyDialog(message)}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {message.adminReply ? "Reply Again" : "Reply"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleClose(message.id)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Close
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reply to Message</DialogTitle>
            <DialogDescription>
              {selectedMessage && (
                <>
                  Replying to: <strong>{selectedMessage.userName}</strong> ({selectedMessage.userEmail})
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMessage && (
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm font-medium mb-1">{selectedMessage.subject}</p>
                <p className="text-sm text-muted-foreground">{selectedMessage.message}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reply">Your Reply</Label>
              <Textarea
                id="reply"
                placeholder="Type your reply here..."
                rows={5}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={replyMutation.isPending}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowReplyDialog(false)}
                disabled={replyMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReply}
                disabled={replyMutation.isPending || !replyText.trim()}
              >
                {replyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
