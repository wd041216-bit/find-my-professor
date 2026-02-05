import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Activities from "./pages/Activities";
import UploadResume from "./pages/UploadResume";
import Explore from "./pages/Explore";
import History from "./pages/History";
import CoverLetters from "./pages/CoverLetters";
import ProjectDetail from "./pages/ProjectDetail";
import Notifications from "./pages/Notifications";
import AdminMessages from "./pages/AdminMessages";
// Credits page removed - payment feature not yet launched
import Skills from "./pages/Skills";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/activities"} component={Activities} />
      <Route path={"/upload-resume"} component={UploadResume} />
      <Route path={"/explore"} component={Explore} />
      <Route path={"/history"} component={History} />
      <Route path={"/cover-letters"} component={CoverLetters} />
      <Route path={"/project/:id"} component={ProjectDetail} />
      <Route path={"/notifications"} component={Notifications} />
      <Route path={"/admin/messages"} component={AdminMessages} />
      {/* Credits page removed - payment feature not yet launched */}
      <Route path={"/skills"} component={Skills} />
      <Route path={"/terms"} component={TermsOfService} />
      <Route path={"/privacy"} component={PrivacyPolicy} />
      <Route path={"/refund"} component={RefundPolicy} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
