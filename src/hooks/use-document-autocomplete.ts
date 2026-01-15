'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Document } from '@/types/types';
import { documentCache } from '@/lib/cache';

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
const DEFAULT_DEBOUNCE_MS = 100; // Reduced for faster response (adaptive debouncing will handle this)

// Cache configuration
const CACHE_VERSION = '1.0.0';
const QUERY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAPPING_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const MAX_QUERY_CACHE_SIZE = 100;

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

  // In-memory caches
  const nameToIdMapRef = useRef<Map<string, string>>(new Map()); // lowercase name -> id
  const idToDocumentMapRef = useRef<Map<string, Document>>(new Map()); // id -> document (for resolution)
  const queryCacheRef = useRef<Map<string, string[]>>(new Map()); // query -> document IDs
  const cacheTimestampsRef = useRef<Map<string, number>>(new Map()); // query -> timestamp

  // Build name-to-ID mapping and ID-to-document mapping
  useEffect(() => {
    const nameMap = new Map<string, string>();
    const idMap = new Map<string, Document>();

    documents.forEach(doc => {
      const lowerName = doc.name.toLowerCase();
      const docId = String(doc.id);

      // Store name -> ID mapping
      nameMap.set(lowerName, docId);

      // Store ID -> Document mapping for resolution
      idMap.set(docId, doc);
    });

    nameToIdMapRef.current = nameMap;
    idToDocumentMapRef.current = idMap;

    // Clear query cache when documents change
    queryCacheRef.current.clear();
    cacheTimestampsRef.current.clear();

    // Try to load from localStorage
    const userId = documents[0]?.userId || 'default';
    const cachedMapping = documentCache.get<{ [name: string]: string }>(
      `mapping-${userId}`,
      { ttl: MAPPING_CACHE_TTL, version: CACHE_VERSION }
    );

    if (cachedMapping) {
      // Merge cached mapping with current documents
      Object.entries(cachedMapping).forEach(([name, id]) => {
        if (!nameMap.has(name.toLowerCase())) {
          nameMap.set(name.toLowerCase(), id);
        }
      });
      // Update ref with merged mapping
      nameToIdMapRef.current = nameMap;
    }

    // Save mapping to localStorage
    const mappingObj: { [name: string]: string } = {};
    nameMap.forEach((id, name) => {
      mappingObj[name] = id;
    });
    documentCache.set(
      `mapping-${userId}`,
      mappingObj,
      { ttl: MAPPING_CACHE_TTL, version: CACHE_VERSION }
    );
  }, [documents]);

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

        // Check query cache first
        const cacheKey = query.toLowerCase();
        let filteredIds: string[] | null = null;

        // Check in-memory cache
        if (queryCacheRef.current.has(cacheKey)) {
          const timestamp = cacheTimestampsRef.current.get(cacheKey) || 0;
          const now = Date.now();
          if (now - timestamp < QUERY_CACHE_TTL) {
            filteredIds = queryCacheRef.current.get(cacheKey) || null;
          } else {
            // Expired, remove from cache
            queryCacheRef.current.delete(cacheKey);
            cacheTimestampsRef.current.delete(cacheKey);
          }
        }

        // Check localStorage cache if not in memory
        if (!filteredIds) {
          const userId = documents[0]?.userId || 'default';
          const cached = documentCache.get<string[]>(
            `${userId}-${cacheKey}`,
            { ttl: QUERY_CACHE_TTL, version: CACHE_VERSION }
          );
          if (cached) {
            filteredIds = cached;
            // Store in memory cache
            queryCacheRef.current.set(cacheKey, filteredIds);
            cacheTimestampsRef.current.set(cacheKey, Date.now());
          }
        }

        let filtered: Document[];

        if (filteredIds) {
          // Resolve IDs to documents
          filtered = filteredIds
            .map(id => idToDocumentMapRef.current.get(id))
            .filter((doc): doc is Document => doc !== undefined)
            .slice(0, maxResults);
        } else {
          // Filter documents using name-to-ID map for fast lookup
          const queryLower = query.toLowerCase();
          const nameMap = nameToIdMapRef.current;
          const matchingIds: string[] = [];

          if (!query) {
            // No query - return all document IDs
            nameMap.forEach((id) => {
              matchingIds.push(id);
            });
          } else {
            // Filter by query
            nameMap.forEach((id, name) => {
              if (name.includes(queryLower)) {
                matchingIds.push(id);
              }
            });
          }

          // Sort by relevance (exact match > starts with > contains)
          matchingIds.sort((id1, id2) => {
            const doc1 = idToDocumentMapRef.current.get(id1);
            const doc2 = idToDocumentMapRef.current.get(id2);
            if (!doc1 || !doc2) return 0;

            const name1 = doc1.name.toLowerCase();
            const name2 = doc2.name.toLowerCase();

            // Exact match first
            if (name1 === queryLower && name2 !== queryLower) return -1;
            if (name2 === queryLower && name1 !== queryLower) return 1;

            // Starts with second
            const starts1 = name1.startsWith(queryLower);
            const starts2 = name2.startsWith(queryLower);
            if (starts1 && !starts2) return -1;
            if (starts2 && !starts1) return 1;

            // Contains last
            return 0;
          });

          // Limit results
          const limitedIds = matchingIds.slice(0, maxResults);

          // Resolve IDs to documents
          filtered = limitedIds
            .map(id => idToDocumentMapRef.current.get(id))
            .filter((doc): doc is Document => doc !== undefined);

          // Cache the result
          queryCacheRef.current.set(cacheKey, limitedIds);
          cacheTimestampsRef.current.set(cacheKey, Date.now());

          // Save to localStorage
          const userId = documents[0]?.userId || 'default';
          documentCache.set(
            `${userId}-${cacheKey}`,
            limitedIds,
            { ttl: QUERY_CACHE_TTL, version: CACHE_VERSION }
          );

          // Limit cache size
          if (queryCacheRef.current.size > MAX_QUERY_CACHE_SIZE) {
            // Remove oldest entries
            const entries = Array.from(cacheTimestampsRef.current.entries())
              .sort((a, b) => a[1] - b[1])
              .slice(0, queryCacheRef.current.size - MAX_QUERY_CACHE_SIZE);

            entries.forEach(([key]) => {
              queryCacheRef.current.delete(key);
              cacheTimestampsRef.current.delete(key);
            });
          }
        }

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

    // Adaptive debouncing: instant for '@', shorter for query changes
    const lastChar = inputValue.length > 0 && cursorPosition > 0
      ? inputValue[cursorPosition - 1]
      : '';
    const isAtSymbol = lastChar === '@' || (lastChar === '-' && cursorPosition > 1 && inputValue[cursorPosition - 2] === '@');

    // If '@' was just typed, detect immediately (no debounce)
    // If query is empty, show immediately (no debounce)
    // Otherwise use adaptive debounce (shorter for query changes)
    if (isAtSymbol) {
      detectTrigger();
    } else {
      const textBeforeCursor = inputValue.substring(0, Math.min(Math.max(0, cursorPosition), inputValue.length));
      const triggerMatch = textBeforeCursor.match(/@-?([\w\s.-]*)$/);
      const currentQuery = triggerMatch ? triggerMatch[1] : '';

      // Empty query - show immediately
      if (currentQuery === '') {
        detectTrigger();
      } else {
        // Use shorter debounce for query changes (50-100ms)
        const adaptiveDebounce = Math.min(debounceMs, 100);
        debounceTimerRef.current = setTimeout(detectTrigger, adaptiveDebounce);
      }
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

