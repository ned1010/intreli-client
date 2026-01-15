'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ChatStatus } from 'ai';
import { Loader2Icon, SendIcon, SquareIcon, XIcon } from 'lucide-react';
import React, { type ComponentProps, type HTMLAttributes, type KeyboardEventHandler, Children } from 'react';

export type PromptInputProps = HTMLAttributes<HTMLFormElement>;

export const PromptInput = ({ className, ...props }: PromptInputProps) => (
  <form
    className={cn(
      'w-full divide-y overflow-hidden rounded-xl border bg-background shadow-sm',
      className
    )}
    {...props}
  />
);

export type PromptInputTextareaProps = ComponentProps<typeof Textarea> & {
  minHeight?: number;
  maxHeight?: number;
  onCursorPositionChange?: (position: number) => void;
  onAutocompleteKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
  documents?: Array<{ id: string | number; name: string }>; // For document tag detection
};

export const PromptInputTextarea = React.forwardRef<HTMLTextAreaElement, PromptInputTextareaProps>(({
  onChange,
  className,
  placeholder = 'What would you like to know?',
  minHeight = 48,
  maxHeight = 164,
  onCursorPositionChange,
  onAutocompleteKeyDown,
  documents = [],
  ...props
}, ref) => {
  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    // Handle autocomplete keyboard events first
    if (onAutocompleteKeyDown && onAutocompleteKeyDown(e)) {
      return; // Autocomplete handled the event
    }

    // Handle backspace to delete entire document tags
    if (e.key === 'Backspace' && !e.shiftKey && !e.ctrlKey && !e.metaKey && documents.length > 0) {
      const textarea = e.currentTarget;
      const cursorPos = textarea.selectionStart;
      const value = textarea.value;

      // Find document tags in the text
      const tagRegex = /@-([^\s]+)/g;
      let match;
      const tags: Array<{ start: number; end: number; fullText: string }> = [];

      while ((match = tagRegex.exec(value)) !== null) {
        const tagName = match[1];
        // Check if this tag matches an actual document
        const matchingDoc = documents.find(doc =>
          doc.name.toLowerCase() === tagName.toLowerCase() ||
          doc.name.toLowerCase().includes(tagName.toLowerCase())
        );

        if (matchingDoc) {
          tags.push({
            start: match.index,
            end: match.index + match[0].length,
            fullText: match[0]
          });
        }
      }

      // Check if cursor is inside or at the end of a document tag
      const tagAtCursor = tags.find(
        tag => cursorPos > tag.start && cursorPos <= tag.end
      );

      if (tagAtCursor) {
        e.preventDefault();
        // Delete the entire tag
        const beforeTag = value.substring(0, tagAtCursor.start);
        const afterTag = value.substring(tagAtCursor.end);
        const newValue = beforeTag + afterTag;

        // Update the value
        if (onChange) {
          const syntheticEvent = {
            target: { value: newValue, selectionStart: tagAtCursor.start, selectionEnd: tagAtCursor.start }
          } as React.ChangeEvent<HTMLTextAreaElement>;
          onChange(syntheticEvent);
        }

        // Set cursor position after deletion
        setTimeout(() => {
          if (textarea) {
            textarea.setSelectionRange(tagAtCursor.start, tagAtCursor.start);
            if (onCursorPositionChange) {
              onCursorPositionChange(tagAtCursor.start);
            }
          }
        }, 0);
        return;
      }

      // Check if cursor is right after a tag (delete the tag)
      const tagBeforeCursor = tags.find(
        tag => cursorPos === tag.end
      );

      if (tagBeforeCursor) {
        e.preventDefault();
        const beforeTag = value.substring(0, tagBeforeCursor.start);
        const afterTag = value.substring(tagBeforeCursor.end);
        const newValue = beforeTag + afterTag;

        if (onChange) {
          const syntheticEvent = {
            target: { value: newValue, selectionStart: tagBeforeCursor.start, selectionEnd: tagBeforeCursor.start }
          } as React.ChangeEvent<HTMLTextAreaElement>;
          onChange(syntheticEvent);
        }

        setTimeout(() => {
          if (textarea) {
            textarea.setSelectionRange(tagBeforeCursor.start, tagBeforeCursor.start);
            if (onCursorPositionChange) {
              onCursorPositionChange(tagBeforeCursor.start);
            }
          }
        }, 0);
        return;
      }
    }

    // Cursor position is tracked in onChange handler, no need to duplicate here
    // This reduces redundant state updates and improves typing performance

    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow newline
        return;
      }

      // Submit on Enter (without Shift)
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Track cursor position immediately - this is critical for '@' detection
    if (onCursorPositionChange) {
      // Get cursor position immediately from the event
      const cursorPos = e.target.selectionStart;
      onCursorPositionChange(cursorPos);
    }
    onChange?.(e);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    // Track cursor position on selection change
    if (onCursorPositionChange) {
      onCursorPositionChange(e.currentTarget.selectionStart);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    // Track cursor position on click
    if (onCursorPositionChange) {
      setTimeout(() => {
        if (e.currentTarget) {
          onCursorPositionChange(e.currentTarget.selectionStart);
        }
      }, 0);
    }
  };

  return (
    <Textarea
      ref={ref}
      className={cn(
        'w-full resize-none rounded-none border-none p-3 shadow-none outline-none ring-0',
        'field-sizing-content max-h-[6lh] bg-transparent dark:bg-transparent',
        'focus-visible:ring-0',
        className
      )}
      name="message"
      onChange={handleChange}
      onSelect={handleSelect}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      placeholder={placeholder}
      {...props}
    />
  );
});

