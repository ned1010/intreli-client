'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Document } from '@/types/types';

export interface TriggerPosition {
  start: number;
  end: number;
  query: string;
}

export interface UseDocumentAutocompleteOptions {
  documents: Document[];
  onSelect: (document: Document, triggerPosition: TriggerPosition) => void;
  maxResults?: number;
  debounceMs?: number;
}

export interface UseDocumentAutocompleteReturn {
  isOpen: boolean;
  selectedIndex: number;
  filteredDocuments: Document[];
  triggerPosition: TriggerPosition | null;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
  handleSelect: (index?: number) => void;
  close: () => void;
}

const DEFAULT_MAX_RESULTS = 20;
const DEFAULT_DEBOUNCE_MS = 150; // Optimized for better typing performance

export function useDocumentAutocomplete(
  inputValue: string,
  cursorPosition: number,
  options: UseDocumentAutocompleteOptions
): UseDocumentAutocompleteReturn {
  const { documents, onSelect, maxResults = DEFAULT_MAX_RESULTS, debounceMs = DEFAULT_DEBOUNCE_MS } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [triggerPosition, setTriggerPosition] = useState<TriggerPosition | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Detect trigger and filter documents
  useEffect(() => {
    // Early exit: skip processing if input is empty and autocomplete is not open
    if (!inputValue.trim() && !isOpen) {
      return;
    }

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const detectTrigger = () => {
      // Ensure cursor position is within bounds
      const safeCursorPos = Math.min(Math.max(0, cursorPosition), inputValue.length);

      // Early exit: if cursor is at the beginning and no '@' symbol, skip processing
      if (safeCursorPos === 0 && !inputValue.includes('@')) {
        if (isOpen) {
          setIsOpen(false);
          setTriggerPosition(null);
          setFilteredDocuments([]);
        }
        return;
      }

      // Get text before cursor
      const textBeforeCursor = inputValue.substring(0, safeCursorPos);

      // Early exit: if no '@' in text before cursor, skip regex matching
      if (!textBeforeCursor.includes('@')) {
        if (isOpen) {
          setIsOpen(false);
          setTriggerPosition(null);
          setFilteredDocuments([]);
        }
        return;
      }

      // Match '@' or '@-' followed by optional query
      // Pattern: @ or @- followed by word characters, spaces, dots, and other common filename characters
      // More permissive pattern to catch '@' immediately
      const triggerMatch = textBeforeCursor.match(/@-?([\w\s.-]*)$/);

      if (triggerMatch) {
        const query = triggerMatch[1] || '';
        const triggerStart = safeCursorPos - triggerMatch[0].length;
        const triggerEnd = safeCursorPos;

        // Debug logging removed for better performance

        // Only update if trigger position actually changed to prevent unnecessary re-renders
        setTriggerPosition(prev => {
          if (prev && prev.start === triggerStart && prev.end === triggerEnd && prev.query === query) {
            return prev; // No change, return previous to prevent re-render
          }
          return {
            start: triggerStart,
            end: triggerEnd,
            query: query
          };
        });

        // Filter documents based on query
        // Early exit: if no documents, skip filtering
        if (documents.length === 0) {
          setIsOpen(false);
          setTriggerPosition(null);
          setFilteredDocuments([]);
          return;
        }

        const filtered = documents.filter(doc => {
          if (!query) return true;
          return doc.name.toLowerCase().includes(query.toLowerCase());
        }).slice(0, maxResults);

        setFilteredDocuments(prev => {
          // Only update if filtered list actually changed
          if (prev.length === filtered.length &&
            prev.every((doc, idx) => doc.id === filtered[idx]?.id)) {
            return prev;
          }
          return filtered;
        });

        setIsOpen(prev => {
          const shouldBeOpen = filtered.length > 0;
          // Only update if state actually changed
          if (prev === shouldBeOpen) return prev;
          return shouldBeOpen;
        });

        // Only reset selection if documents changed
        if (filtered.length > 0) {
          setSelectedIndex(prev => {
            // Keep selection if still valid, otherwise reset to 0
            return prev < filtered.length ? prev : 0;
          });
        }
      } else {
        // Only close if currently open to prevent unnecessary state updates
        setIsOpen(prev => {
          if (!prev) return prev;
          return false;
        });
        setTriggerPosition(null);
        setFilteredDocuments([]);
      }
    };

    // Check if '@' was just typed - if so, detect immediately without debounce
    const lastChar = inputValue.length > 0 && cursorPosition > 0
      ? inputValue[cursorPosition - 1]
      : '';
    const isAtSymbol = lastChar === '@' || (lastChar === '-' && cursorPosition > 1 && inputValue[cursorPosition - 2] === '@');

    // If '@' was just typed, detect immediately, otherwise debounce
    if (isAtSymbol) {
      detectTrigger();
    } else {
      debounceTimerRef.current = setTimeout(detectTrigger, debounceMs);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue, cursorPosition, documents, maxResults, debounceMs, isOpen]);

  // Close autocomplete (defined before handleKeyDown to avoid initialization error)
  const close = useCallback(() => {
    setIsOpen(false);
    setTriggerPosition(null);
    setSelectedIndex(0);
  }, []);

  // Handle document selection
  const handleSelect = useCallback((index?: number) => {
    const idx = index !== undefined ? index : selectedIndex;

    if (idx >= 0 && idx < filteredDocuments.length && triggerPosition) {
      const selectedDoc = filteredDocuments[idx];
      onSelect(selectedDoc, triggerPosition);
      setIsOpen(false);
      setTriggerPosition(null);
    }
  }, [selectedIndex, filteredDocuments, triggerPosition, onSelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
    if (!isOpen || filteredDocuments.length === 0) {
      return false;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex(prev =>
          prev < filteredDocuments.length - 1 ? prev + 1 : 0
        );
        return true;

      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredDocuments.length - 1
        );
        return true;

      case 'Enter':
      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < filteredDocuments.length && triggerPosition) {
          e.preventDefault();
          e.stopPropagation();
          const selectedDoc = filteredDocuments[selectedIndex];
          onSelect(selectedDoc, triggerPosition);
          setIsOpen(false);
          setTriggerPosition(null);
          return true;
        }
        return false;

      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        close();
        return true;

      default:
        return false;
    }
  }, [isOpen, filteredDocuments, selectedIndex, triggerPosition, onSelect, close]);

  // Reset selected index when filtered documents change
  useEffect(() => {
    if (filteredDocuments.length > 0 && selectedIndex >= filteredDocuments.length) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setSelectedIndex(0);
      }, 0);
    }
  }, [filteredDocuments.length, selectedIndex]);

  return {
    isOpen,
    selectedIndex,
    filteredDocuments,
    triggerPosition,
    handleKeyDown,
    handleSelect,
    close
  };
}

