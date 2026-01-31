import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Search, BookOpen, FileText, Bell, ArrowRight, GraduationCap, Users, Target } from "lucide-react";
import { ContactDialog } from "@/components/ContactDialog";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

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
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">Find My Professor</span>
          </div>
          <div className="flex items-center gap-4">
            <ContactDialog />
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost">Profile</Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button>Sign In</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-balance">
              Find Your Perfect
              <span className="block text-primary mt-2">Research Opportunity</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Connect with leading professors and research labs. Match your skills and interests with cutting-edge research projects at top universities worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="text-lg px-8">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="lg" className="text-lg px-8">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              )}
              <Link href="/explore">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Explore Projects
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-card/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Four simple steps to find and apply to your ideal research position
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Create Your Profile</CardTitle>
                <CardDescription>
                  Build your academic profile with your experiences, skills, and research interests
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Smart Matching</CardTitle>
                <CardDescription>
                  Our algorithm finds research projects that align with your background and goals
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>View Matches</CardTitle>
                <CardDescription>
                  See detailed project information, professor profiles, and match scores
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Apply with AI</CardTitle>
                <CardDescription>
                  Generate personalized application letters tailored to each research opportunity
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 lg:py-32">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-5xl font-bold">
                Everything You Need to Succeed
              </h2>
              <p className="text-lg text-muted-foreground">
                Our platform provides comprehensive tools to help you find, apply to, and secure research positions at top universities.
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Resume Analysis</h3>
                    <p className="text-muted-foreground">Upload your resume and let AI extract and organize your experiences automatically</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Intelligent Search</h3>
                    <p className="text-muted-foreground">Filter by university, major, research area, and more to find perfect matches</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Smart Notifications</h3>
                    <p className="text-muted-foreground">Get alerted when new high-match opportunities become available</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <div className="text-6xl font-bold text-primary">95%</div>
                  <p className="text-xl font-semibold">Match Accuracy</p>
                  <p className="text-muted-foreground">Based on student feedback and successful placements</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-primary text-primary-foreground">
        <div className="container text-center space-y-8">
          <h2 className="text-3xl lg:text-5xl font-bold">
            Ready to Start Your Research Journey?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Join thousands of students who have found their perfect research opportunities
          </p>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Sign Up Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card/30">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-semibold">Find My Professor</span>
            </div>
            <div className="flex items-center gap-6">
              <ContactDialog trigger={
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact Us
                </button>
              } />
              <Link href="/explore">
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Explore Projects
                </span>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Find My Professor. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
