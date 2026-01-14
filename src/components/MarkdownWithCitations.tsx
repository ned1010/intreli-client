'use client';

import { useMemo } from 'react';
import { Response } from '@/components/ui/shadcn-io/ai/response';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { UnifiedCitationModal } from '@/components/ui/UnifiedCitationModal';
import { DocumentReferenceModal } from '@/components/ui/DocumentReferenceModal';
import type { CitationData, SourceData } from '@/types/types';

type ResponseType = 'single_document' | 'all_documents';

interface MarkdownWithCitationsProps {
  answer: string;
  citations: CitationData[];
  sources?: SourceData[];
  responseType?: ResponseType;
}

const citationRegex = /\[(\d+(?:\s*,\s*\d+)*)\]/g;

export function MarkdownWithCitations({
  answer,
  citations,
  sources = [],
  responseType = 'single_document',
}: MarkdownWithCitationsProps) {
  // Normalize labels and build lookup maps
  const { normalizedCitations, citationMap, sourceMap, citationSourceMap } = useMemo(() => {
    const normalizeLabel = (label: string): string => {
      const numStr = (label || '').replace(/[\[\]]/g, '').trim();
      const num = parseInt(numStr, 10);
      return Number.isNaN(num) ? label : `[${num}]`;
    };

    const norm = citations.map((c) => ({ ...c, label: normalizeLabel(c.label) }));

    const cMap = new Map<number, CitationData>();
    norm.forEach((c) => {
      const numStr = (c.label || '').replace(/[\[\]]/g, '').trim();
      const num = parseInt(numStr, 10);
      if (!Number.isNaN(num)) cMap.set(num, c);
    });

    const sMap = new Map<string, SourceData>();
    sources.forEach((s) => {
      if (s.chunk_id) sMap.set(s.chunk_id, s);
    });

    const cSourceMap = new Map<string, SourceData>();
    norm.forEach((c) => {
      const withText = c as CitationData & { chunk_text?: string };
      if (c.chunk_id && withText.chunk_text) {
        cSourceMap.set(c.chunk_id, {
          chunk_id: c.chunk_id,
          chunk_text: withText.chunk_text,
          pdf_name: c.pdf_name,
          page: c.page,
          score: c.score,
        });
      }
    });

    return {
      normalizedCitations: norm,
      citationMap: cMap,
      sourceMap: sMap,
      citationSourceMap: cSourceMap,
    };
  }, [citations, sources]);

  // Determine which citations are actually used in the rendered answer
  const { citationsByDocument } = useMemo(() => {
    const usedNums = new Set<number>();
    let match: RegExpExecArray | null;

    while ((match = citationRegex.exec(answer)) !== null) {
      match[1]
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n))
        .forEach((n) => usedNums.add(n));
    }

    const used = normalizedCitations.filter((c) => {
      const numStr = (c.label || '').replace(/[\[\]]/g, '').trim();
      const num = parseInt(numStr, 10);
      return !Number.isNaN(num) && usedNums.has(num);
    });

    const byDoc = new Map<string, CitationData[]>();
    used.forEach((c) => {
      const key = c.pdf_name;
      if (!byDoc.has(key)) byDoc.set(key, []);
      byDoc.get(key)!.push(c);
    });

    return { citationsByDocument: byDoc };
  }, [answer, normalizedCitations]);

  // Inline text renderer to replace [N] markers with badges
  const TextWithCitations = ({ children }: { children?: string }) => {
    const text = typeof children === 'string' ? children : '';
    if (!text) return <>{children}</>;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = citationRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const nums = match[1]
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n))
        .slice(0, 2);

      if (nums.length === 0) {
        parts.push(match[0]);
      } else {
        parts.push(
          <span key={match.index} className="inline-flex items-center gap-1 whitespace-nowrap">
            {nums.map((n, idx) => {
              const citation = citationMap.get(n);
              const source =
                citation?.chunk_id
                  ? sourceMap.get(citation.chunk_id) || citationSourceMap.get(citation.chunk_id) || null
                  : null;

              if (citation) {
                return (
                  <span key={idx} className="inline-flex items-center whitespace-nowrap">
                    <HoverCard openDelay={200} closeDelay={100}>
                      <HoverCardTrigger>
                        <span className="mx-0.5 cursor-pointer text-xs text-muted-foreground align-baseline hover:text-foreground transition-colors underline decoration-dotted underline-offset-2">
                          [{n}]
                        </span>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-96 p-4 max-h-[70vh] overflow-y-auto">
                        <UnifiedCitationModal
                          citation={citation}
                          source={source || undefined}
                          allCitations={normalizedCitations}
                          responseType={responseType}
                        />
                      </HoverCardContent>
                    </HoverCard>
                    {idx < nums.length - 1 && ','}
                  </span>
                );
              }

              return (
                <span key={idx} className="inline-flex items-center whitespace-nowrap">
                  <span className="mx-0.5 text-xs text-muted-foreground align-baseline">
                    [{n}]
                  </span>
                  {idx < nums.length - 1 && ','}
                </span>
              );
            })}
          </span>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return <>{parts}</>;
  };

  return (
    <div className="space-y-6">
      {/* Answer with inline citations handled at the markdown text-node level */}
      <Response
        className="prose prose-sm dark:prose-invert max-w-none"
        parseIncompleteMarkdown
        options={{
          components: {
            text: TextWithCitations,
          },
        }}
      >
        {answer}
      </Response>

      {/* REFERENCES Section - Grouped by Document */}
      {citationsByDocument.size > 0 && (
        <div className="space-y-2 border-t pt-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            REFERENCES
          </h3>
          <div className="space-y-2">
            {Array.from(citationsByDocument.entries()).map(([docTitle, docCitations]) => {
              const pages = Array.from(new Set(docCitations.map((c) => c.page)))
                .map((p) => {
                  const pageNum = typeof p === 'string' ? parseInt(p, 10) : p;
                  return Number.isNaN(pageNum) ? 0 : pageNum;
                })
                .filter((p) => p > 0)
                .sort((a, b) => a - b);

              const docSources = docCitations
                .map((c) => {
                  if (c.chunk_id) {
                    return sourceMap.get(c.chunk_id) || citationSourceMap.get(c.chunk_id) || null;
                  }
                  return null;
                })
                .filter((s): s is SourceData => s !== null);

              return (
                <HoverCard key={docTitle} openDelay={200} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <div className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      <span className="font-medium">{docTitle}</span>
                      {pages.length > 0 && (
                        <>
                          {' — Pages '}
                          <span>{pages.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-96 p-4 max-h-[70vh] overflow-y-auto">
                    <DocumentReferenceModal
                      documentTitle={docTitle}
                      citations={docCitations}
                      sources={docSources}
                    />
                  </HoverCardContent>
                </HoverCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


