import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, History, DollarSign, Coins } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Credits() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [credits, setCredits] = useState<string>("1000");
  const [currency, setCurrency] = useState<"usd" | "cny">("usd");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: balance, isLoading: balanceLoading, refetch } = trpc.credits.getBalance.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: transactions, isLoading: transactionsLoading } = trpc.credits.getTransactions.useQuery(
    { limit: 20 },
    { enabled: !!user }
  );

  const createCheckout = trpc.credits.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        // Redirect to Stripe Checkout in the same window
        window.location.href = data.url;
      } else {
        toast.error("Failed to create checkout session");
        setIsProcessing(false);
      }
    },
    onError: (error) => {
      toast.error(error.message);
      setIsProcessing(false);
    },
  });

  const handlePurchase = () => {
    const creditAmount = parseInt(credits);
    if (isNaN(creditAmount) || creditAmount < 100) {
      toast.error(t.credits.minCredits || "Minimum purchase is 100 credits");
      return;
    }
    if (creditAmount > 100000) {
      toast.error(t.credits.maxCredits || "Maximum purchase is 100,000 credits");
      return;
    }

    setIsProcessing(true);
    createCheckout.mutate({ credits: creditAmount, currency });
  };

  const calculatePrice = () => {
    const creditAmount = parseInt(credits);
    if (isNaN(creditAmount)) return currency === "cny" ? "¥0.00" : "$0.00";
    if (currency === "cny") {
      return `¥${(creditAmount / 100 * 7).toFixed(2)}`;
    }
    return `$${(creditAmount / 100).toFixed(2)}`;
  };

  if (authLoading || balanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t.common.loginRequired || "Login Required"}</CardTitle>
            <CardDescription>{t.common.loginToAccess || "Please login to access this page"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">{t.common.goHome || "Go to Home"}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                ← {t.common.back || "Back"}
              </Button>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold">{t.credits.title || "Credits"}</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
        <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
          {/* Current Balance Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Coins className="h-5 w-5 text-primary" />
                {t.credits.currentBalance || "Current Balance"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 md:py-6">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {balance?.balance.toLocaleString() || "0"}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {t.credits.newUserBonus || "New users get 200 free credits!"}
                </p>
                <div className="text-sm text-muted-foreground">{t.credits.credits || "Credits"}</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.credits.totalPurchased || "Total Purchased"}:</span>
                  <span className="font-medium">{balance?.totalPurchased.toLocaleString() || "0"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.credits.totalConsumed || "Total Consumed"}:</span>
                  <span className="font-medium">{balance?.totalConsumed.toLocaleString() || "0"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Credits Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <CreditCard className="h-5 w-5 text-primary" />
                {t.credits.purchaseCredits || "Purchase Credits"}
              </CardTitle>
              <CardDescription>
                {t.credits.purchaseDescription || "1 credit = $0.01 USD. Minimum purchase: 100 credits ($1)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currency">{t.credits.selectCurrency || "Select Currency"}</Label>
                <Select value={currency} onValueChange={(value) => setCurrency(value as "usd" | "cny")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">🇺🇸 USD (US Dollar)</SelectItem>
                    <SelectItem value="cny">🇨🇳 CNY (Chinese Yuan)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="credits">{t.credits.enterAmount || "Enter Credit Amount"}</Label>
                <Input
                  id="credits"
                  type="number"
                  min="100"
                  max="100000"
                  step="100"
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  placeholder="1000"
                  className="text-lg"
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t.credits.price || "Price"}:</span>
                  <span className="text-2xl font-bold text-primary">{calculatePrice()}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {currency === "usd" ? "1 credit = $0.01 USD" : "1 credit = ¥0.07 CNY"}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[100, 500, 1000, 5000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setCredits(amount.toString())}
                    className="h-auto py-3 flex flex-col items-center gap-1"
                  >
                    <span className="font-bold">{amount}</span>
                    <span className="text-xs text-muted-foreground">
                      {currency === "cny" ? `¥${(amount / 100 * 7).toFixed(2)}` : `$${(amount / 100).toFixed(2)}`}
                    </span>
                  </Button>
                ))}
              </div>

              <Button
                onClick={handlePurchase}
                disabled={isProcessing}
                size="lg"
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t.common.processing || "Processing..."}
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-5 w-5" />
                    {t.credits.purchaseNow || "Purchase Now"}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {t.credits.securePayment || "Secure payment powered by Stripe. You will be redirected to complete your purchase."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="mt-6 md:mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <History className="h-5 w-5 text-primary" />
              {t.credits.transactionHistory || "Transaction History"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">{t.credits.date || "Date"}</th>
                      <th className="text-left py-3 px-2">{t.credits.type || "Type"}</th>
                      <th className="text-left py-3 px-2">{t.credits.description || "Description"}</th>
                      <th className="text-right py-3 px-2">{t.credits.amount || "Amount"}</th>
                      <th className="text-right py-3 px-2">{t.credits.balance || "Balance"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b last:border-0">
                        <td className="py-3 px-2 text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              tx.type === "purchase"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : tx.type === "consumption"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-2">{tx.description}</td>
                        <td className={`py-3 px-2 text-right font-medium ${tx.amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-right font-medium">{tx.balanceAfter.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t.credits.noTransactions || "No transactions yet"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
