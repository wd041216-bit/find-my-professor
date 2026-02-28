import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getProfessorBackgroundImage } from '@/../../shared/universityFieldImages';

export interface Professor {
  id: number;
  name: string;
  universityName: string;
  department: string;
  researchField?: string;
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
  isMinimalProfile?: boolean;
  animation?: CardAnimation | null;
}

// LIKE exit: flies RIGHT, tilts clockwise — joyful, energetic
const LIKE_EXIT = {
  x: 1600,
  y: -100,
  rotate: 28,
  scale: 0.88,
  opacity: 0,
};

// NOPE exit: flies LEFT, tilts counter-clockwise — dismissive
const NOPE_EXIT = {
  x: -1600,
  y: -100,
  rotate: -28,
  scale: 0.88,
  opacity: 0,
};

const EXIT_TRANSITION = {
  duration: 0.52,
  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
};

export function ProfessorCard({
  professor,
  onSwipe,
  style,
  animation = null,
}: ProfessorCardProps) {
  const x = useMotionValue(0);
  const [showInfo, setShowInfo] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  // Tinder-like rotation while dragging
  const rotate = useTransform(x, [-250, 250], [-18, 18]);

  // LIKE / NOPE stamp opacity tied to drag position
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, -20], [1, 0]);

  // Colored glow overlays tied to drag
  const likeGlowOpacity = useTransform(x, [0, 150], [0, 1]);
  const nopeGlowOpacity = useTransform(x, [-150, 0], [1, 0]);

  // Respond to external animation prop (button clicks from parent)
  useEffect(() => {
    if (animation && !isExiting) {
      const dir = animation.direction;
      setIsExiting(true);
      setExitDirection(dir);
      // Parent already advances the index; no need to call onSwipe here
    }
  }, [animation]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isExiting) return;
    const threshold = 100;
    if (Math.abs(info.offset.x) > threshold || Math.abs(info.velocity.x) > 500) {
      const dir = info.offset.x > 0 ? 'right' : 'left';
      setIsExiting(true);
      setExitDirection(dir);
      setTimeout(() => onSwipe(dir, professor), 480);
    }
  };

  const exitTarget = isExiting
    ? exitDirection === 'right' ? LIKE_EXIT : NOPE_EXIT
    : { x: 0 };

  const exitTransition = isExiting ? EXIT_TRANSITION : {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
    mass: 0.7,
  };

  return (
    <motion.div
      style={{
        x: isExiting ? undefined : x,
        rotate: isExiting ? undefined : rotate,
        ...style,
      }}
      drag={isExiting ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.75}
      onDragEnd={handleDragEnd}
      animate={exitTarget}
      transition={exitTransition}
      className="absolute w-full h-full cursor-grab active:cursor-grabbing select-none"
    >
      <div className="relative w-full h-full rounded-3xl shadow-2xl overflow-hidden">

        {/* ── Green glow (drag right) ── */}
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none rounded-3xl"
          style={{
            background: 'radial-gradient(circle at 50% 40%, rgba(34,197,94,0.38) 0%, transparent 65%)',
            opacity: isExiting && exitDirection === 'right' ? 0 : likeGlowOpacity,
          }}
        />
        {/* ── Red glow (drag left) ── */}
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none rounded-3xl"
          style={{
            background: 'radial-gradient(circle at 50% 40%, rgba(239,68,68,0.38) 0%, transparent 65%)',
            opacity: isExiting && exitDirection === 'left' ? 0 : nopeGlowOpacity,
          }}
        />

        {/* ── Green flash on LIKE exit ── */}
        {isExiting && exitDirection === 'right' && (
          <motion.div
            className="absolute inset-0 z-10 pointer-events-none rounded-3xl"
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ background: 'radial-gradient(circle at 50% 40%, rgba(34,197,94,0.55) 0%, transparent 70%)' }}
          />
        )}
        {/* ── Red flash on NOPE exit ── */}
        {isExiting && exitDirection === 'left' && (
          <motion.div
            className="absolute inset-0 z-10 pointer-events-none rounded-3xl"
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ background: 'radial-gradient(circle at 50% 40%, rgba(239,68,68,0.55) 0%, transparent 70%)' }}
          />
        )}

        {/* ── LIKE stamp — top-right, clockwise tilt ── */}
        <motion.div
          className="absolute top-10 right-7 z-20 pointer-events-none"
          style={{
            opacity: isExiting && exitDirection === 'right' ? 1 : (likeOpacity as any),
            background: 'linear-gradient(135deg, #22c55e, #15803d)',
            color: 'white',
            padding: '10px 24px',
            borderRadius: '12px',
            border: '3px solid rgba(255,255,255,0.9)',
            transform: 'rotate(14deg)',
            fontWeight: 900,
            fontSize: '22px',
            letterSpacing: '2px',
            boxShadow: '0 6px 24px rgba(34,197,94,0.55)',
          }}
        >
          LIKE ❤️
        </motion.div>

        {/* ── NOPE stamp — top-left, counter-clockwise tilt ── */}
        <motion.div
          className="absolute top-10 left-7 z-20 pointer-events-none"
          style={{
            opacity: isExiting && exitDirection === 'left' ? 1 : (nopeOpacity as any),
            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            color: 'white',
            padding: '10px 24px',
            borderRadius: '12px',
            border: '3px solid rgba(255,255,255,0.9)',
            transform: 'rotate(-14deg)',
            fontWeight: 900,
            fontSize: '22px',
            letterSpacing: '2px',
            boxShadow: '0 6px 24px rgba(239,68,68,0.55)',
          }}
        >
          NOPE 👎
        </motion.div>

        {/* ── Background image ── */}
        <div className="absolute inset-0">
          {(() => {
            const fieldImage = professor.researchField
              ? getProfessorBackgroundImage(professor.universityName, professor.researchField)
              : null;
            const imageUrl = fieldImage || professor.schoolImageUrl;
            return imageUrl ? (
              <img
                src={imageUrl}
                alt={`${professor.universityName} ${professor.researchField || professor.department}`}
                className="w-full h-full object-cover"
                draggable={false}
                loading="eager"
                fetchPriority="high"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400" />
            );
          })()}
          {/* Dark gradient for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        </div>

        {/* ── Info toggle ── */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
          className="absolute top-5 right-5 z-30 w-11 h-11 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all active:scale-95"
        >
          <Info className="w-5 h-5 text-purple-600" />
        </button>

        {/* ── Bottom info ── */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
          <div className="mb-3">
            <h2 className="text-3xl font-black text-white mb-1 drop-shadow-lg leading-tight">
              {professor.name}
            </h2>
            <p className="text-base text-white/90 drop-shadow-md">{professor.department}</p>
            <p className="text-base text-white/80 drop-shadow-md font-medium">{professor.universityName}</p>
          </div>

          <AnimatePresence>
            {showInfo && professor.tags && professor.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl"
              >
                <h3 className="text-xs font-bold text-gray-600 mb-2.5 uppercase tracking-wider">
                  Research Interests
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {professor.tags.slice(0, 6).map((tag, i) => {
                    const colors = [
                      'from-blue-500 to-blue-700',
                      'from-purple-500 to-purple-700',
                      'from-pink-500 to-pink-700',
                      'from-orange-500 to-orange-700',
                      'from-teal-500 to-teal-700',
                      'from-indigo-500 to-indigo-700',
                    ];
                    return (
                      <span
                        key={i}
                        className={`px-2.5 py-1 bg-gradient-to-r ${colors[i % colors.length]} text-white rounded-full text-xs font-semibold shadow`}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
