'use client';

import { useRef, useEffect, useState, useCallback, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Document } from '@/types/types';

interface DocumentTag {
  start: number;
  end: number;
  name: string;
  fullText: string; // e.g., "@-document_name"
  documentId?: string;
}

interface DocumentTagInputProps {
  value: string;
  onChange: (value: string) => void;
  onCursorPositionChange?: (position: number) => void;
  onAutocompleteKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
  documents?: Document[]; // List of available documents to verify tags
}

export function DocumentTagInput({
  value,
  onChange,
  onCursorPositionChange,
  onAutocompleteKeyDown,
  placeholder = 'What would you like to know?',
  disabled = false,
  className,
  containerRef: externalContainerRef,
  documents = []
}: DocumentTagInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = externalContainerRef || internalContainerRef;
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectionStart, setSelectionStart] = useState(0);

  // Parse document tags from value - only include tags that match actual documents
  const parseDocumentTags = useCallback((text: string): DocumentTag[] => {
    const tags: DocumentTag[] = [];
    const regex = /@-([^\s]+)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const tagName = match[1];
      // Only include tags that match actual document names
      const matchingDoc = documents.find(doc =>
        doc.name.toLowerCase() === tagName.toLowerCase() ||
        doc.name.toLowerCase().includes(tagName.toLowerCase())
      );

      if (matchingDoc) {
        tags.push({
          start: match.index,
          end: match.index + match[0].length,
          name: tagName,
          fullText: match[0],
          documentId: String(matchingDoc.id)
        });
      }
    }

    return tags;
  }, [documents]);

  const documentTags = parseDocumentTags(value);

  // Handle backspace to delete entire document tag
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle autocomplete keyboard events first
    if (onAutocompleteKeyDown && onAutocompleteKeyDown(e)) {
      return;
    }

    const textarea = e.currentTarget;
    const cursorPos = textarea.selectionStart;

    // Handle backspace to delete entire document tag
    if (e.key === 'Backspace' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      // Find if cursor is at the start or inside a document tag
      const tagAtCursor = documentTags.find(
        tag => cursorPos > tag.start && cursorPos <= tag.end
      );

      if (tagAtCursor) {
        e.preventDefault();
        // Delete the entire tag
        const beforeTag = value.substring(0, tagAtCursor.start);
        const afterTag = value.substring(tagAtCursor.end);
        const newValue = beforeTag + afterTag;
        onChange(newValue);

        // Set cursor position after deletion
        setTimeout(() => {
          if (textareaRef.current) {
            const newCursorPos = tagAtCursor.start;
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            setCursorPosition(newCursorPos);
            if (onCursorPositionChange) {
              onCursorPositionChange(newCursorPos);
            }
          }
        }, 0);
        return;
      }

      // Check if cursor is right after a tag (delete the tag)
      const tagBeforeCursor = documentTags.find(
        tag => cursorPos === tag.end
      );

      if (tagBeforeCursor) {
        e.preventDefault();
        const beforeTag = value.substring(0, tagBeforeCursor.start);
        const afterTag = value.substring(tagBeforeCursor.end);
        const newValue = beforeTag + afterTag;
        onChange(newValue);

        setTimeout(() => {
          if (textareaRef.current) {
            const newCursorPos = tagBeforeCursor.start;
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            setCursorPosition(newCursorPos);
            if (onCursorPositionChange) {
              onCursorPositionChange(newCursorPos);
            }
          }
        }, 0);
        return;
      }
    }

    // Handle Enter key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = textarea.form;
      if (form) {
        form.requestSubmit();
      }
      return;
    }

    // Update cursor position for other keys
    if (onCursorPositionChange) {
      setTimeout(() => {
        if (textareaRef.current) {
          const pos = textareaRef.current.selectionStart;
          setCursorPosition(pos);
          onCursorPositionChange(pos);
        }
      }, 0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (onCursorPositionChange) {
      const pos = e.target.selectionStart;
      setCursorPosition(pos);
      onCursorPositionChange(pos);
    }
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const pos = e.currentTarget.selectionStart;
    setCursorPosition(pos);
    setSelectionStart(pos);
    if (onCursorPositionChange) {
      onCursorPositionChange(pos);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = textareaRef.current.selectionStart;
        setCursorPosition(pos);
        if (onCursorPositionChange) {
          onCursorPositionChange(pos);
        }
      }
    }, 0);
  };


  // Expose textarea ref for external access (for autocomplete positioning)
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).textareaRef = textareaRef;
    }
  }, []);

  // Render text with inline chips for verified document tags only
  const renderTextWithChips = () => {
    if (!value) return null;

    const parts: Array<{ text: string; isTag: boolean; tagName?: string }> = [];
    let lastIndex = 0;

    // Sort tags by start position
    const sortedTags = [...documentTags].sort((a, b) => a.start - b.start);

    sortedTags.forEach(tag => {
      // Add text before tag
      if (tag.start > lastIndex) {
        parts.push({
          text: value.substring(lastIndex, tag.start),
          isTag: false
        });
      }

      // Add tag
      parts.push({
        text: tag.fullText,
        isTag: true,
        tagName: tag.name
      });

      lastIndex = tag.end;
    });

    // Add remaining text
    if (lastIndex < value.length) {
      parts.push({
        text: value.substring(lastIndex),
        isTag: false
      });
    }

    return parts.map((part, index) => {
      if (part.isTag) {
        return (
          <span
            key={`tag-${index}`}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md',
              'bg-primary/15 text-primary border border-primary/30',
              'font-medium text-sm',
              'mx-0.5 my-0.5',
              'shadow-sm'
            )}
            contentEditable={false}
            data-tag={part.tagName}
          >
            {part.text}
          </span>
        );
      }
      // Preserve whitespace and newlines
      return (
        <span key={`text-${index}`} style={{ whiteSpace: 'pre-wrap' }}>
          {part.text}
        </span>
      );
    });
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Overlay showing formatted text with chips - only for verified document tags */}
      <div
        className={cn(
          'w-full min-h-[48px] p-3 rounded-none',
          'pointer-events-none',
          'whitespace-pre-wrap break-words',
          'text-base md:text-sm',
          'relative z-0'
        )}
        style={{
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit',
          padding: 'inherit',
          minHeight: 'inherit'
        }}
      >
        {value ? (
          renderTextWithChips()
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </div>

      {/* Textarea for actual input */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        placeholder=""
        disabled={disabled}
        className={cn(
          'w-full resize-none rounded-none border-none p-3 shadow-none outline-none ring-0',
          'field-sizing-content max-h-[6lh] bg-transparent dark:bg-transparent',
          'focus-visible:ring-0',
          'absolute inset-0 z-10',
          'text-transparent caret-foreground'
        )}
        style={{
          color: 'transparent',
          WebkitTextFillColor: 'transparent',
          background: 'transparent'
        }}
      />
    </div>
  );
}

