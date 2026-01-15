'use client';

import { useEffect, useRef } from 'react';
import { Document } from '@/types/types';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentAutocompleteProps {
  isOpen: boolean;
  documents: Document[];
  selectedIndex: number;
  triggerPosition: { start: number; end: number; query: string } | null;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onSelect: (index: number) => void;
  onClose: () => void;
}

export function DocumentAutocomplete({
  isOpen,
  documents,
  selectedIndex,
  triggerPosition,
  textareaRef,
  onSelect,
  onClose
}: DocumentAutocompleteProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  // Calculate dropdown position - use requestAnimationFrame to prevent shaking
  useEffect(() => {
    if (!isOpen || !textareaRef.current || !dropdownRef.current || !triggerPosition) {
      return;
    }

    let rafId: number | null = null;
    let positionUpdateTimeout: NodeJS.Timeout | null = null;

    const updatePosition = () => {
      const textarea = textareaRef.current;
      const dropdown = dropdownRef.current;
      
      if (!textarea || !dropdown) return;
      
      // Get textarea position (using getBoundingClientRect for viewport coordinates)
      const textareaRect = textarea.getBoundingClientRect();
      
      // Calculate approximate cursor position
      // This is a simplified calculation - for more accuracy, we'd need to measure text
      const textBeforeCursor = textarea.value.substring(0, triggerPosition.end);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines.length - 1;
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
      
      // Estimate cursor position in viewport coordinates (for fixed positioning)
      const cursorX = textareaRect.left + 12; // Padding from left edge of textarea
      const cursorY = textareaRect.top + (currentLine * lineHeight) + lineHeight;
      
      // Position dropdown (using fixed positioning relative to viewport)
      dropdown.style.position = 'fixed';
      dropdown.style.left = `${cursorX}px`;
      dropdown.style.top = `${cursorY}px`;
      
      // Force a reflow to get accurate dimensions
      void dropdown.offsetHeight;
      
      // Adjust if dropdown would go off-screen
      const dropdownRect = dropdown.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 10;
      
      // Adjust horizontal position
      let finalLeft = cursorX;
      if (dropdownRect.right > viewportWidth - padding) {
        finalLeft = viewportWidth - dropdownRect.width - padding;
      }
      if (finalLeft < padding) {
        finalLeft = padding;
      }
      
      // Adjust vertical position (show above if near bottom)
      let finalTop = cursorY;
      if (dropdownRect.bottom > viewportHeight - padding) {
        finalTop = cursorY - dropdownRect.height - lineHeight;
      }
      if (finalTop < padding) {
        finalTop = padding;
      }
      
      // Only update if position actually changed to prevent shaking
      const currentLeft = dropdown.style.left;
      const currentTop = dropdown.style.top;
      const newLeft = `${finalLeft}px`;
      const newTop = `${finalTop}px`;
      
      if (currentLeft !== newLeft || currentTop !== newTop) {
        dropdown.style.left = newLeft;
        dropdown.style.top = newTop;
      }
    };

    // Use requestAnimationFrame for smooth positioning
    const scheduleUpdate = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        updatePosition();
      });
    };

    // Initial position
    scheduleUpdate();
    
    // Debounce position updates on scroll and resize
    const handleScroll = () => {
      if (positionUpdateTimeout) {
        clearTimeout(positionUpdateTimeout);
      }
      positionUpdateTimeout = setTimeout(scheduleUpdate, 16); // ~60fps
    };

    const handleResize = () => {
      if (positionUpdateTimeout) {
        clearTimeout(positionUpdateTimeout);
      }
      positionUpdateTimeout = setTimeout(scheduleUpdate, 16);
    };
    
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (positionUpdateTimeout) {
        clearTimeout(positionUpdateTimeout);
      }
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, textareaRef, triggerPosition]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  // Close on outside click (removed blur handler to prevent premature closing)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Use setTimeout to allow click events to complete first
      setTimeout(() => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          textareaRef.current &&
          !textareaRef.current.contains(event.target as Node) &&
          document.activeElement !== textareaRef.current
        ) {
          onClose();
        }
      }, 0);
    };

    // Use capture phase to catch events before they bubble
    document.addEventListener('mousedown', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen, onClose, textareaRef]);

  if (!isOpen) {
    return null;
  }

  // Debug: Log when component renders
  console.log('DocumentAutocomplete rendering:', {
    isOpen,
    documentsCount: documents.length,
    selectedIndex,
    hasTriggerPosition: !!triggerPosition
  });

  return (
    <div
      ref={dropdownRef}
      className={cn(
        'z-50 min-w-[280px] max-w-[400px] max-h-[300px]',
        'overflow-hidden rounded-lg border bg-popover shadow-lg',
        'animate-in fade-in-0 zoom-in-95',
        'flex flex-col',
        'fixed' // Use fixed positioning instead of absolute for better reliability
      )}
      style={{
        // Will be positioned by useEffect
      }}
      role="listbox"
      aria-label="Document suggestions"
    >
      {documents.length === 0 ? (
        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
          {triggerPosition?.query ? (
            <>No documents match &apos;{triggerPosition.query}&apos;</>
          ) : (
            <>No documents available</>
          )}
        </div>
      ) : (
        <div className="overflow-y-auto overflow-x-hidden p-1">
          {documents.map((doc, index) => {
            const isSelected = index === selectedIndex;
            return (
              <div
                key={doc.id}
                ref={isSelected ? selectedItemRef : null}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer',
                  'transition-colors',
                  isSelected
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                )}
                onClick={() => onSelect(index)}
                role="option"
                aria-selected={isSelected}
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {doc.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                    {doc.createdAt && (
                      <> • {new Date(doc.createdAt).toLocaleDateString()}</>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

