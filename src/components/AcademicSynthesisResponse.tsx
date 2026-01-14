'use client';

import { CitationData, SourceData } from '@/types/types';
import { MarkdownWithCitations } from '@/components/MarkdownWithCitations';

interface AcademicSynthesisResponseProps {
    answer: string;
    citations: CitationData[];
    sources?: SourceData[];
    responseType?: 'single_document' | 'all_documents';
}

export function AcademicSynthesisResponse({
    answer,
    citations,
    sources,
    responseType = 'single_document'
}: AcademicSynthesisResponseProps) {
    return (
        <MarkdownWithCitations
            answer={answer}
            citations={citations}
            sources={sources}
            responseType={responseType}
        />
    );
}

