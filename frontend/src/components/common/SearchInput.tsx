import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export function SearchInput({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  className,
  id,
  'aria-label': ariaLabel
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search 
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" 
        aria-hidden="true"
      />
      <Input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label={ariaLabel || placeholder}
        role="searchbox"
      />
    </div>
  );
}