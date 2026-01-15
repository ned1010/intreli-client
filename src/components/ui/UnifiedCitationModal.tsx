'use client';

import { CitationData, SourceData } from '@/types/types';
import { Badge } from '@/components/ui/badge';
import { FileText, Layers } from 'lucide-react';

interface UnifiedCitationModalProps {
    citation: CitationData;
    source?: SourceData;
    allCitations?: CitationData[];
    responseType: 'single_document' | 'all_documents';
}

export function UnifiedCitationModal({
    citation,
    source,
    allCitations = [],
    responseType
}: UnifiedCitationModalProps) {
    // Get relevance text - prefer relevance_text (merged/structured), fallback to chunk_text
    // Backend may include relevance_text or chunk_text in citations
    const citationWithText = citation as CitationData & { relevance_text?: string; chunk_text?: string };
    const relevanceText = citationWithText.relevance_text 
        || citationWithText.chunk_text 
        || source?.chunk_text 
        || '';
    const displayText = relevanceText.length > 300 
        ? relevanceText.substring(0, 300) + '...' 
        : relevanceText;

    // Format relevance score for display
    const relevanceScore = citation.score ?? 0;
    const scoreDisplay = typeof relevanceScore === 'number' 
        ? (relevanceScore * 100).toFixed(1) + '%' 
        : 'N/A';

    return (
        <div className="space-y-3">
            {/* Document Name */}
            <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium truncate">{citation.pdf_name}</div>
            </div>
            
            {/* Page Number */}
            <div className="text-xs text-muted-foreground">
                Page {citation.page}
            </div>
            
            {/* Relevance Score */}
            <div className="text-xs text-muted-foreground">
                Relevance Score: {scoreDisplay}
            </div>
            
            {/* Relevance Text Section */}
            {displayText && (
                <div className="space-y-1 pt-2 border-t">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">
                        Relevance:
                    </div>
                    <div className="text-xs text-foreground leading-relaxed">
                        {displayText}
                    </div>
                </div>
            )}
        </div>
    );
}

