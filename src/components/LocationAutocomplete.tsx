"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Place {
  short: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = "City, State or Country",
  required,
  className,
}: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = useCallback((val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(val)}`);
        const data: Place[] = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);

  function handleInput(val: string) {
    setQuery(val);
    onChange(val);
    setActiveIndex(-1);
    search(val);
  }

  function select(place: Place) {
    setQuery(place.short);
    onChange(place.short);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      select(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        required={required}
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
          …
        </span>
      )}
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-[#0d0d0d] shadow-2xl overflow-hidden"
        >
          {suggestions.map((place, i) => (
            <li
              key={i}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => select(place)}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                i === activeIndex
                  ? "bg-blue-600/20 text-white"
                  : "text-gray-300 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {place.short}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
