import { useState, useEffect } from 'react';
import { X, Filter, ChevronRight } from 'lucide-react';
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

const REGION_KEYS = ['North America', 'Europe', 'Asia'] as const;
type Region = typeof REGION_KEYS[number];

export function FilterPanel({ onFilterChange, isOpen, onClose, isProfileComplete, currentFilters }: FilterPanelProps) {
  const { t } = useLanguage();
  const { isZh } = useLocale();

  const [selectedRegion, setSelectedRegion] = useState<Region | undefined>(undefined);
  const [selectedUniversity, setSelectedUniversity] = useState<string | undefined>(currentFilters.university);
  const [selectedResearchField, setSelectedResearchField] = useState<string | undefined>(currentFilters.researchField);

  const { data: filterOptions } = trpc.swipe.getFilterOptions.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const universities = filterOptions?.universities || [];
  const universitiesZh = (filterOptions as any)?.universitiesZh || universities;
  const universitiesRegion: string[] = (filterOptions as any)?.universitiesRegion || [];
  const regionMap: Record<string, string[]> = (filterOptions as any)?.regionMap || {};
  const researchFields = filterOptions?.researchFields || [];
  const researchFieldsZh = (filterOptions as any)?.researchFieldsZh || researchFields;

  // When filter panel opens, restore state from currentFilters
  useEffect(() => {
    if (isOpen) {
      setSelectedUniversity(currentFilters.university);
      setSelectedResearchField(currentFilters.researchField);
      // Derive region from current university
      if (currentFilters.university) {
        const idx = universities.indexOf(currentFilters.university);
        const region = idx >= 0 ? (universitiesRegion[idx] as Region) : undefined;
        setSelectedRegion(region);
      } else {
        setSelectedRegion(undefined);
      }
    }
  }, [isOpen, currentFilters]);

  // When region changes, clear university selection if it doesn't belong to new region
  const handleRegionChange = (value: string) => {
    if (value === '__all__') {
      setSelectedRegion(undefined);
      setSelectedUniversity(undefined);
    } else {
      const region = value as Region;
      setSelectedRegion(region);
      // Clear university if it doesn't belong to this region
      if (selectedUniversity && selectedUniversity !== '__all__') {
        const uniRegion = universitiesRegion[universities.indexOf(selectedUniversity)];
        if (uniRegion !== region) {
          setSelectedUniversity(undefined);
        }
      }
    }
  };

  // Universities filtered by selected region
  const filteredUniversities = selectedRegion
    ? universities.filter((_: string, idx: number) => universitiesRegion[idx] === selectedRegion)
    : universities;

  const getRegionLabel = (region: Region | undefined) => {
    if (!region) return undefined;
    const map: Record<Region, string> = {
      'North America': isZh ? t.swipe.regionNorthAmerica : 'North America',
      'Europe': isZh ? t.swipe.regionEurope : 'Europe',
      'Asia': isZh ? t.swipe.regionAsia : 'Asia',
    };
    return map[region];
  };

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

  const handleApplyFilters = () => {
    onFilterChange({
      university: selectedUniversity === '__all__' ? undefined : selectedUniversity,
      researchField: selectedResearchField === '__all__' ? undefined : selectedResearchField,
    });
    onClose();
  };

  const handleClearFilters = () => {
    setSelectedRegion(undefined);
    setSelectedUniversity(undefined);
    setSelectedResearchField(undefined);
  };

  const hasActiveFilters = selectedRegion || selectedUniversity || selectedResearchField;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6 space-y-6">
        {/* Header */}
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
          {/* Step 1: Region */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
              {t.swipe.region}
            </label>
            <Select
              value={selectedRegion ?? '__all__'}
              onValueChange={handleRegionChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.swipe.allRegions}>
                  {selectedRegion ? getRegionLabel(selectedRegion) : t.swipe.allRegions}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t.swipe.allRegions}</SelectItem>
                <SelectItem value="North America">{isZh ? t.swipe.regionNorthAmerica : 'North America'}</SelectItem>
                <SelectItem value="Europe">{isZh ? t.swipe.regionEurope : 'Europe'}</SelectItem>
                <SelectItem value="Asia">{isZh ? t.swipe.regionAsia : 'Asia'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: University (cascaded from region) */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
              {t.swipe.university}
              {selectedRegion && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({filteredUniversities.length})
                </span>
              )}
            </label>
            <Select
              value={selectedUniversity ?? '__all__'}
              onValueChange={setSelectedUniversity}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.swipe.allUniversities}>
                  {getUniversityLabel(selectedUniversity) || t.swipe.allUniversities}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="__all__">{t.swipe.allUniversities}</SelectItem>
                {filteredUniversities.map((uni: string) => {
                  const idx = universities.indexOf(uni);
                  return (
                    <SelectItem key={uni} value={uni}>
                      {isZh ? (universitiesZh[idx] || uni) : uni}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Research Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.swipe.researchField}</label>
            <Select value={selectedResearchField ?? '__all__'} onValueChange={setSelectedResearchField}>
              <SelectTrigger>
                <SelectValue placeholder={t.swipe.allResearchFields}>
                  {getFieldLabel(selectedResearchField) || t.swipe.allResearchFields}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60">
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

        {/* Active filter breadcrumb */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1 flex-wrap text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
            <span className="font-medium text-foreground">{t.swipe.activeFilters}:</span>
            {selectedRegion && (
              <span className="inline-flex items-center gap-0.5 text-primary font-medium">
                {getRegionLabel(selectedRegion)}
              </span>
            )}
            {selectedRegion && (selectedUniversity && selectedUniversity !== '__all__') && (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
            {selectedUniversity && selectedUniversity !== '__all__' && (
              <span className="inline-flex items-center gap-0.5 text-primary font-medium">
                {getUniversityLabel(selectedUniversity)}
              </span>
            )}
            {(selectedRegion || (selectedUniversity && selectedUniversity !== '__all__')) &&
              selectedResearchField && selectedResearchField !== '__all__' && (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
            {selectedResearchField && selectedResearchField !== '__all__' && (
              <span className="inline-flex items-center gap-0.5 text-primary font-medium">
                {getFieldLabel(selectedResearchField)}
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClearFilters} disabled={!hasActiveFilters} className="flex-1">
            {t.swipe.clearFilters}
          </Button>
          <Button onClick={handleApplyFilters} className="flex-1">
            {t.swipe.applyFilters}
          </Button>
        </div>
      </div>
    </div>
  );
}
