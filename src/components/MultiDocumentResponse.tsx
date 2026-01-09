'use client';

import { Badge } from '@/components/ui/badge';
import { DocumentSummaryCard } from '@/components/ui/DocumentSummaryCard';
import { Response } from '@/components/ui/shadcn-io/ai/response';
import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';
import { DocumentSummary, ChunkDetail } from '@/types/types';

interface MultiDocumentResponseProps {
    answer: string;
    documentSummaries: DocumentSummary[];
    totalDocuments: number;
    documentsAnalyzed: number;
    sources?: Array<{
        chunk_id?: string;
        pdf_name?: string;
        page?: number | string;
        score?: number;
    }>;
    onViewDocumentSources?: (documentId: string) => void;
}

export function MultiDocumentResponse({
    answer,
    documentSummaries,
    totalDocuments,
    documentsAnalyzed,
    sources = [],
    onViewDocumentSources
}: MultiDocumentResponseProps) {
    // Filter out documents with no meaningful summary
    const filteredSummaries =
        (documentSummaries || [])
            .filter((doc) => {
                if (!doc.summary) return false;
                const trimmed = doc.summary.trim();
                if (!trimmed) return false;
                // Hide documents explicitly marked as having no relevant information
                return !/no\s+relevant\s+information\s+found/i.test(trimmed);
            });

    // Group sources by document for filtering
    const sourcesByDocument = sources.reduce((acc, source) => {
        const docName = source.pdf_name || 'Unknown';
        if (!acc[docName]) {
            acc[docName] = [];
        }
        acc[docName].push(source);
        return acc;
    }, {} as Record<string, typeof sources>);

    return (
        <div className="space-y-4">
            {/* Response Type Badge */}
            <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    Multi-Document Response
                </Badge>
            </div>

            {/* Main Answer */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
                <Response>{answer}</Response>
            </div>

            {/* Document cards (only for documents with relevant summaries) */}
            {filteredSummaries && filteredSummaries.length > 0 && (
                <div className="space-y-3">
                    {filteredSummaries
                        .sort((a, b) => b.relevance_score - a.relevance_score)
                        .map((docSummary) => (
                            <DocumentSummaryCard
                                key={docSummary.document_id}
                                documentName={docSummary.document_name}
                                summary={docSummary.summary}
                                relevanceScore={docSummary.relevance_score}
                                chunksUsed={docSummary.chunks_used}
                                documentId={docSummary.document_id}
                                onViewSources={() => {
                                    if (onViewDocumentSources) {
                                        onViewDocumentSources(docSummary.document_id);
                                    }
                                }}
                            />
                        ))}
                </div>
            )}
        </div>
    );
}

