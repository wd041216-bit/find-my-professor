import { useState } from 'react';
import { ProfessorCard, Professor } from '../components/ProfessorCard';
import { X, Heart, RotateCcw, Sparkles, ArrowLeft, Flame, User, UserCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';

// Removed mock data - using real professors from database

export function Swipe() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  });

  // Check if profile is complete
  const isProfileComplete = profile && profile.targetUniversities && profile.targetMajors;

  // Fetch professors from API
  const { data: professorsData, isLoading: professorsLoading } = trpc.swipe.getProfessorsToSwipe.useQuery(
    { limit: 10 },
    { enabled: !!user && !!isProfileComplete }
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastAction, setLastAction] = useState<'like' | 'pass' | null>(null);

  const professors = professorsData?.professors || [];

  // Swipe mutation
  const swipeMutation = trpc.swipe.swipe.useMutation();

  const currentProfessor = professors[currentIndex];

  // Loading state
  if (authLoading || profileLoading || (isProfileComplete && professorsLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  // Profile incomplete - show guidance
  if (!isProfileComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
              <User className="w-16 h-16 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-4">
            Complete Your Profile First!
          </h2>
          <p className="text-xl text-gray-700 mb-8 font-medium">
            To get the best professor matches, please tell us about your academic background and research interests.
          </p>
          <Link href="/profile">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white font-bold text-lg px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all"
            >
              <User className="w-6 h-6 mr-2" />
              Complete Profile
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSwipe = (direction: 'left' | 'right', professor: Professor) => {
    const action = direction === 'right' ? 'like' : 'pass';
    setLastAction(action);

    // Save swipe to database
    swipeMutation.mutate({
      professorId: professor.id,
      action,
      matchScore: professor.matchScore,
    });

    // Move to next professor after a short delay
    setTimeout(() => {
      setCurrentIndex(currentIndex + 1);
      setLastAction(null);
    }, 300);
  };

  const handleButtonClick = (action: 'pass' | 'like') => {
    if (!currentProfessor) return;

    setLastAction(action);

    // Save swipe to database
    swipeMutation.mutate({
      professorId: currentProfessor.id,
      action,
      matchScore: currentProfessor.matchScore,
    });

    setTimeout(() => {
      setCurrentIndex(currentIndex + 1);
      setLastAction(null);
    }, 300);
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setLastAction(null);
    }
  };

  if (currentIndex >= professors.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
              <Sparkles className="w-16 h-16 text-white" />
            </div>
          </div>
          <h2 className="text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-4">
            That's all for now!
          </h2>
          <p className="text-xl text-gray-700 mb-8 font-medium">
            You've reviewed all available professors.
            <br />
            Come back later for more! 💫
          </p>
          <Link href="/">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white font-bold text-lg px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all"
            >
              <ArrowLeft className="w-6 h-6 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 flex flex-col">
      {/* Header with Back Button */}
      <div className="p-4 md:p-6 flex items-center justify-between bg-white/80 backdrop-blur-sm shadow-md">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-purple-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Back</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 md:w-7 md:h-7 text-orange-500" />
            <h1 className="hidden md:block text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Find My Professor
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-xs md:text-sm font-semibold text-gray-700 bg-white px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-sm">
            {currentIndex + 1} / {professors.length}
          </span>
          <Link href="/profile">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-pink-100 transition-colors"
            >
              <UserCircle className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Profile</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Card Stack Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md" style={{ height: '620px' }}>
          {/* Render next 2 cards in background for stack effect */}
          {professors.slice(currentIndex + 1, currentIndex + 3).map((prof, index) => (
            <div
              key={prof.id}
              className="absolute w-full h-full"
              style={{
                transform: `scale(${1 - (index + 1) * 0.04}) translateY(${(index + 1) * -8}px)`,
                zIndex: -index - 1,
                opacity: 1 - (index + 1) * 0.25,
              }}
            >
              <div className="w-full h-full bg-gradient-to-br from-white to-gray-100 rounded-3xl shadow-xl border border-gray-200" />
            </div>
          ))}

          {/* Current Card */}
          {currentProfessor && (
            <ProfessorCard
              key={currentProfessor.id}
              professor={currentProfessor}
              onSwipe={handleSwipe}
              style={{ zIndex: 1 }}
            />
          )}
        </div>
      </div>

      {/* Action Buttons - Tinder style */}
      <div className="p-8 flex items-center justify-center gap-8">
        <Button
          size="lg"
          variant="outline"
          className="w-20 h-20 rounded-full bg-white border-4 border-red-400 hover:bg-red-50 hover:border-red-500 hover:scale-110 transition-all shadow-xl hover:shadow-2xl"
          onClick={() => handleButtonClick('pass')}
          disabled={!currentProfessor}
        >
          <X className="w-10 h-10 text-red-500" strokeWidth={3} />
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="w-16 h-16 rounded-full bg-white border-3 border-gray-300 hover:bg-gray-50 hover:scale-110 transition-all shadow-lg hover:shadow-xl"
          onClick={handleUndo}
          disabled={currentIndex === 0}
        >
          <RotateCcw className="w-7 h-7 text-gray-600" strokeWidth={2.5} />
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="w-20 h-20 rounded-full bg-white border-4 border-green-400 hover:bg-green-50 hover:border-green-500 hover:scale-110 transition-all shadow-xl hover:shadow-2xl"
          onClick={() => handleButtonClick('like')}
          disabled={!currentProfessor}
        >
          <Heart className="w-10 h-10 text-green-500 fill-green-500" strokeWidth={0} />
        </Button>
      </div>
    </div>
  );
}
