import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Search, BookOpen, FileText, Bell, ArrowRight, GraduationCap, Users, Target, Coins, Flame, Heart, Sparkles, Zap } from "lucide-react";
import { ContactDialog } from "@/components/ContactDialog";
import { MobileNav } from "@/components/MobileNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { data: creditsData } = trpc.credits.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Navigation - Modern & Colorful */}
      <nav className="border-b border-purple-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container flex h-16 md:h-18 items-center justify-between">
          <div className="flex items-center gap-3">
            <MobileNav />
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">Find My Professor</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <ContactDialog />
            {isAuthenticated && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 shadow-sm">
                <Coins className="h-5 w-5" />
                <span className="text-sm font-bold">
                  {creditsData?.balance ?? 0}
                </span>
              </div>
            )}
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="font-semibold hover:bg-purple-100">{t.nav.dashboard}</Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="font-semibold hover:bg-pink-100">{t.nav.profile}</Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold shadow-md">{t.nav.signIn}</Button>
              </a>
            )}
          </div>
          {/* Mobile right side */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700">
                <Coins className="h-4 w-4" />
                <span className="text-xs font-bold">
                  {creditsData?.balance ?? 0}
                </span>
              </div>
            )}
            <LanguageSwitcher />
            {!isAuthenticated && (
              <a href={getLoginUrl()}>
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold">{t.nav.signIn}</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Bold & Vibrant */}
      <section className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8 md:space-y-10">
            {/* Animated Icon */}
            <div className="flex justify-center">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <Flame className="w-12 h-12 md:w-16 md:h-16 text-white" />
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight">
              {t.home.heroTitle}
              <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mt-2 md:mt-3">
                {t.home.heroTitleHighlight}
              </span>
            </h1>
            <p className="text-lg md:text-2xl text-gray-700 max-w-2xl mx-auto font-medium px-2">
              {t.home.heroDescription}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 md:gap-5 justify-center px-4">
              {isAuthenticated ? (
                <>
                  <Link href="/swipe">
                    <Button size="lg" className="w-full sm:w-auto text-lg md:text-xl px-8 md:px-10 py-6 md:py-7 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 font-black rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-105">
                      <Flame className="mr-2 h-6 w-6" />
                      🔥 Start Swiping
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg md:text-xl px-8 md:px-10 py-6 md:py-7 border-3 border-purple-300 hover:bg-purple-50 font-bold rounded-full shadow-lg">
                      {t.home.goToDashboard}
                      <ArrowRight className="ml-2 h-5 w-5 md:h-6 md:w-6" />
                    </Button>
                  </Link>
                </>
              ) : (
                <a href={getLoginUrl()} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full text-lg md:text-xl px-8 md:px-10 py-6 md:py-7 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 font-black rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-105">
                    {t.home.getStarted}
                    <ArrowRight className="ml-2 h-5 w-5 md:h-6 md:w-6" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Playful Cards */}
      <section className="py-16 md:py-24 lg:py-32 bg-white">
        <div className="container px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t.home.howItWorks}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-2 font-medium">
              {t.home.howItWorksDesc}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <Card className="border-3 border-purple-200 hover:border-purple-400 transition-all hover:shadow-2xl hover:-translate-y-2 bg-gradient-to-br from-white to-purple-50">
              <CardHeader className="p-6 md:p-8">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg">
                  <Users className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <CardTitle className="text-xl md:text-2xl font-bold">{t.home.createProfile}</CardTitle>
                <CardDescription className="text-base text-gray-600 font-medium">
                  {t.home.createProfileDesc}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-3 border-pink-200 hover:border-pink-400 transition-all hover:shadow-2xl hover:-translate-y-2 bg-gradient-to-br from-white to-pink-50">
              <CardHeader className="p-6 md:p-8">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg">
                  <Flame className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <CardTitle className="text-xl md:text-2xl font-bold">{t.home.smartMatching}</CardTitle>
                <CardDescription className="text-base text-gray-600 font-medium">
                  {t.home.smartMatchingDesc}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-3 border-orange-200 hover:border-orange-400 transition-all hover:shadow-2xl hover:-translate-y-2 bg-gradient-to-br from-white to-orange-50">
              <CardHeader className="p-6 md:p-8">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4 shadow-lg">
                  <Heart className="h-8 w-8 md:h-10 md:w-10 text-white fill-white" />
                </div>
                <CardTitle className="text-xl md:text-2xl font-bold">{t.home.viewMatches}</CardTitle>
                <CardDescription className="text-base text-gray-600 font-medium">
                  {t.home.viewMatchesDesc}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-3 border-purple-200 hover:border-purple-400 transition-all hover:shadow-2xl hover:-translate-y-2 bg-gradient-to-br from-white to-purple-50">
              <CardHeader className="p-6 md:p-8">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4 shadow-lg">
                  <Zap className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <CardTitle className="text-xl md:text-2xl font-bold">{t.home.applyWithAI}</CardTitle>
                <CardDescription className="text-base text-gray-600 font-medium">
                  {t.home.applyWithAIDesc}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features Section - Modern Layout */}
      <section className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
        <div className="container px-4">
          <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="space-y-6 md:space-y-8 order-2 lg:order-1">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t.home.everythingYouNeed}
              </h2>
              <p className="text-lg md:text-xl text-gray-700 font-medium">
                {t.home.everythingYouNeedDesc}
              </p>
              
              <div className="space-y-5 md:space-y-6">
                <div className="flex gap-4 md:gap-5 p-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-md">
                    <BookOpen className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1 md:mb-2 text-base md:text-lg">{t.home.resumeAnalysis}</h3>
                    <p className="text-gray-600 text-sm md:text-base font-medium">{t.home.resumeAnalysisDesc}</p>
                  </div>
                </div>
                
                <div className="flex gap-4 md:gap-5 p-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Search className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1 md:mb-2 text-base md:text-lg">{t.home.intelligentSearch}</h3>
                    <p className="text-gray-600 text-sm md:text-base font-medium">{t.home.intelligentSearchDesc}</p>
                  </div>
                </div>
                
                <div className="flex gap-4 md:gap-5 p-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Sparkles className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1 md:mb-2 text-base md:text-lg">{t.home.smartNotifications}</h3>
                    <p className="text-gray-600 text-sm md:text-base font-medium">{t.home.smartNotificationsDesc}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative order-1 lg:order-2">
              <div className="aspect-square max-w-md mx-auto rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-2xl">
                <div className="text-center space-y-4 md:space-y-6 p-8 md:p-10 text-white">
                  <Sparkles className="w-16 h-16 md:w-20 md:h-20 mx-auto" />
                  <div className="text-6xl md:text-7xl font-black">95%</div>
                  <p className="text-2xl md:text-3xl font-bold">{t.home.matchAccuracy}</p>
                  <p className="text-lg md:text-xl font-medium opacity-90">{t.home.matchAccuracyDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Bold & Action-Oriented */}
      <section className="py-16 md:py-24 lg:py-32 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6 md:space-y-8">
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-black">
              Ready to Find Your Perfect Match?
            </h2>
            <p className="text-lg md:text-2xl font-medium opacity-90">
              Join thousands of students connecting with top professors worldwide.
            </p>
            {isAuthenticated ? (
              <Link href="/swipe">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-xl md:text-2xl px-10 md:px-12 py-7 md:py-8 font-black rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-105">
                  <Flame className="mr-3 h-7 w-7" />
                  Start Swiping Now
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-xl md:text-2xl px-10 md:px-12 py-7 md:py-8 font-black rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-105">
                  Get Started Free
                  <ArrowRight className="ml-3 h-7 w-7" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 bg-white border-t border-purple-200">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Find My Professor
              </span>
            </div>
            <p className="text-sm text-gray-600 font-medium">
              © 2026 Find My Professor. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
