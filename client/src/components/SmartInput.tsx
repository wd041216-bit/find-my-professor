import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

interface Suggestion {
  chinese: string;
  english: string;
}

interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type: 'university' | 'major';
  className?: string;
  getSuggestions: (input: string) => Suggestion[];
  normalize: (input: string) => string;
}

/**
 * Smart input component with Chinese-English autocomplete
 */
export function SmartInput({
  value,
  onChange,
  onBlur,
  placeholder,
  type,
  className,
  getSuggestions,
  normalize,
}: SmartInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    // Close suggestions when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Get suggestions
    if (newValue.trim()) {
      const newSuggestions = getSuggestions(newValue);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const normalized = normalize(suggestion.chinese);
    setInputValue(normalized);
    onChange(normalized);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputBlur = () => {
    // Delay to allow suggestion click to register
    setTimeout(() => {
      if (inputValue.trim()) {
        // Normalize the input
        const normalized = normalize(inputValue);
        setInputValue(normalized);
        onChange(normalized);
      }
      setShowSuggestions(false);
      onBlur?.();
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else if (inputValue.trim()) {
          const normalized = normalize(inputValue);
          setInputValue(normalized);
          onChange(normalized);
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.chinese}-${index}`}
              className={cn(
                "px-3 py-2 cursor-pointer transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                selectedIndex === index && "bg-accent text-accent-foreground"
              )}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent input blur
                handleSuggestionClick(suggestion);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{suggestion.chinese}</span>
                <span className="text-xs text-muted-foreground">{suggestion.english}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {inputValue && !showSuggestions && (
        <div className="mt-1 text-xs text-muted-foreground">
          {type === 'university' ? '提示：支持中英文输入，保存时自动转换为英文' : '提示：支持中英文输入，保存时自动转换为英文'}
        </div>
      )}
    </div>
  );
}
