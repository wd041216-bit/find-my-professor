/**
 * Professor Card Skeleton
 * 教授卡片加载骨架屏
 */

export function ProfessorCardSkeleton() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Card container */}
      <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 animate-pulse">
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
             style={{
               backgroundSize: '200% 100%',
               animation: 'shimmer 2s infinite',
             }}
        />
        
        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-8">
          {/* Professor name skeleton */}
          <div className="h-8 w-3/4 bg-white/30 rounded-lg mb-3" />
          
          {/* Department skeleton */}
          <div className="h-5 w-1/2 bg-white/20 rounded-lg mb-2" />
          
          {/* University skeleton */}
          <div className="h-5 w-2/3 bg-white/20 rounded-lg" />
        </div>
        
        {/* Match score skeleton */}
        <div className="absolute top-6 right-6">
          <div className="w-16 h-8 bg-white/30 rounded-full" />
        </div>
      </div>
      
      {/* Loading text */}
      <div className="text-center mt-4">
        <p className="text-gray-500 font-medium animate-pulse">Loading professors...</p>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
