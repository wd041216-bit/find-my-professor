import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { TimezoneSync } from "./components/TimezoneSync";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { HelmetProvider } from "react-helmet-async";
import { StructuredData } from "./components/StructuredData";
import { BottomNav } from "./components/BottomNav";
import { Footer } from "./components/Footer";
import Profile from "./pages/Profile";
import History from "./pages/History";
import CoverLetters from "./pages/CoverLetters";
import { Swipe } from "./pages/Swipe";
import { Privacy } from "./pages/Privacy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ProfessorPolicy from "./pages/ProfessorPolicy";
import PrivacyPolicyZh from "./pages/PrivacyPolicyZh";
import TermsOfServiceZh from "./pages/TermsOfServiceZh";
import ProfessorPolicyZh from "./pages/ProfessorPolicyZh";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Swipe} />
      <Route path={"/swipe"} component={Swipe} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/history"} component={History} />
      <Route path={"/cover-letters"} component={CoverLetters} />
      <Route path={"/privacy"} component={Privacy} />
      <Route path={"/privacy-policy"} component={PrivacyPolicy} />
      <Route path={"/privacy-policy-zh"} component={PrivacyPolicyZh} />
      <Route path={"/terms-of-service"} component={TermsOfService} />
      <Route path={"/terms-of-service-zh"} component={TermsOfServiceZh} />
      <Route path={"/professor-policy"} component={ProfessorPolicy} />
      <Route path={"/professor-policy-zh"} component={ProfessorPolicyZh} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider defaultTheme="light">
          <LanguageProvider>
            <TooltipProvider>
              <StructuredData />
              <TimezoneSync />
              <div className="flex flex-col min-h-screen">
                <div className="flex-1">
                  <Router />
                </div>
                <Footer />
              </div>
              <BottomNav />
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
