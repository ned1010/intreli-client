'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DocumentSummaryCardProps {
    documentName: string;
    summary: string;
    relevanceScore: number;
    chunksUsed: number;
    documentId?: string;
    onViewSources?: () => void;
}

export function DocumentSummaryCard({
    documentName,
    summary,
    relevanceScore,
    chunksUsed,
    documentId,
    onViewSources
}: DocumentSummaryCardProps) {
    // Note: relevanceScore, chunksUsed, and documentId are kept for future use
    void relevanceScore;
    void chunksUsed;
    void documentId;
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="border rounded-lg bg-card hover:bg-accent/50 transition-colors">
            {/* Header */}
            <div
                className="flex items-start justify-between p-4 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <h4 className="font-semibold text-sm truncate">{documentName}</h4>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                >
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Summary (always visible, truncated when collapsed) */}
            <div className="px-4 pb-2">
                <p className={cn(
                    "text-sm text-muted-foreground",
                    !isExpanded && "line-clamp-2"
                )}>
                    {summary || 'No summary available.'}
                </p>
            </div>

            {/* Expanded content with animation */}
            <div
                className={cn(
                    "overflow-hidden transition-all duration-200 ease-in-out",
                    isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                )}
            >
                {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t pt-4 mt-2">
                        {/* Full summary */}
                        <div>
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                                {summary || 'No summary available.'}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {onViewSources && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onViewSources();
                                    }}
                                    className="text-xs"
                                >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View Sources
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

