import { useEffect, useId, useRef, useState } from 'react';
import { api } from '../api';
import type { StockSearchResult } from '../types';

interface StockSuggestInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const DEBOUNCE_MS = 200;

export function StockSuggestInput({ value, onChange, disabled = false }: StockSuggestInputProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [options, setOptions] = useState<StockSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (!query) {
      setOptions([]);
      setOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      api.searchStocks(query, 10, controller.signal)
        .then((results) => {
          setOptions(results);
          setOpen(true);
          setHighlightedIndex(results.length ? 0 : -1);
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setOptions([]);
          setOpen(true);
          setHighlightedIndex(-1);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    function onDocumentMouseDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener('mousedown', onDocumentMouseDown);
    return () => document.removeEventListener('mousedown', onDocumentMouseDown);
  }, []);

  function selectOption(option: StockSearchResult) {
    onChange(option.tsCode);
    setOpen(false);
    setHighlightedIndex(-1);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (value.trim()) setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
            setHighlightedIndex((current) => Math.min(current + 1, options.length - 1));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
            setHighlightedIndex((current) => Math.max(current - 1, 0));
          } else if (event.key === 'Enter' && open && highlightedIndex >= 0 && options[highlightedIndex]) {
            event.preventDefault();
            selectOption(options[highlightedIndex]);
          } else if (event.key === 'Escape') {
            setOpen(false);
          }
        }}
        placeholder="600519.SH / gzmt / 茅台"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      />
      {open && value.trim() && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl shadow-slate-950/60">
          <ul id={listboxId} role="listbox" className="max-h-64 overflow-auto py-1">
            {options.map((option, index) => (
              <li
                key={option.tsCode}
                role="option"
                aria-selected={highlightedIndex === index}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOption(option)}
                className={`cursor-pointer px-4 py-3 text-sm transition ${highlightedIndex === index ? 'bg-indigo-600/30 text-white' : 'text-slate-200 hover:bg-slate-800'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{option.name}</span>
                  <span className="font-mono text-xs text-slate-400">{option.tsCode}</span>
                </div>
                {option.market && <div className="mt-1 text-xs text-slate-500">{option.market}</div>}
              </li>
            ))}
            {!loading && options.length === 0 && <li className="px-4 py-3 text-sm text-slate-500">暂无匹配股票</li>}
            {loading && <li className="px-4 py-3 text-sm text-slate-500">搜索中...</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
