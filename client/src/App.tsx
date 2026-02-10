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
import Profile from "./pages/Profile";
import History from "./pages/History";
import { Swipe } from "./pages/Swipe";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Swipe} />
      <Route path={"/swipe"} component={Swipe} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/history"} component={History} />
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
              <Router />
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
