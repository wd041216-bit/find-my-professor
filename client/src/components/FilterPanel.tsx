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
  onFilterChange: (filters: { university?: string; department?: string; minMatchScore?: number }) => void;
  isOpen: boolean;
  onClose: () => void;
  isProfileComplete: boolean; // Whether user has complete profile (GPA, skills, etc.)
  currentFilters: { university?: string; department?: string; minMatchScore?: number }; // Current filter values
}

export function FilterPanel({ onFilterChange, isOpen, onClose, isProfileComplete, currentFilters }: FilterPanelProps) {
  const [selectedUniversity, setSelectedUniversity] = useState<string | undefined>(currentFilters.university);
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>(currentFilters.department);
  const [minMatchScore, setMinMatchScore] = useState<number>(currentFilters.minMatchScore || 0);

  // Sync local state with currentFilters when panel opens
  useEffect(() => {
    if (isOpen) {
      setSelectedUniversity(currentFilters.university);
      setSelectedDepartment(currentFilters.department);
      setMinMatchScore(currentFilters.minMatchScore || 0);
    }
  }, [isOpen, currentFilters]);

  // Get filter options (使用5分钟缓存)
  const { data: filterOptions } = trpc.swipe.getFilterOptions.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5分钟缓存，期间不会重新请求
  });
  
  // Filter departments based on selected university
  const departments = selectedUniversity 
    ? filterOptions?.departments.filter((dept: string) => dept) || []
    : filterOptions?.departments || [];

  // Apply filters only when user clicks "Apply Filters" button
  const handleApplyFilters = () => {
    console.log('[FilterPanel] Apply Filters clicked:', {
      selectedUniversity,
      selectedDepartment,
      minMatchScore,
      isProfileComplete
    });
    onFilterChange({
      university: selectedUniversity,
      department: selectedDepartment,
      minMatchScore: isProfileComplete ? minMatchScore : undefined,
    });
    onClose();
  };

  const handleClearFilters = () => {
    setSelectedUniversity(undefined);
    setSelectedDepartment(undefined);
    setMinMatchScore(0);
  };

  const hasActiveFilters = selectedUniversity || selectedDepartment || (isProfileComplete && minMatchScore > 0);

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
                setSelectedDepartment(undefined); // Reset department when university changes
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

          {/* Department Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Department / School</label>
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
              disabled={!selectedUniversity || selectedUniversity === '__all__'}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Departments</SelectItem>
                {(selectedUniversity && selectedUniversity !== '__all__' ? departments : filterOptions?.departments)?.map((dept) => (
                  <SelectItem key={dept!} value={dept!}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Match Score Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Minimum Match Score</label>
              <span className="text-sm font-semibold text-primary">{minMatchScore}%</span>
            </div>
            {!isProfileComplete ? (
              <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground text-center">
                Complete your profile (GPA, skills, etc.) to unlock match score filtering
              </div>
            ) : (
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            )}
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
            {selectedUniversity && selectedUniversity !== '__all__' && selectedDepartment && selectedDepartment !== '__all__' && ' → '}
            {selectedDepartment && selectedDepartment !== '__all__' && (
              <span className="font-medium">{selectedDepartment}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
