import { useState, useEffect } from 'react';
import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocale } from '@/hooks/useLocale';

interface FilterPanelProps {
  onFilterChange: (filters: { university?: string; researchField?: string }) => void;
  isOpen: boolean;
  onClose: () => void;
  isProfileComplete: boolean;
  currentFilters: { university?: string; researchField?: string };
}

export function FilterPanel({ onFilterChange, isOpen, onClose, isProfileComplete, currentFilters }: FilterPanelProps) {
  const { t } = useLanguage();
  const { isZh } = useLocale();
  const [selectedUniversity, setSelectedUniversity] = useState<string | undefined>(currentFilters.university);
  const [selectedResearchField, setSelectedResearchField] = useState<string | undefined>(currentFilters.researchField);

  useEffect(() => {
    if (isOpen) {
      setSelectedUniversity(currentFilters.university);
      setSelectedResearchField(currentFilters.researchField);
    }
  }, [isOpen, currentFilters]);

  const { data: filterOptions } = trpc.swipe.getFilterOptions.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  
  const universities = filterOptions?.universities || [];
  const universitiesZh = (filterOptions as any)?.universitiesZh || universities;
  const researchFields = filterOptions?.researchFields || [];
  const researchFieldsZh = (filterOptions as any)?.researchFieldsZh || researchFields;

  const handleApplyFilters = () => {
    onFilterChange({
      university: selectedUniversity,
      researchField: selectedResearchField,
    });
    onClose();
  };

  const handleClearFilters = () => {
    setSelectedUniversity(undefined);
    setSelectedResearchField(undefined);
  };

  const hasActiveFilters = selectedUniversity || selectedResearchField;

  const getUniversityLabel = (value: string | undefined) => {
    if (!value || value === '__all__') return undefined;
    if (!isZh) return value;
    const idx = universities.indexOf(value);
    return idx >= 0 ? (universitiesZh[idx] || value) : value;
  };

  const getFieldLabel = (value: string | undefined) => {
    if (!value || value === '__all__') return undefined;
    if (!isZh) return value;
    const idx = researchFields.indexOf(value);
    return idx >= 0 ? (researchFieldsZh[idx] || value) : value;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">{t.swipe.filterProfessors}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.swipe.university}</label>
            <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
              <SelectTrigger>
                <SelectValue placeholder={t.swipe.allUniversities}>
                  {getUniversityLabel(selectedUniversity) || t.swipe.allUniversities}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t.swipe.allUniversities}</SelectItem>
                {universities.map((uni: string, idx: number) => (
                  <SelectItem key={uni} value={uni}>
                    {isZh ? (universitiesZh[idx] || uni) : uni}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t.swipe.researchField}</label>
            <Select value={selectedResearchField} onValueChange={setSelectedResearchField}>
              <SelectTrigger>
                <SelectValue placeholder={t.swipe.allResearchFields}>
                  {getFieldLabel(selectedResearchField) || t.swipe.allResearchFields}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t.swipe.allResearchFields}</SelectItem>
                {researchFields.map((field: string, idx: number) => (
                  <SelectItem key={field} value={field}>
                    {isZh ? (researchFieldsZh[idx] || field) : field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClearFilters} disabled={!hasActiveFilters} className="flex-1">
            {t.swipe.clearFilters}
          </Button>
          <Button onClick={handleApplyFilters} className="flex-1">
            {t.swipe.applyFilters}
          </Button>
        </div>

        {hasActiveFilters && (
          <div className="text-sm text-muted-foreground">
            {t.swipe.activeFilters}:{' '}
            {selectedUniversity && selectedUniversity !== '__all__' && (
              <span className="font-medium">{getUniversityLabel(selectedUniversity)}</span>
            )}
            {selectedUniversity && selectedUniversity !== '__all__' && selectedResearchField && selectedResearchField !== '__all__' && ' + '}
            {selectedResearchField && selectedResearchField !== '__all__' && (
              <span className="font-medium">{getFieldLabel(selectedResearchField)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
