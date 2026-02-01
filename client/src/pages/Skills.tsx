import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Skills() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [newSkill, setNewSkill] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { data: profile, isLoading, refetch } = trpc.profile.get.useQuery();
  const updateProfileMutation = trpc.profile.upsert.useMutation({
    onSuccess: () => {
      refetch();
      toast.success(t.skills.updateSuccess);
    },
    onError: (error: any) => {
      toast.error(`${t.common.error}: ${error.message}`);
    },
  });

  const skills = profile?.skills ? JSON.parse(profile.skills) : [];

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    
    const trimmedSkill = newSkill.trim();
    if (skills.includes(trimmedSkill)) {
      toast.error(t.skills.duplicateSkill);
      return;
    }

    const updatedSkills = [...skills, trimmedSkill];
    await updateProfileMutation.mutateAsync({
      skills: updatedSkills,
    });
    setNewSkill("");
    setIsAdding(false);
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    const updatedSkills = skills.filter((s: string) => s !== skillToRemove);
    await updateProfileMutation.mutateAsync({
      skills: updatedSkills,
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t.skills.title}</h1>
        <p className="text-muted-foreground">{t.skills.description}</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{t.skills.yourSkills}</h2>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t.skills.addSkill}
            </Button>
          )}
        </div>

        {isAdding && (
          <div className="mb-6 flex gap-2">
            <Input
              placeholder={t.skills.enterSkill}
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddSkill();
                } else if (e.key === "Escape") {
                  setIsAdding(false);
                  setNewSkill("");
                }
              }}
              autoFocus
            />
            <Button onClick={handleAddSkill} disabled={!newSkill.trim() || updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t.common.add
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setNewSkill("");
              }}
            >
              {t.common.cancel}
            </Button>
          </div>
        )}

        {skills.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">{t.skills.noSkills}</p>
            <p className="text-sm">{t.skills.addSkillPrompt}</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill: string) => (
              <Badge
                key={skill}
                variant="secondary"
                className="px-3 py-2 text-sm flex items-center gap-2 hover:bg-secondary/80 transition-colors"
              >
                {skill}
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-destructive transition-colors"
                  disabled={updateProfileMutation.isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-6 pt-6 border-t">
          <h3 className="text-sm font-medium mb-2">{t.skills.tips}</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• {t.skills.tip1}</li>
            <li>• {t.skills.tip2}</li>
            <li>• {t.skills.tip3}</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
