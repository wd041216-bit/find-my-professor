import { useState } from 'react';
import { ProfessorCard, Professor } from '../components/ProfessorCard';
import { X, Heart, RotateCcw, Sparkles, ArrowLeft, Flame } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link } from 'wouter';

// Mock data for testing (email removed for privacy)
const mockProfessors: Professor[] = [
  {
    id: 1,
    name: "Dr. Tanu Mitra",
    universityName: "University of Washington",
    majorName: "Information School",
    title: "Associate Professor",
    department: "Information School",
    personalWebsite: "https://faculty.washington.edu/tanumitra/",
    bio: "I study how AI impacts social media and online communities. My research focuses on understanding algorithmic bias, misinformation, and the role of AI in shaping online discourse.",
    tags: ["machine learning", "natural language processing", "online communities", "algorithmic bias"],
    displayScore: 88,
    matchLevel: "excellent",
  },
  {
    id: 2,
    name: "Dr. Joseph Williams",
    universityName: "University of Washington",
    majorName: "Information School",
    title: "Associate Professor",
    department: "Information School",
    bio: "My research explores human-AI collaboration, focusing on how people can work effectively with AI systems. I'm interested in crowdsourcing, machine learning, and educational technology.",
    tags: ["artificial intelligence", "machine learning", "crowdsourcing", "human-AI collaboration"],
    displayScore: 88,
    matchLevel: "excellent",
  },
  {
    id: 3,
    name: "Dr. Lingzi Hong",
    universityName: "University of Washington",
    majorName: "Information School",
    title: "Assistant Professor",
    department: "Information School",
    bio: "I work on information retrieval, health informatics, and data science. My research aims to develop intelligent systems that can help people find and make sense of health information.",
    tags: ["machine learning", "natural language processing", "data science", "health informatics"],
    displayScore: 78,
    matchLevel: "good",
  },
  {
    id: 4,
    name: "Dr. Emma Spiro",
    universityName: "University of Washington",
    majorName: "Information School",
    title: "Associate Professor",
    department: "Information School",
    bio: "My research examines online communities and social networks, with a focus on understanding how people coordinate and collaborate in digital spaces.",
    tags: ["online communities", "social networks", "computational social science"],
    displayScore: 71,
    matchLevel: "fair",
  },
  {
    id: 5,
    name: "Dr. David Hendry",
    universityName: "University of Washington",
    majorName: "Information School",
    title: "Professor",
    department: "Information School",
    bio: "I research human-computer interaction and user interface design, focusing on how people interact with complex information systems.",
    tags: ["human-computer interaction", "user interface design", "information architecture"],
    displayScore: 62,
    matchLevel: "fair",
  },
];

export function Swipe() {
  const [professors, setProfessors] = useState<Professor[]>(mockProfessors);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedProfessors, setLikedProfessors] = useState<Professor[]>([]);
  const [lastAction, setLastAction] = useState<'like' | 'pass' | null>(null);

  const currentProfessor = professors[currentIndex];

  const handleSwipe = (direction: 'left' | 'right', professor: Professor) => {
    if (direction === 'right') {
      setLikedProfessors([...likedProfessors, professor]);
      setLastAction('like');
    } else {
      setLastAction('pass');
    }

    // Move to next professor after a short delay
    setTimeout(() => {
      setCurrentIndex(currentIndex + 1);
      setLastAction(null);
    }, 300);
  };

  const handleButtonClick = (action: 'pass' | 'like') => {
    if (!currentProfessor) return;

    if (action === 'like') {
      setLikedProfessors([...likedProfessors, currentProfessor]);
      setLastAction('like');
    } else {
      setLastAction('pass');
    }

    setTimeout(() => {
      setCurrentIndex(currentIndex + 1);
      setLastAction(null);
    }, 300);
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      // Remove from liked if it was the last action
      if (lastAction === 'like') {
        setLikedProfessors(likedProfessors.slice(0, -1));
      }
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
            Check out your matches! 💫
          </p>
          <Button
            size="lg"
            onClick={() => {
              window.location.href = '/matches';
            }}
            className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white font-bold text-lg px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all"
          >
            <Heart className="w-6 h-6 mr-2 fill-white" />
            View My Matches ({likedProfessors.length})
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 flex flex-col">
      {/* Header with Back Button */}
      <div className="p-6 flex items-center justify-between bg-white/80 backdrop-blur-sm shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-purple-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Flame className="w-7 h-7 text-orange-500" />
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Find My Professor
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-gray-700 bg-white px-4 py-2 rounded-full shadow-sm">
            {currentIndex + 1} / {professors.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/matches'}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:from-purple-700 hover:to-pink-700 font-semibold shadow-md"
          >
            <Heart className="w-4 h-4 mr-2 fill-white" />
            My Matches ({likedProfessors.length})
          </Button>
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
