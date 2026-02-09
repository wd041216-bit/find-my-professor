import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Sparkles } from 'lucide-react';
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
  
  // Tinder-like rotation (more subtle)
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  
  // Smooth opacity transitions for indicators
  const likeOpacity = useTransform(x, [10, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, -10], [1, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Lower threshold for easier swiping (like Tinder)
    const threshold = 100;
    const velocity = Math.abs(info.velocity.x);
    
    // Consider both distance and velocity (Tinder-like behavior)
    if (Math.abs(info.offset.x) > threshold || velocity > 500) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      setExitX(info.offset.x > 0 ? 1000 : -1000);
      onSwipe(direction, professor);
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
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX }}
      transition={{ 
        type: 'spring', 
        stiffness: 200, 
        damping: 20,
        mass: 0.8
      }}
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
    >
      <div className="relative w-full h-full bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Like/Nope Indicators - Tinder style */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-12 right-12 z-10 px-8 py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-black text-3xl rounded-2xl rotate-12 shadow-lg"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-12 left-12 z-10 px-8 py-4 bg-gradient-to-r from-red-400 to-pink-500 text-white font-black text-3xl rounded-2xl -rotate-12 shadow-lg"
        >
          NOPE
        </motion.div>

        {/* Card Content - Simplified */}
        <div className="flex flex-col h-full p-8 overflow-y-auto">
          {/* Header with Avatar */}
          <div className="flex items-start gap-6 mb-6">
            {/* Avatar with gradient */}
            <div className="flex-shrink-0 w-28 h-28 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {professor.name.charAt(0)}
            </div>

            {/* Name and Title */}
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {professor.name}
              </h2>
              {professor.title && (
                <p className="text-lg font-semibold text-gray-700 mb-1">{professor.title}</p>
              )}
              <p className="text-base text-gray-600">{professor.department || professor.majorName}</p>
              <p className="text-base text-gray-500">{professor.universityName}</p>
            </div>
          </div>

          {/* Match Score Badge - More prominent */}
          {professor.displayScore !== undefined && (
            <div className="mb-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 text-white rounded-full font-bold text-xl shadow-lg">
                <Sparkles className="w-6 h-6" />
                {professor.displayScore}% Match
              </div>
            </div>
          )}

          {/* Research Interests Tags - More colorful */}
          {professor.tags && professor.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Research Interests</h3>
              <div className="flex flex-wrap gap-2">
                {professor.tags.slice(0, 8).map((tag, index) => {
                  const colors = [
                    'bg-gradient-to-r from-blue-400 to-blue-600',
                    'bg-gradient-to-r from-purple-400 to-purple-600',
                    'bg-gradient-to-r from-pink-400 to-pink-600',
                    'bg-gradient-to-r from-orange-400 to-orange-600',
                    'bg-gradient-to-r from-teal-400 to-teal-600',
                    'bg-gradient-to-r from-indigo-400 to-indigo-600',
                  ];
                  const colorClass = colors[index % colors.length];
                  
                  return (
                    <span
                      key={index}
                      className={`px-4 py-2 ${colorClass} text-white rounded-full text-sm font-semibold shadow-md`}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
