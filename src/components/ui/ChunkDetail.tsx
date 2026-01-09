'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChunkDetail as ChunkDetailType } from '@/types/types';

interface ChunkDetailProps {
  chunk: ChunkDetailType;
  index: number;
  onViewSource?: () => void;
}

export function ChunkDetail({ chunk, index, onViewSource }: ChunkDetailProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (chunk.full_text) {
      await navigator.clipboard.writeText(chunk.full_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="border-l-2 border-primary/30 pl-3 py-2 space-y-2 bg-muted/20 hover:bg-muted/40 rounded-r-md transition-colors">
      {/* Header with page and score */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Chunk {index + 1}
          </span>
          <Badge variant="outline" className="text-xs">
            Page {chunk.page}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Score: {chunk.score.toFixed(2)}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {chunk.full_text && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleCopy}
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Excerpt (always visible) */}
      <div>
        <p className={cn(
          "text-sm text-foreground",
          !isExpanded && "line-clamp-2"
        )}>
          {chunk.excerpt || chunk.full_text || 'No content available.'}
        </p>
      </div>

      {/* Expanded full text */}
      {isExpanded && chunk.full_text && (
        <div className="space-y-2 pt-2 border-t">
          <div>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {chunk.full_text}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {chunk.source_data && (
              <div className="text-xs text-muted-foreground">
                Source: {chunk.source_data.pdf_name} - Page {chunk.source_data.page}
                {chunk.source_data.label && ` ${chunk.source_data.label}`}
              </div>
            )}
            {onViewSource && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewSource}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Source
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Copy confirmation */}
      {copied && (
        <div className="text-xs text-green-600 dark:text-green-400">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}

