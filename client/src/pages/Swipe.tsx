import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProfessorCard, Professor } from '../components/ProfessorCard';
import { ProfessorCardSkeleton } from '../components/ProfessorCardSkeleton';
import { X, Heart, RotateCcw, Sparkles, User, MessageCircle, Globe, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { FilterPanel } from '../components/FilterPanel';

// Animation variants for card transitions
const ANIMATION_VARIANTS = [
  'fly-left',
  'fly-right',
  'rotate-fade',
  'scale-fade',
  'flip-out',
  'explode',
] as const;

type AnimationVariant = typeof ANIMATION_VARIANTS[number];

interface CardAnimation {
  variant: AnimationVariant;
  direction: 'left' | 'right';
}

export function Swipe() {
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  });

  // Check if profile is complete (only need target university)
  const isProfileComplete = useMemo(() => {
    if (!profile || !profile.targetUniversities) return false;
    try {
      const universities = typeof profile.targetUniversities === 'string' 
        ? JSON.parse(profile.targetUniversities)
        : profile.targetUniversities;
      return Array.isArray(universities) && universities.length > 0;
    } catch {
      return false;
    }
  }, [profile]);

  // Filter state
  const [filters, setFilters] = useState<{ university?: string; researchField?: string }>({});
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Infinite scroll state
  const [allProfessors, setAllProfessors] = useState<Professor[]>([]);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Reset state when component mounts
  useEffect(() => {
    setAllProfessors([]);
    setCurrentBatch(0);
    setCurrentIndex(0);
    setIsLoadingMore(false);
  }, []); // Empty dependency array = only run on mount

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: { university?: string; researchField?: string }) => {
    console.log('[Swipe] handleFilterChange received:', newFilters);
    // Convert "__all__" to undefined
    const processedFilters = {
      university: newFilters.university === '__all__' ? undefined : newFilters.university,
      researchField: newFilters.researchField === '__all__' ? undefined : newFilters.researchField,
    };
    console.log('[Swipe] processedFilters:', processedFilters);
    
    setFilters(processedFilters);
    
    // Reset state when filters change
    setAllProfessors([]);
    setCurrentBatch(0);
    setCurrentIndex(0);
    setIsLoadingMore(false);
  }, []);

  // Fetch professors from API - infinite batches with filters
  const { data: professorsData, isLoading: professorsLoading } = trpc.swipe.getProfessorsToSwipe.useQuery(
    { 
      limit: 20, 
      offset: currentBatch * 20,
      university: filters.university,
      researchField: filters.researchField,
    },
    { enabled: !!user && !!isProfileComplete }
  );

  // Append new professors to the list
  useEffect(() => {
    if (professorsData?.professors) {
      // Map research_field to researchField for frontend compatibility
      const mappedProfessors = professorsData.professors.map((prof: any) => ({
        ...prof,
        researchField: prof.research_field, // Map research_field to researchField
      }));
      
      setAllProfessors(prev => {
        // Avoid duplicates
        const newProfs = mappedProfessors.filter(
          p => !prev.some(existing => existing.id === p.id)
        );
        return [...prev, ...newProfs];
      });
      setIsLoadingMore(false);
    }
  }, [professorsData]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastAction, setLastAction] = useState<'like' | 'pass' | null>(null);
  const [cardAnimation, setCardAnimation] = useState<CardAnimation | null>(null);

  const professors = allProfessors;

  // Swipe mutation with optimistic update for Match History
  const swipeMutation = trpc.swipe.swipe.useMutation({
    onSuccess: () => {
      // Immediately invalidate Match History to refresh the list
      utils.swipe.getLikedProfessors.invalidate();
    },
  });

  const currentProfessor = professors[currentIndex];

  // Count active filters
  const activeFilterCount = [filters.university, filters.researchField].filter(Boolean).length;

  // Auto-load more professors when approaching the end
  useEffect(() => {
    // Only trigger auto-load if we have professors and approaching the end
    // Changed from -5 to -3 to reduce unnecessary preloading
    if (professors.length > 0 && currentIndex >= professors.length - 3 && !isLoadingMore && !professorsLoading && professorsData?.hasMore) {
      setIsLoadingMore(true);
      setCurrentBatch(prev => prev + 1);
    }
  }, [currentIndex, professors.length, isLoadingMore, professorsLoading, professorsData?.hasMore]);

  // Loading state - show skeleton
  if (authLoading || profileLoading || (isProfileComplete && professorsLoading && professors.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">🔥</span>
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">Find My Professor</span>
            </a>
          </div>
        </header>
        
        {/* Skeleton content */}
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
          <ProfessorCardSkeleton />
        </div>
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
          <Button
            size="lg"
            onClick={() => setLocation('/profile')}
            className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white font-bold text-lg px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all"
          >
            <User className="w-6 h-6 mr-2" />
            Complete Profile
          </Button>
        </div>
      </div>
    );
  }

  const getRandomAnimation = (direction: 'left' | 'right'): AnimationVariant => {
    return ANIMATION_VARIANTS[Math.floor(Math.random() * ANIMATION_VARIANTS.length)];
  };

  const handleSwipe = (direction: 'left' | 'right', professor: Professor) => {
    const action = direction === 'right' ? 'like' : 'pass';
    setLastAction(action);

    // Set random animation
    setCardAnimation({
      variant: getRandomAnimation(direction),
      direction,
    });

    // Save swipe to database
    swipeMutation.mutate({
      professorId: professor.id,
      liked: action === 'like',
    });

    // Move to next professor after animation completes
    setTimeout(() => {
      setCurrentIndex(currentIndex + 1);
      setLastAction(null);
      setCardAnimation(null);
    }, 1000); // Increased from 600ms to 1000ms for more visible animation
  };

  const handleButtonClick = (action: 'pass' | 'like') => {
    if (!currentProfessor) return;

    const direction: 'left' | 'right' = action === 'like' ? 'right' : 'left';
    setLastAction(action);

    // Set random animation
    setCardAnimation({
      variant: getRandomAnimation(direction),
      direction,
    });

    // Save swipe to database
    swipeMutation.mutate({
      professorId: currentProfessor.id,
      liked: action === 'like',
    });

    // Move to next professor after animation completes
    setTimeout(() => {
      setCurrentIndex(currentIndex + 1);
      setLastAction(null);
      setCardAnimation(null);
    }, 1000); // Increased from 600ms to 1000ms for more visible animation
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setLastAction(null);
      setCardAnimation(null);
    }
  };

  // Get animation CSS class
  const getAnimationClass = (anim: CardAnimation | null): string => {
    if (!anim) return '';
    
    const baseClass = 'animate-card-exit';
    const variantClass = `animate-${anim.variant}`;
    const directionClass = anim.direction === 'left' ? 'exit-left' : 'exit-right';
    
    return `${baseClass} ${variantClass} ${directionClass}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 flex flex-col pb-16 md:pb-0">
      {/* Filter Button - Floating on mobile, top-right on desktop */}
      <div className="absolute top-4 right-4 z-50">
        <Button 
          variant="default"
          size="sm" 
          onClick={() => setIsFilterPanelOpen(true)}
          className="relative bg-white/90 hover:bg-white text-gray-700 shadow-lg"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filter
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Card Stack Container */}
      <div className="flex-1 flex items-center justify-center p-2 md:p-6">
        <div 
          id="card-stack-container"
          className="relative w-full max-w-sm md:max-w-md" 
          style={{ 
            height: 'min(480px, 60vh)' // Mobile: smaller height for one-screen display
          }}
        >
          {/* Desktop/Tablet: use larger height via media query */}
          <style>{`
            @media (min-width: 768px) {
              #card-stack-container {
                height: min(580px, 75vh) !important;
              }
            }
          `}</style>
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
              isMinimalProfile={professorsData?.isMinimalProfile}
              animation={cardAnimation}
            />
          )}

          {/* Loading indicator when no more cards */}
          {!currentProfessor && isLoadingMore && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading more professors...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Tinder style with enhanced feedback */}
      <div className="p-4 md:p-8 flex items-center justify-center gap-4 md:gap-8">
        <Button
          size="lg"
          variant="outline"
          className={`w-20 h-20 rounded-full bg-white border-4 border-red-400 hover:bg-red-50 hover:border-red-500 transition-all shadow-xl hover:shadow-2xl ${
            lastAction === 'pass' ? 'scale-90 animate-bounce-once' : 'hover:scale-110'
          }`}
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
          className={`w-20 h-20 rounded-full bg-white border-4 border-green-400 hover:bg-green-50 hover:border-green-500 transition-all shadow-xl hover:shadow-2xl ${
            lastAction === 'like' ? 'scale-90 animate-bounce-once' : 'hover:scale-110'
          }`}
          onClick={() => handleButtonClick('like')}
          disabled={!currentProfessor}
        >
          <Heart className="w-10 h-10 text-green-500 fill-green-500" strokeWidth={0} />
        </Button>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fly-left {
          0% {
            transform: translateX(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateX(-200%) rotate(-45deg) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes fly-right {
          0% {
            transform: translateX(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateX(200%) rotate(45deg) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes rotate-fade {
          0% {
            transform: rotate(0deg) scale(1);
            opacity: 1;
          }
          50% {
            transform: rotate(180deg) scale(1.1);
            opacity: 0.5;
          }
          100% {
            transform: rotate(540deg) scale(0);
            opacity: 0;
          }
        }

        @keyframes scale-fade {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.7;
          }
          100% {
            transform: scale(0);
            opacity: 0;
          }
        }

        @keyframes flip-out {
          0% {
            transform: rotateY(0deg) scale(1);
            opacity: 1;
          }
          50% {
            transform: rotateY(90deg) scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: rotateY(180deg) scale(0.3);
            opacity: 0;
          }
        }

        @keyframes explode {
          0% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
            filter: blur(0px);
          }
          30% {
            transform: scale(1.3) rotate(10deg);
            opacity: 0.9;
            filter: blur(0px);
          }
          70% {
            transform: scale(1.5) rotate(-10deg);
            opacity: 0.5;
            filter: blur(2px);
          }
          100% {
            transform: scale(0) rotate(360deg);
            opacity: 0;
            filter: blur(5px);
          }
        }

        @keyframes bounce-once {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(0.9);
          }
        }

        .animate-card-exit {
          animation-duration: 1s;
          animation-fill-mode: forwards;
          animation-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-fly-left.exit-left {
          animation-name: fly-left;
        }

        .animate-fly-right.exit-right {
          animation-name: fly-right;
        }

        .animate-rotate-fade {
          animation-name: rotate-fade;
        }

        .animate-scale-fade {
          animation-name: scale-fade;
        }

        .animate-flip-out {
          animation-name: flip-out;
        }

        .animate-explode {
          animation-name: explode;
        }

        .animate-bounce-once {
          animation: bounce-once 0.3s ease-in-out;
        }
      `}</style>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        onFilterChange={handleFilterChange}
        isProfileComplete={isProfileComplete}
        currentFilters={filters}
      />
    </div>
  );
}
