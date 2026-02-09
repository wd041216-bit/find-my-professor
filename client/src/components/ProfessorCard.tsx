import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { User, Mail, ExternalLink, Sparkles } from 'lucide-react';
import { useState } from 'react';

export interface Professor {
  id: number;
  name: string;
  universityName: string;
  majorName: string;
  title?: string;
  department?: string;
  email?: string;
  personalWebsite?: string;
  researchAreas?: string[];
  tags?: string[];
  bio?: string;
  matchScore?: number;
  displayScore?: number;
  matchLevel?: string;
}

interface ProfessorCardProps {
  professor: Professor;
  onSwipe: (direction: 'left' | 'right', professor: Professor) => void;
  style?: React.CSSProperties;
}

export function ProfessorCard({ professor, onSwipe, style }: ProfessorCardProps) {
  const x = useMotionValue(0);
  const [exitX, setExitX] = useState(0);
  
  // Calculate rotation based on drag distance
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  
  // Calculate opacity for like/nope indicators
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 150;
    
    if (Math.abs(info.offset.x) > threshold) {
      // Swipe detected
      const direction = info.offset.x > 0 ? 'right' : 'left';
      setExitX(info.offset.x > 0 ? 1000 : -1000);
      onSwipe(direction, professor);
    } else {
      // Return to center
      setExitX(0);
    }
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        ...style,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
    >
      <div className="relative w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Like/Nope Indicators */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-8 right-8 z-10 px-6 py-3 bg-green-500 text-white font-bold text-2xl rounded-lg rotate-12 border-4 border-green-600"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-8 left-8 z-10 px-6 py-3 bg-red-500 text-white font-bold text-2xl rounded-lg -rotate-12 border-4 border-red-600"
        >
          NOPE
        </motion.div>

        {/* Card Content */}
        <div className="flex flex-col h-full p-8 overflow-y-auto">
          {/* Header */}
          <div className="flex items-start gap-6 mb-6">
            {/* Avatar Placeholder */}
            <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {professor.name.charAt(0)}
            </div>

            {/* Name and Title */}
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-bold text-gray-900 mb-1">{professor.name}</h2>
              {professor.title && (
                <p className="text-lg text-gray-600 mb-2">{professor.title}</p>
              )}
              <p className="text-base text-gray-500">{professor.department || professor.majorName}</p>
              <p className="text-base text-gray-500">{professor.universityName}</p>
            </div>
          </div>

          {/* Match Score Badge */}
          {professor.displayScore !== undefined && (
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-bold text-lg">
                <Sparkles className="w-5 h-5" />
                {professor.displayScore}% Match
              </div>
            </div>
          )}

          {/* Research Tags */}
          {professor.tags && professor.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Research Interests</h3>
              <div className="flex flex-wrap gap-2">
                {professor.tags.slice(0, 6).map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {professor.bio && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">About</h3>
              <p className="text-gray-600 leading-relaxed">{professor.bio}</p>
            </div>
          )}

          {/* Contact Info */}
          <div className="mt-auto pt-6 border-t border-gray-200 space-y-3">
            {professor.email && (
              <a
                href={`mailto:${professor.email}`}
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail className="w-5 h-5" />
                <span className="text-sm">{professor.email}</span>
              </a>
            )}
            {professor.personalWebsite && (
              <a
                href={professor.personalWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-5 h-5" />
                <span className="text-sm">Personal Website</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
