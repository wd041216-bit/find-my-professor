import { useState } from 'react';
import { Heart, Mail, Globe, ExternalLink, Sparkles, Trash2, ArrowLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function Matches() {
  const { user, loading: authLoading } = useAuth();
  const { data: matches, isLoading, refetch } = trpc.swipe.getMyMatches.useQuery(undefined, {
    enabled: !!user,
  });
  const unlikeMutation = trpc.swipe.unlikeProfessor.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const [professorToUnlike, setProfessorToUnlike] = useState<number | null>(null);

  const handleUnlike = (professorId: number) => {
    setProfessorToUnlike(professorId);
  };

  const confirmUnlike = () => {
    if (professorToUnlike) {
      unlikeMutation.mutate({ professorId: professorToUnlike });
      setProfessorToUnlike(null);
    }
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  // Empty state
  if (!matches || matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
              <Heart className="w-16 h-16 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-4">
            No Matches Yet!
          </h2>
          <p className="text-xl text-gray-700 mb-8 font-medium">
            Start swiping to find professors that match your research interests.
          </p>
          <Link href="/swipe">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white font-bold text-lg px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all"
            >
              <Heart className="w-6 h-6 mr-2" />
              Start Swiping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft className="w-6 h-6" />
              </Button>
            </Link>
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              My Matches
            </h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Matches List */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <p className="text-lg text-gray-700 font-medium">
            You have <span className="font-black text-purple-600">{matches.length}</span> {matches.length === 1 ? 'match' : 'matches'}
          </p>
        </div>

        <div className="space-y-4">
          {matches.map((match) => {
            const professor = match.professor;
            const tags = professor.tags || [];

            return (
              <div
                key={match.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  {/* Professor Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-gray-900 mb-1">
                        {professor.name}
                        {match.likeType === 'super_like' && (
                          <span className="ml-2 inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-bold">
                            <Sparkles className="w-4 h-4" />
                            SUPER LIKE
                          </span>
                        )}
                      </h3>
                      {professor.title && (
                        <p className="text-lg font-semibold text-gray-700 mb-1">{professor.title}</p>
                      )}
                      <p className="text-base text-gray-600">{professor.department || professor.majorName}</p>
                      <p className="text-base text-gray-600">{professor.universityName}</p>
                    </div>

                    {/* Unlike Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUnlike(professor.id)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Research Interests Tags */}
                  {tags.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Research Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {tags.slice(0, 6).map((tag, index) => {
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
                    </div>
                  )}

                  {/* Contact Information */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                    {professor.email && (
                      <a
                        href={`mailto:${professor.email}`}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </a>
                    )}
                    {professor.personalWebsite && (
                      <a
                        href={professor.personalWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg"
                      >
                        <Globe className="w-4 h-4" />
                        Website
                      </a>
                    )}
                    {professor.labWebsite && (
                      <a
                        href={professor.labWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-full font-semibold hover:from-teal-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Lab
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unlike Confirmation Dialog */}
      <AlertDialog open={professorToUnlike !== null} onOpenChange={() => setProfessorToUnlike(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Matches?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this professor from your matches? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnlike}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
