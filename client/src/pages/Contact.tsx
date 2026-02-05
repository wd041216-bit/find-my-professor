import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { ArrowLeft, Mail, MessageCircle, Coins, Calendar, ShoppingCart } from "lucide-react";

export default function Contact() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.common.back}
          </Button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t.contact.title}
          </h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t.contact.welcomeTitle}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t.contact.welcomeMessage}
          </p>
        </div>

        {/* Pricing Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Subscription Plan */}
          <Card className="border-2 border-blue-200 hover:border-blue-400 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-xl">{t.contact.subscriptionTitle}</CardTitle>
              </div>
              <CardDescription className="text-base">
                {t.contact.subscriptionDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {t.contact.subscriptionPrice}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t.contact.subscriptionCredits}
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Coins className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{t.contact.subscriptionFeature1}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Coins className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{t.contact.subscriptionFeature2}</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Pay-as-you-go Plan */}
          <Card className="border-2 border-purple-200 hover:border-purple-400 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
                <CardTitle className="text-xl">{t.contact.payAsYouGoTitle}</CardTitle>
              </div>
              <CardDescription className="text-base">
                {t.contact.payAsYouGoDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {t.contact.payAsYouGoPrice}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t.contact.payAsYouGoCredits}
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Coins className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>{t.contact.payAsYouGoFeature1}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Coins className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>{t.contact.payAsYouGoFeature2}</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {t.contact.contactMethodsTitle}
            </CardTitle>
            <CardDescription>
              {t.contact.contactMethodsDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email Contact */}
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{t.contact.emailTitle}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {t.contact.emailDescription}
                </p>
                <a
                  href="mailto:support@findmyprofessor.xyz"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  support@findmyprofessor.xyz
                </a>
              </div>
            </div>

            {/* WeChat Contact */}
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <MessageCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{t.contact.wechatTitle}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {t.contact.wechatDescription}
                </p>
                <p className="text-sm font-medium">
                  {t.contact.wechatId}: <span className="text-primary">FindMyProfessor</span>
                </p>
              </div>
            </div>

            {/* User Info (if logged in) */}
            {user && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-2 text-sm">{t.contact.yourInfoTitle}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p><span className="font-medium">{t.contact.email}:</span> {user.email}</p>
                  <p><span className="font-medium">{t.contact.userId}:</span> {user.id}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t.contact.includeInfoMessage}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => setLocation("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.contact.backToDashboard}
          </Button>
        </div>
      </main>
    </div>
  );
}
