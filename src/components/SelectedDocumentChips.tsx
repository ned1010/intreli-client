'use client';

import { Document } from '@/types/types';
import { Badge } from '@/components/ui/badge';
import { X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectedDocumentChipsProps {
  documents: Document[];
  onRemove: (documentId: string | number) => void;
  className?: string;
}

export function SelectedDocumentChips({
  documents,
  onRemove,
  className
}: SelectedDocumentChipsProps) {
  if (documents.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2 p-2', className)}>
      {documents.map((doc) => (
        <Badge
          key={doc.id}
          variant="secondary"
          className="flex items-center gap-1.5 px-2 py-1 pr-1 text-sm font-medium"
        >
          <FileText className="h-3 w-3" />
          <span className="max-w-[200px] truncate">{doc.name}</span>
          <button
            type="button"
            onClick={() => onRemove(doc.id)}
            className="ml-1 rounded-full hover:bg-accent p-0.5 transition-colors"
            aria-label={`Remove ${doc.name}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

