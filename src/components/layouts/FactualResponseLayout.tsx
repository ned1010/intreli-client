'use client';

import { MarkdownResponse } from '@/components/MarkdownResponse';
import { CitationData, SourceData } from '@/types/types';

interface FactualResponseLayoutProps {
  answer: string;
  citations: CitationData[];
  sources?: SourceData[];
}

export function FactualResponseLayout({
  answer,
  citations,
  sources,
}: FactualResponseLayoutProps) {
  return (
    <div className="space-y-2">
      <MarkdownResponse
        answer={answer}
        citations={citations}
        sources={sources}
        responseType="single_document"
      />
    </div>
  );
}


