import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Sparkles, Info } from 'lucide-react';
import { useState } from 'react';

export interface Professor {
  id: number;
  name: string;
  universityName: string;
  department: string;
  title?: string | null;
  researchAreas?: string[] | null;
  tags?: string[] | null;
  matchScore?: number;
  displayScore?: number;
  matchLevel?: string;
  schoolImageUrl?: string;
}

type AnimationVariant = 'fly-left' | 'fly-right' | 'rotate-fade' | 'scale-fade' | 'flip-out' | 'explode';

interface CardAnimation {
  variant: AnimationVariant;
  direction: 'left' | 'right';
}

interface ProfessorCardProps {
  professor: Professor;
  onSwipe: (direction: 'left' | 'right', professor: Professor) => void;
  style?: React.CSSProperties;
  isMinimalProfile?: boolean; // Whether user has minimal profile
  animation?: CardAnimation | null; // Animation to play
}

export function ProfessorCard({ professor, onSwipe, style, isMinimalProfile = false, animation = null }: ProfessorCardProps) {
  const x = useMotionValue(0);
  const [exitX, setExitX] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  
  // Get animation config based on variant
  const getAnimationConfig = (anim: CardAnimation | null) => {
    if (!anim) return {};
    
    const animations = {
      'fly-left': { x: -1500, rotate: -60, scale: 0.5, opacity: 0 },
      'fly-right': { x: 1500, rotate: 60, scale: 0.5, opacity: 0 },
      'rotate-fade': { rotate: 720, scale: 0, opacity: 0 },
      'scale-fade': { scale: 0, opacity: 0 },
      'flip-out': { rotateY: 180, scale: 0.1, opacity: 0 },
      'explode': { scale: 0, rotate: 540, opacity: 0 },
    };
    
    return animations[anim.variant] || {};
  };
  
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
        // Only apply drag styles when no animation is playing
        ...(animation ? {} : { x, rotate }),
        ...style,
      }}
      drag={animation ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      animate={animation ? getAnimationConfig(animation) : { x: exitX }}
      transition={animation ? {
        duration: 0.6,
        ease: 'easeInOut'
      } : { 
        type: 'spring', 
        stiffness: 200, 
        damping: 20,
        mass: 0.8
      }}
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
    >
      <div className="relative w-full h-full rounded-3xl shadow-2xl overflow-hidden">
        {/* Like/Nope Indicators - Tinder style */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-12 right-12 z-10 px-8 py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-black text-3xl rounded-2xl rotate-12 shadow-lg border-4 border-white"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-12 left-12 z-10 px-8 py-4 bg-gradient-to-r from-red-400 to-pink-500 text-white font-black text-3xl rounded-2xl -rotate-12 shadow-lg border-4 border-white"
        >
          NOPE
        </motion.div>

        {/* School Image Background - Fills entire card like Tinder */}
        <div className="absolute inset-0">
          {professor.schoolImageUrl ? (
            <img 
              src={professor.schoolImageUrl} 
              alt={professor.department}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400" />
          )}
          
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>

        {/* Info Toggle Button - Top Right */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="absolute top-6 right-6 z-20 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all"
        >
          <Info className="w-6 h-6 text-purple-600" />
        </button>

        {/* Bottom Info Overlay - Tinder style */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          {/* Name and Basic Info */}
          <div className="mb-4">
            <h2 className="text-4xl font-black text-white mb-2 drop-shadow-lg">
              {professor.name}
              {/* Match score removed from swipe cards - only shown in Match History */}
            </h2>
            <p className="text-lg text-white/90 drop-shadow-md">{professor.department}</p>
            <p className="text-lg text-white/85 drop-shadow-md">{professor.universityName}</p>
          </div>

          {/* Research Interests - Expandable */}
          {showInfo && professor.tags && professor.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl"
            >
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Research Interests</h3>
              <div className="flex flex-wrap gap-2">
                {professor.tags.slice(0, 6).map((tag, index) => {
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
                      className={`px-3 py-1.5 ${colorClass} text-white rounded-full text-sm font-semibold shadow-md`}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