PromptInputTextarea.displayName = 'PromptInputTextarea';

export type PromptInputToolbarProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputToolbar = ({
  className,
  ...props
}: PromptInputToolbarProps) => (
  <div
    className={cn('flex items-center justify-between p-1', className)}
    {...props}
  />
);

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTools = ({
  className,
  ...props
}: PromptInputToolsProps) => (
  <div
    className={cn(
      'flex items-center gap-1',
      '[&_button:first-child]:rounded-bl-xl',
      className
    )}
    {...props}
  />
);

export type PromptInputButtonProps = ComponentProps<typeof Button>;

export const PromptInputButton = ({
  variant = 'ghost',
  className,
  size,
  ...props
}: PromptInputButtonProps) => {
  const newSize =
    (size ?? Children.count(props.children) > 1) ? 'default' : 'icon';

  return (
    <Button
      className={cn(
        'shrink-0 gap-1.5 rounded-lg',
        variant === 'ghost' && 'text-muted-foreground',
        newSize === 'default' && 'px-3',
        className
      )}
      size={newSize}
      type="button"
      variant={variant}
      {...props}
    />
  );
};

export type PromptInputSubmitProps = ComponentProps<typeof Button> & {
  status?: ChatStatus;
};

export const PromptInputSubmit = ({
  className,
  variant = 'default',
  size = 'icon',
  status,
  children,
  ...props
}: PromptInputSubmitProps) => {
  let Icon = <SendIcon className="size-4" />;

  if (status === 'submitted') {
    Icon = <Loader2Icon className="size-4 animate-spin" />;
  } else if (status === 'streaming') {
    Icon = <SquareIcon className="size-4" />;
  } else if (status === 'error') {
    Icon = <XIcon className="size-4" />;
  }

  return (
    <Button
      className={cn('gap-1.5 rounded-lg', className)}
      size={size}
      type="submit"
      variant={variant}
      {...props}
    >
      {children ?? Icon}
    </Button>
  );
};

export type PromptInputModelSelectProps = ComponentProps<typeof Select>;

export const PromptInputModelSelect = (props: PromptInputModelSelectProps) => (
  <Select {...props} />
);

export type PromptInputModelSelectTriggerProps = ComponentProps<
  typeof SelectTrigger
>;

export const PromptInputModelSelectTrigger = ({
  className,
  ...props
}: PromptInputModelSelectTriggerProps) => (
  <SelectTrigger
    className={cn(
      'border-none bg-transparent font-medium text-muted-foreground shadow-none transition-colors',
      'hover:bg-accent hover:text-foreground [&[aria-expanded="true"]]:bg-accent [&[aria-expanded="true"]]:text-foreground',
      className
    )}
    {...props}
  />
);

export type PromptInputModelSelectContentProps = ComponentProps<
  typeof SelectContent
>;

export const PromptInputModelSelectContent = ({
  className,
  ...props
}: PromptInputModelSelectContentProps) => (
  <SelectContent className={cn(className)} {...props} />
);

export type PromptInputModelSelectItemProps = ComponentProps<typeof SelectItem>;

export const PromptInputModelSelectItem = ({
  className,
  ...props
}: PromptInputModelSelectItemProps) => (
  <SelectItem className={cn(className)} {...props} />
);

export type PromptInputModelSelectValueProps = ComponentProps<
  typeof SelectValue
>;

export const PromptInputModelSelectValue = ({
  className,
  ...props
}: PromptInputModelSelectValueProps) => (
  <SelectValue className={cn(className)} {...props} />
);
