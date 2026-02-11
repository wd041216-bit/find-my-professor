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

interface FilterPanelProps {
  onFilterChange: (filters: { university?: string; researchField?: string }) => void;
  isOpen: boolean;
  onClose: () => void;
  isProfileComplete: boolean; // Whether user has complete profile (GPA, skills, etc.)
  currentFilters: { university?: string; researchField?: string }; // Current filter values
}

export function FilterPanel({ onFilterChange, isOpen, onClose, isProfileComplete, currentFilters }: FilterPanelProps) {
  const [selectedUniversity, setSelectedUniversity] = useState<string | undefined>(currentFilters.university);
  const [selectedResearchField, setSelectedResearchField] = useState<string | undefined>(currentFilters.researchField);

  // Sync local state with currentFilters when panel opens
  useEffect(() => {
    if (isOpen) {
      setSelectedUniversity(currentFilters.university);
      setSelectedResearchField(currentFilters.researchField);
    }
  }, [isOpen, currentFilters]);

  // Get filter options (使用5分钟缓存)
  const { data: filterOptions } = trpc.swipe.getFilterOptions.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5分钟缓存，期间不会重新请求
  });
  
  // Research fields are independent of university selection
  const researchFields = filterOptions?.researchFields || [];

  // Apply filters only when user clicks "Apply Filters" button
  const handleApplyFilters = () => {
    console.log('[FilterPanel] Apply Filters clicked:', {
      selectedUniversity,
      selectedResearchField,
    });
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Filter Professors</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          {/* University Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">University</label>
            <Select
              value={selectedUniversity}
              onValueChange={(value) => {
                setSelectedUniversity(value);
                // Research fields are now independent of university, no need to reset
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Universities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Universities</SelectItem>
                {filterOptions?.universities.map((uni) => (
                  <SelectItem key={uni!} value={uni!}>
                    {uni}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Research Field Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Research Field</label>
            <Select
              value={selectedResearchField}
              onValueChange={setSelectedResearchField}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Research Fields" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Research Fields</SelectItem>
                {researchFields.map((field) => (
                  <SelectItem key={field!} value={field!}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            className="flex-1"
          >
            Clear Filters
          </Button>
          <Button
            onClick={handleApplyFilters}
            className="flex-1"
          >
            Apply Filters
          </Button>
        </div>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="text-sm text-muted-foreground">
            Active filters:{' '}
            {selectedUniversity && selectedUniversity !== '__all__' && (
              <span className="font-medium">{selectedUniversity}</span>
            )}
            {selectedUniversity && selectedUniversity !== '__all__' && selectedResearchField && selectedResearchField !== '__all__' && ' + '}
            {selectedResearchField && selectedResearchField !== '__all__' && (
              <span className="font-medium">{selectedResearchField}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
