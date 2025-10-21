import { useEffect, useRef, useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  compact?: boolean;
  rows?: number;
  dropdown?: boolean;
  searchable?: boolean;
  showSearchInput?: boolean; // control rendering a visible search input (defaults to hidden)
  searchInTrigger?: boolean; // show typed characters directly in the main control
}

const ITEM_HEIGHT = 40; // px, for dropdown max-height calculation

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
  compact = false,
  rows,
  dropdown = false,
  searchable = false,
  showSearchInput = false,
  searchInTrigger = false,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue);
  const [open, setOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedLabel =
    options.find((o) => o.value === selectedValue)?.label || "";

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open && searchable && showSearchInput) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [open, searchable, showSearchInput]);

  const normalized = (s: string) => s.toLowerCase();
  const filteredOptions =
    searchable && searchQuery
      ? options.filter((o) =>
          normalized(o.label || "").startsWith(normalized(searchQuery))
        )
      : options;

  useEffect(() => {
    setActiveIndex(0);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [searchQuery, open]);

  const commitSelection = (val: string) => {
    setSelectedValue(val);
    onChange(val);
    setOpen(false);
    setSearchQuery("");
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (!dropdown) return;
    const key = e.key;
    if (key === "ArrowDown") {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActiveIndex((i) =>
        Math.min(i + 1, Math.max(filteredOptions.length - 1, 0))
      );
    } else if (key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (key === "Enter") {
      e.preventDefault();
      const opt = filteredOptions[activeIndex];
      if (opt) commitSelection(opt.value);
    } else if (key === "Escape") {
      setOpen(false);
    } else if (key.length === 1 && /[\w\d\s]/.test(key)) {
      if (!open) setOpen(true);
      setSearchQuery((prev) => (prev + key).trimStart());
      if (key === " ") e.preventDefault();
    } else if (key === "Backspace") {
      setSearchQuery((prev) => prev.slice(0, -1));
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
    if (el) {
      const list = listRef.current;
      const top = el.offsetTop;
      const bottom = top + el.offsetHeight;
      const viewTop = list.scrollTop;
      const viewBottom = viewTop + list.clientHeight;
      if (top < viewTop) list.scrollTop = top;
      else if (bottom > viewBottom) list.scrollTop = bottom - list.clientHeight;
    }
  }, [activeIndex, open]);

  const heightClass =
    rows && rows > 1 && !dropdown
      ? "h-auto max-h-56 overflow-y-auto"
      : compact
      ? "h-9"
      : "h-11";

  if (dropdown) {
    const maxHeight = rows && rows > 1 ? rows * ITEM_HEIGHT : undefined;
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        {searchable && searchInTrigger ? (
          <div className="relative">
            <input
              type="text"
              value={open || searchQuery ? searchQuery : selectedLabel || ""}
              placeholder={placeholder}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!open) setOpen(true);
              }}
              onKeyDown={(e) => {
                const key = e.key;
                if (key === "ArrowDown") {
                  e.preventDefault();
                  if (!open) return setOpen(true);
                  setActiveIndex((i) =>
                    Math.min(i + 1, Math.max(filteredOptions.length - 1, 0))
                  );
                } else if (key === "ArrowUp") {
                  e.preventDefault();
                  if (!open) return setOpen(true);
                  setActiveIndex((i) => Math.max(i - 1, 0));
                } else if (key === "Enter") {
                  e.preventDefault();
                  const opt = filteredOptions[activeIndex];
                  if (opt) commitSelection(opt.value);
                } else if (key === "Escape") {
                  setOpen(false);
                }
              }}
              className={`${heightClass} w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-10 text-left text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800`}
            />
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setOpen((v) => !v);
              if (!open) setSearchQuery("");
            }}
            onKeyDown={handleTriggerKeyDown}
            className={`${heightClass} w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-10 text-left text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
              selectedValue
                ? "text-gray-800 dark:text-white/90"
                : "text-gray-400 dark:text-gray-400"
            }`}
          >
            {selectedLabel || placeholder}
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </button>
        )}
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 shadow-lg">
            {searchable && showSearchInput && (
              <div className="px-3 pt-2 pb-1 border-b border-gray-100 dark:border-gray-800">
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to filter..."
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
                />
              </div>
            )}
            <ul
              ref={listRef}
              role="listbox"
              className="py-1 overflow-y-auto"
              style={maxHeight ? { maxHeight } : undefined}
            >
              {filteredOptions.length === 0 && (
                <li className="px-3 py-2 text-gray-400 text-sm select-none">
                  No results
                </li>
              )}
              {filteredOptions.map((option, idx) => {
                const active = idx === activeIndex;
                const selected = option.value === selectedValue;
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => commitSelection(option.value)}
                    className={`px-3 py-2 cursor-pointer text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      active ? "bg-gray-100 dark:bg-gray-800" : ""
                    }`}
                  >
                    {option.label}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedValue(value);
    onChange(value);
  };

  return (
    <select
      className={`${heightClass} w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
        selectedValue
          ? "text-gray-800 dark:text-white/90"
          : "text-gray-400 dark:text-gray-400"
      } ${className}`}
      value={selectedValue}
      onChange={handleChange}
      size={rows && rows > 1 ? rows : undefined}
    >
      <option
        value=""
        disabled
        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
      >
        {placeholder}
      </option>
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
