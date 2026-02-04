import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { Coins, Calendar, ShoppingCart } from "lucide-react";

interface InsufficientCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingCredits: number;
}

export function InsufficientCreditsDialog({
  open,
  onOpenChange,
  remainingCredits,
}: InsufficientCreditsDialogProps) {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const handlePurchaseClick = () => {
    onOpenChange(false);
    setLocation("/contact");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Coins className="h-6 w-6 text-amber-500" />
            <AlertDialogTitle>{t.creditsSystem.dailyLimitTitle}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4 text-left">
            <p className="text-sm leading-relaxed">
              {t.creditsSystem.dailyLimitMessage}
            </p>
            
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">{t.creditsSystem.resetInfo}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Coins className="h-4 w-4" />
                <span>{t.creditsSystem.creditsRemaining}: {remainingCredits}</span>
              </div>
            </div>

            <p className="text-sm leading-relaxed">
              {t.creditsSystem.purchaseOption}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogAction onClick={() => onOpenChange(false)} className="order-2 sm:order-1">
            {t.creditsSystem.understandButton}
          </AlertDialogAction>
          <Button
            onClick={handlePurchaseClick}
            variant="default"
            className="order-1 sm:order-2 w-full sm:w-auto"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {t.creditsSystem.contactButton}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
