import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { routeService } from '../../services/routeService';

export const LocationAutocomplete = ({
  label,
  value,
  onChange,
  onSelect,
  placeholder = 'Enter location...',
  required = false,
  error,
}) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = async (e) => {
    const text = e.target.value;
    setQuery(text);
    onChange(text);

    if (text.length >= 2) {
      setLoading(true);
      try {
        const res = await routeService.autocomplete(text);
        setSuggestions(res.results || []);
        setIsOpen(true);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (item) => {
    const selectedName = item.formatted || item.name;
    setQuery(selectedName);
    onChange(selectedName);
    if (onSelect) {
      onSelect(item);
    }
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative flex flex-col space-y-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-[#0F172A]">
          {label} {required && <span className="text-[#EF4444]">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-[#64748B] pointer-events-none">
          <MapPin size={18} />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-lg border bg-white pl-10 pr-10 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1769F4]/20 focus:border-[#1769F4] ${
            error ? 'border-[#EF4444]' : 'border-[#E2E8F0]'
          }`}
        />
        {loading && (
          <div className="absolute right-3.5 text-[#64748B]">
            <Loader2 className="animate-spin" size={16} />
          </div>
        )}
      </div>

      {error && <p className="text-xs text-[#EF4444] font-normal">{error}</p>}

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-[#E2E8F0] rounded-lg shadow-lg max-h-60 overflow-y-auto py-1">
          {suggestions.map((item, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(item)}
              className="px-4 py-2.5 hover:bg-[#F8FAFC] cursor-pointer text-sm text-[#0F172A] flex items-center space-x-2.5 border-b border-[#F1F5F9] last:border-b-0"
            >
              <MapPin size={16} className="text-[#1769F4] shrink-0" />
              <div>
                <p className="font-medium text-xs sm:text-sm">{item.name || item.formatted}</p>
                {item.city && (
                  <p className="text-xs text-[#64748B]">{[item.city, item.country].filter(Boolean).join(', ')}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
