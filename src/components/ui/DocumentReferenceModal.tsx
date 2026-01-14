'use client';

import { CitationData, SourceData } from '@/types/types';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

interface DocumentReferenceModalProps {
    documentTitle: string;
    citations: CitationData[];
    sources?: SourceData[];
}

export function DocumentReferenceModal({
    documentTitle,
    citations,
    sources = []
}: DocumentReferenceModalProps) {
    // Create source lookup map
    const sourceMap = new Map<string, SourceData>();
    sources.forEach(source => {
        if (source.chunk_id) {
            sourceMap.set(source.chunk_id, source);
        }
    });

    // Extract unique pages and sort them
    const pages = Array.from(new Set(citations.map(c => c.page)))
        .map(p => {
            const pageNum = typeof p === 'string' ? parseInt(p, 10) : p;
            return isNaN(pageNum) ? 0 : pageNum;
        })
        .filter(p => p > 0)
        .sort((a, b) => a - b);

    // Group citations by page for structured display
    const citationsByPage = new Map<number | string, CitationData[]>();
    citations.forEach((citation) => {
        const page = citation.page;
        if (!citationsByPage.has(page)) {
            citationsByPage.set(page, []);
        }
        citationsByPage.get(page)!.push(citation);
    });

    return (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Document Title */}
            <div className="flex items-center gap-2 pb-2 border-b">
                <FileText className="h-4 w-4 text-primary" />
                <div className="text-sm font-semibold truncate">{documentTitle}</div>
            </div>

            {/* Pages Used */}
            {pages.length > 0 && (
                <div className="space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">
                        Pages Used:
                    </div>
                    <div className="text-xs text-foreground">
                        {pages.join(', ')}
                    </div>
                </div>
            )}

            {/* Structured Chunks List */}
            <div className="space-y-3 pt-2 border-t">
                <div className="text-xs font-semibold text-muted-foreground uppercase">
                    Relevant Chunks:
                </div>
                <div className="space-y-3">
                    {Array.from(citationsByPage.entries())
                        // Sort pages numerically
                        .sort(([pageA], [pageB]) => {
                            const numA = typeof pageA === 'string' ? parseInt(pageA, 10) : pageA;
                            const numB = typeof pageB === 'string' ? parseInt(pageB, 10) : pageB;
                            return (isNaN(numA) ? 0 : numA) - (isNaN(numB) ? 0 : numB);
                        })
                        .map(([page, pageCitations]) => {
                            // Within each page, sort citations by numeric label if available
                            const sortedCitations = [...pageCitations].sort((a, b) => {
                                const getLabelNum = (c: CitationData) => {
                                    if (!c.label) return Number.MAX_SAFE_INTEGER;
                                    const numStr = c.label.replace('[', '').replace(']', '').trim();
                                    const num = parseInt(numStr, 10);
                                    return isNaN(num) ? Number.MAX_SAFE_INTEGER : num;
                                };
                                return getLabelNum(a) - getLabelNum(b);
                            });

                            return sortedCitations.map((citation, idx) => {
                                // Get relevance text (prefer relevance_text, fallback to chunk_text from source)
                                const citationWithText = citation as CitationData & { relevance_text?: string; chunk_text?: string };
                                const source = citation.chunk_id ? sourceMap.get(citation.chunk_id) : null;
                                const relevanceText = citationWithText.relevance_text 
                                    || citationWithText.chunk_text 
                                    || source?.chunk_text 
                                    || '';

                                // Truncate if too long
                                const displayText = relevanceText.length > 400
                                    ? relevanceText.substring(0, 400) + '...'
                                    : relevanceText;

                                return (
                                    <div key={`${page}-${idx}`} className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="secondary">Page {citation.page}</Badge>
                                            {citation.score !== undefined && (
                                                <Badge variant="outline" className="text-xs">
                                                    Score: {(citation.score * 100).toFixed(1)}%
                                                </Badge>
                                            )}
                                            {citation.label && (
                                                <Badge variant="outline" className="text-xs">
                                                    {citation.label}
                                                </Badge>
                                            )}
                                        </div>
                                        {displayText && (
                                            <div className="text-xs text-foreground leading-relaxed pt-1">
                                                {displayText}
                                            </div>
                                        )}
                                    </div>
                                );
                            });
                        })}
                </div>
            </div>
        </div>
    );
}

