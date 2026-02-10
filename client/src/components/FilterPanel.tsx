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
  onFilterChange: (filters: { university?: string; department?: string }) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function FilterPanel({ onFilterChange, isOpen, onClose }: FilterPanelProps) {
  const [selectedUniversity, setSelectedUniversity] = useState<string | undefined>();
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>();

  // Get filter options (使用5分钟缓存)
  const { data: filterOptions } = trpc.swipe.getFilterOptions.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5分钟缓存，期间不会重新请求
  });
  
  // Get departments for selected university
  const { data: departments } = trpc.swipe.getDepartmentsByUniversity.useQuery(
    { university: selectedUniversity! },
    { enabled: !!selectedUniversity }
  );

  // Apply filters when selection changes
  useEffect(() => {
    onFilterChange({
      university: selectedUniversity,
      department: selectedDepartment,
    });
  }, [selectedUniversity, selectedDepartment, onFilterChange]);

  const handleClearFilters = () => {
    setSelectedUniversity(undefined);
    setSelectedDepartment(undefined);
  };

  const hasActiveFilters = selectedUniversity || selectedDepartment;

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
            onClick={onClose}
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
