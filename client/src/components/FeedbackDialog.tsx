import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Star, MessageSquare, X } from "lucide-react";

const FEEDBACK_DELAY_MS = 60 * 1000; // 1 minute
const STORAGE_KEY = "profmatch_feedback_submitted";

export function FeedbackDialog() {
  const { language } = useLanguage();
  const isZh = language === "zh";

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => setOpen(false), 2000);
    },
    onError: () => {
      toast.error(isZh ? "提交失败，请稍后再试" : "Submission failed, please try again");
    },
  });

  useEffect(() => {
    // Don't show if already submitted in this session
    const alreadySubmitted = sessionStorage.getItem(STORAGE_KEY);
    if (alreadySubmitted) return;

    const timer = setTimeout(() => {
      setOpen(true);
    }, FEEDBACK_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    // Mark as dismissed so it doesn't show again this session
    sessionStorage.setItem(STORAGE_KEY, "dismissed");
  }, []);

  const handleSubmit = useCallback(() => {
    if (rating === 0) {
      toast.error(isZh ? "请先选择评分" : "Please select a rating first");
      return;
    }
    if (!message.trim()) {
      toast.error(isZh ? "请填写反馈内容" : "Please enter your feedback");
      return;
    }

    submitMutation.mutate({
      rating,
      message: message.trim(),
      userEmail: email.trim() || undefined,
      page: window.location.pathname,
    });

    sessionStorage.setItem(STORAGE_KEY, "submitted");
  }, [rating, message, email, isZh, submitMutation]);

  const ratingLabels = isZh
    ? ["", "很差", "较差", "一般", "不错", "非常棒"]
    : ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md mx-4 rounded-2xl border-0 shadow-2xl bg-white p-0 overflow-hidden">
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-6 text-white">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <DialogTitle className="text-white text-lg font-bold">
                {isZh ? "分享你的体验" : "Share Your Experience"}
              </DialogTitle>
            </div>
            <button
              onClick={handleClose}
              className="text-white/70 hover:text-white transition-colors rounded-full p-1 hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <DialogDescription className="text-white/80 text-sm">
            {isZh
              ? "你的反馈帮助我们做得更好 🙏"
              : "Your feedback helps us improve 🙏"}
          </DialogDescription>
        </div>

        <div className="p-6 space-y-5">
          {submitted ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-lg font-semibold text-gray-800">
                {isZh ? "感谢你的反馈！" : "Thanks for your feedback!"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {isZh ? "你的意见对我们很重要" : "Your input means a lot to us"}
              </p>
            </div>
          ) : (
            <>
              {/* Star rating */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {isZh ? "整体评分" : "Overall Rating"}
                </p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoverRating || rating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                  {(hoverRating || rating) > 0 && (
                    <span className="ml-2 text-sm font-medium text-gray-600">
                      {ratingLabels[hoverRating || rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {isZh ? "你的反馈" : "Your Feedback"}
                </p>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    isZh
                      ? "告诉我们你的使用体验、建议或遇到的问题..."
                      : "Tell us about your experience, suggestions, or issues..."
                  }
                  className="resize-none h-24 text-sm border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                  maxLength={2000}
                />
                <p className="text-xs text-gray-400 text-right mt-1">
                  {message.length}/2000
                </p>
              </div>

              {/* Optional email */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {isZh ? "联系邮箱（可选）" : "Contact Email (optional)"}
                </p>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isZh ? "方便我们联系你" : "So we can follow up with you"}
                  className="text-sm border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 text-gray-600 border-gray-200 hover:bg-gray-50"
                >
                  {isZh ? "稍后再说" : "Maybe Later"}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-semibold"
                >
                  {submitMutation.isPending
                    ? isZh ? "提交中..." : "Submitting..."
                    : isZh ? "提交反馈" : "Submit Feedback"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
