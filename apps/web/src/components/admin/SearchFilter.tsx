'use client';

import { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchFilterProps {
    placeholder?: string;
    onSearchChange: (value: string) => void;
    onFilterChange?: (filters: Record<string, any>) => void;
    filters?: FilterConfig[];
    showFilters?: boolean;
}

interface FilterConfig {
    key: string;
    label: string;
    type: 'select' | 'date' | 'dateRange';
    options?: { value: string; label: string }[];
}

export function SearchFilter({
    placeholder = 'بحث...',
    onSearchChange,
    onFilterChange,
    filters = [],
    showFilters = false,
}: SearchFilterProps) {
    const [searchValue, setSearchValue] = useState('');
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filterValues, setFilterValues] = useState<Record<string, any>>({});

    const handleSearchChange = (value: string) => {
        setSearchValue(value);
        onSearchChange(value);
    };

    const handleClearSearch = () => {
        setSearchValue('');
        onSearchChange('');
    };

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...filterValues, [key]: value };
        setFilterValues(newFilters);
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    };

    const handleClearFilters = () => {
        setFilterValues({});
        if (onFilterChange) {
            onFilterChange({});
        }
    };

    const activeFiltersCount = Object.values(filterValues).filter(v => v).length;

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder={placeholder}
                        value={searchValue}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pr-10 pl-10"
                        dir="rtl"
                    />
                    {searchValue && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {showFilters && filters.length > 0 && (
                    <Button
                        variant="outline"
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                        className="relative"
                    >
                        <Filter className="w-4 h-4 ml-2" />
                        تصفية
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1 -left-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}
                    </Button>
                )}
            </div>

            {/* Filter Panel */}
            {showFilterPanel && showFilters && filters.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4" dir="rtl">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">خيارات التصفية</h4>
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={handleClearFilters}
                                className="text-sm text-primary-600 hover:text-primary-800"
                            >
                                مسح الكل
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filters.map((filter) => (
                            <div key={filter.key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {filter.label}
                                </label>
                                {filter.type === 'select' && filter.options && (
                                    <select
                                        value={filterValues[filter.key] || ''}
                                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="">الكل</option>
                                        {filter.options.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {filter.type === 'date' && (
                                    <input
                                        type="date"
                                        value={filterValues[filter.key] || ''}
                                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
