import { useState } from 'react';
import { ProfessorCard, Professor } from '../components/ProfessorCard';
import { X, Heart, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';

// Mock data for testing
const mockProfessors: Professor[] = [
  {
    id: 1,
    name: "Dr. Tanu Mitra",
    universityName: "University of Washington",
    majorName: "Information School",
    title: "Associate Professor",
    department: "Information School",
    email: "tanumitra@uw.edu",
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
    email: "josephw@uw.edu",
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
    email: "lingzi@uw.edu",
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
    email: "espiro@uw.edu",
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
    email: "dhendry@uw.edu",
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-8">
            <Sparkles className="w-24 h-24 mx-auto text-purple-500" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            That's all for now!
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            You've reviewed all available professors.
            <br />
            Check out your matches!
          </p>
          <Button
            size="lg"
            onClick={() => {
              // Navigate to matches page
              window.location.href = '/matches';
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            View My Matches ({likedProfessors.length})
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Find My Professor</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {currentIndex + 1} / {professors.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/matches'}
          >
            My Matches ({likedProfessors.length})
          </Button>
        </div>
      </div>

      {/* Card Stack Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md" style={{ height: '600px' }}>
          {/* Render next 2 cards in background for stack effect */}
          {professors.slice(currentIndex + 1, currentIndex + 3).map((prof, index) => (
            <div
              key={prof.id}
              className="absolute w-full h-full"
              style={{
                transform: `scale(${1 - (index + 1) * 0.05}) translateY(${(index + 1) * -10}px)`,
                zIndex: -index - 1,
                opacity: 1 - (index + 1) * 0.3,
              }}
            >
              <div className="w-full h-full bg-white rounded-2xl shadow-xl" />
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

      {/* Action Buttons */}
      <div className="p-8 flex items-center justify-center gap-6">
        <Button
          size="lg"
          variant="outline"
          className="w-16 h-16 rounded-full border-2 border-red-500 hover:bg-red-50 hover:border-red-600"
          onClick={() => handleButtonClick('pass')}
          disabled={!currentProfessor}
        >
          <X className="w-8 h-8 text-red-500" />
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="w-14 h-14 rounded-full border-2 border-gray-300 hover:bg-gray-50"
          onClick={handleUndo}
          disabled={currentIndex === 0}
        >
          <RotateCcw className="w-6 h-6 text-gray-600" />
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="w-16 h-16 rounded-full border-2 border-green-500 hover:bg-green-50 hover:border-green-600"
          onClick={() => handleButtonClick('like')}
          disabled={!currentProfessor}
        >
          <Heart className="w-8 h-8 text-green-500 fill-green-500" />
        </Button>
      </div>
    </div>
  );
}
