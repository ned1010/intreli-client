'use client';

import { Response } from '@/components/ui/shadcn-io/ai/response';
import { CitationData, SourceData } from '@/types/types';
import { AcademicSynthesisResponse } from '@/components/AcademicSynthesisResponse';

interface MarkdownResponseProps {
    answer: string;
    citations: CitationData[];
    sources?: SourceData[];
    responseType?: 'single_document' | 'all_documents';
}

/**
 * Thin wrapper around the existing AcademicSynthesisResponse so that
 * all assistant answers flow through a single markdown + citation‑aware
 * renderer. AcademicSynthesisResponse already:
 * - Parses [N] / [N, M] citation markers from the answer text
 * - Renders badges + hover cards wired to citations and sources
 * We rely on the shadcn-io Response component it uses internally to
 * render markdown (bold, lists, headers, tables, etc.).
 */
export function MarkdownResponse({
    answer,
    citations,
    sources,
    responseType = 'single_document',
}: MarkdownResponseProps) {
    // For now we delegate entirely to AcademicSynthesisResponse.
    // If we ever need raw markdown without the reference section,
    // we can introduce a direct <Response> branch here.
    return (
        <AcademicSynthesisResponse
            answer={answer}
            citations={citations}
            sources={sources}
            responseType={responseType}
        />
    );
}


