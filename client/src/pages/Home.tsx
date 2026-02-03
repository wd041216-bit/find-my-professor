import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Search, BookOpen, FileText, Bell, ArrowRight, GraduationCap, Users, Target } from "lucide-react";
import { ContactDialog } from "@/components/ContactDialog";
import { MobileNav } from "@/components/MobileNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-14 md:h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <MobileNav />
            <GraduationCap className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            <span className="text-lg md:text-xl font-bold text-foreground">Find My Professor</span>
          </div>
          <div className="hidden md:flex items-center gap-2 lg:gap-4">
            <ContactDialog />
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">{t.nav.dashboard}</Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost" size="sm">{t.nav.profile}</Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm">{t.nav.signIn}</Button>
              </a>
            )}
          </div>
          {/* Mobile right side */}
          <div className="flex md:hidden items-center gap-1">
            <LanguageSwitcher />
            {!isAuthenticated && (
              <a href={getLoginUrl()}>
                <Button size="sm">{t.nav.signIn}</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 md:py-20 lg:py-32 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-balance">
              {t.home.heroTitle}
              <span className="block text-primary mt-1 md:mt-2">{t.home.heroTitleHighlight}</span>
            </h1>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance px-2">
              {t.home.heroDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8">
                    {t.home.goToDashboard}
                    <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full text-base md:text-lg px-6 md:px-8">
                    {t.home.getStarted}
                    <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </a>
              )}
              <Link href="/explore" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full text-base md:text-lg px-6 md:px-8">
                  {t.home.exploreProjects}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 lg:py-32 bg-card/30">
        <div className="container px-4">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-3 md:mb-4">{t.home.howItWorks}</h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
              {t.home.howItWorksDesc}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="p-4 md:p-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 md:mb-4">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <CardTitle className="text-base md:text-lg">{t.home.createProfile}</CardTitle>
                <CardDescription className="text-sm">
                  {t.home.createProfileDesc}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="p-4 md:p-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 md:mb-4">
                  <Search className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <CardTitle className="text-base md:text-lg">{t.home.smartMatching}</CardTitle>
                <CardDescription className="text-sm">
                  {t.home.smartMatchingDesc}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="p-4 md:p-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 md:mb-4">
                  <Target className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <CardTitle className="text-base md:text-lg">{t.home.viewMatches}</CardTitle>
                <CardDescription className="text-sm">
                  {t.home.viewMatchesDesc}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="p-4 md:p-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 md:mb-4">
                  <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <CardTitle className="text-base md:text-lg">{t.home.applyWithAI}</CardTitle>
                <CardDescription className="text-sm">
                  {t.home.applyWithAIDesc}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-12 md:py-20 lg:py-32">
        <div className="container px-4">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4 md:space-y-6 order-2 lg:order-1">
              <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold">
                {t.home.everythingYouNeed}
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                {t.home.everythingYouNeedDesc}
              </p>
              
              <div className="space-y-3 md:space-y-4">
                <div className="flex gap-3 md:gap-4">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-0.5 md:mb-1 text-sm md:text-base">{t.home.resumeAnalysis}</h3>
                    <p className="text-muted-foreground text-sm">{t.home.resumeAnalysisDesc}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 md:gap-4">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Search className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-0.5 md:mb-1 text-sm md:text-base">{t.home.intelligentSearch}</h3>
                    <p className="text-muted-foreground text-sm">{t.home.intelligentSearchDesc}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 md:gap-4">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-0.5 md:mb-1 text-sm md:text-base">{t.home.smartNotifications}</h3>
                    <p className="text-muted-foreground text-sm">{t.home.smartNotificationsDesc}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative order-1 lg:order-2">
              <div className="aspect-square max-w-xs md:max-w-none mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <div className="text-center space-y-2 md:space-y-4 p-6 md:p-8">
                  <div className="text-4xl md:text-6xl font-bold text-primary">95%</div>
                  <p className="text-lg md:text-xl font-semibold">{t.home.matchAccuracy}</p>
                  <p className="text-muted-foreground text-sm md:text-base">{t.home.matchAccuracyDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 lg:py-32 bg-primary text-primary-foreground">
        <div className="container px-4 text-center space-y-6 md:space-y-8">
          <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold">
            {t.home.readyToStart}
          </h2>
          <p className="text-base md:text-xl opacity-90 max-w-2xl mx-auto px-2">
            {t.home.readyToStartDesc}
          </p>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="text-base md:text-lg px-6 md:px-8">
                {t.home.goToDashboard}
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="lg" variant="secondary" className="text-base md:text-lg px-6 md:px-8">
                {t.home.signUpNow}
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 md:py-12 bg-card/30">
        <div className="container px-4">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-semibold">Find My Professor</span>
            </div>
            <div className="flex items-center gap-4 md:gap-6 justify-center flex-wrap">
              <ContactDialog trigger={
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t.home.contactUs}
                </button>
              } />
              <Link href="/explore">
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  {t.home.exploreProjects}
                </span>
              </Link>
              <Link href="/terms">
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Terms of Service
                </span>
              </Link>
              <Link href="/privacy">
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Privacy Policy
                </span>
              </Link>
              <Link href="/refund">
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Refund Policy
                </span>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-right">
              {t.home.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
