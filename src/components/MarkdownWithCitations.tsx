'use client';

import { useMemo } from 'react';
import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { Response } from '@/components/ui/shadcn-io/ai/response';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { UnifiedCitationModal } from '@/components/ui/UnifiedCitationModal';
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
    // Preprocess answer to sort citation numbers (e.g., [2,1] -> [1,2])
    const processedAnswer = useMemo(() => {
        return answer.replace(citationRegex, (match, numbers) => {
            const nums = numbers
                .split(',')
                .map((s: string) => parseInt(s.trim(), 10))
                .filter((n: number) => !Number.isNaN(n))
                .sort((a: number, b: number) => a - b); // Sort numbers ascending

            if (nums.length === 0) return match;
            return `[${nums.join(',')}]`;
        });
    }, [answer]);

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

    // Determine which citations are actually used in the rendered answer (deduplicated)
    const { uniqueCitations } = useMemo(() => {
        const usedNums = new Set<number>();
        let match: RegExpExecArray | null;
        // Reset regex lastIndex to ensure we scan from the beginning
        citationRegex.lastIndex = 0;

        while ((match = citationRegex.exec(processedAnswer)) !== null) {
            match[1]
                .split(',')
                .map((s) => parseInt(s.trim(), 10))
                .filter((n) => !Number.isNaN(n))
                .forEach((n) => usedNums.add(n));
        }

        // Get unique citations by number (deduplicated)
        const citationByNum = new Map<number, CitationData>();

        // If no inline citations found but we have citations array, show all of them
        // This handles cases where LLM doesn't generate inline citations but backend preserved them
        if (usedNums.size === 0 && normalizedCitations.length > 0) {
            // No inline citations found - include all citations from the array
            normalizedCitations.forEach((c) => {
                const numStr = (c.label || '').replace(/[\[\]]/g, '').trim();
                const num = parseInt(numStr, 10);
                if (!Number.isNaN(num)) {
                    // Only add if we haven't seen this citation number before
                    if (!citationByNum.has(num)) {
                        citationByNum.set(num, c);
                    }
                }
            });
        } else {
            // Only include citations that are actually used in the answer text
            normalizedCitations.forEach((c) => {
                const numStr = (c.label || '').replace(/[\[\]]/g, '').trim();
                const num = parseInt(numStr, 10);
                if (!Number.isNaN(num) && usedNums.has(num)) {
                    // Only add if we haven't seen this citation number before
                    if (!citationByNum.has(num)) {
                        citationByNum.set(num, c);
                    }
                }
            });
        }

        // Convert to sorted array by citation number
        const sorted = Array.from(citationByNum.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([, citation]) => citation);

        return { uniqueCitations: sorted };
    }, [processedAnswer, normalizedCitations]);

    // Inline text renderer to replace [N] markers with badges
    // react-markdown text component signature
    const TextWithCitations: ElementType = ({ children, ...props }: ComponentPropsWithoutRef<'span'>) => {
        // Extract text from children (handle both string and ReactNode)
        let text = '';
        if (typeof children === 'string') {
            text = children;
        } else if (Array.isArray(children)) {
            text = children
                .map(child => (typeof child === 'string' ? child : ''))
                .join('');
        } else if (children && typeof children === 'object' && 'props' in children) {
            const childProps = (children as { props?: { children?: React.ReactNode } }).props;
            if (childProps?.children && typeof childProps.children === 'string') {
                text = childProps.children;
            }
        }

        if (!text) return <span {...props}>{children}</span>;

        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        // Reset regex lastIndex to ensure we scan from the beginning
        citationRegex.lastIndex = 0;

        while ((match = citationRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index));
            }

            const nums = match[1]
                .split(',')
                .map((s) => parseInt(s.trim(), 10))
                .filter((n) => !Number.isNaN(n))
                .sort((a, b) => a - b); // Sort numbers to ensure smaller numbers come first

            if (nums.length === 0) {
                parts.push(match[0]);
            } else {
                // Render as a single combined citation badge [1,2] instead of separate [1], [2]
                const sortedCitationText = `[${nums.join(',')}]`;
                const firstCitation = nums.length > 0 ? citationMap.get(nums[0]) : null;
                const firstSource = firstCitation?.chunk_id
                    ? sourceMap.get(firstCitation.chunk_id) || citationSourceMap.get(firstCitation.chunk_id) || null
                    : null;

                if (firstCitation) {
                    parts.push(
                        <span key={match.index} className="inline-flex items-center whitespace-nowrap">
                            <HoverCard openDelay={200} closeDelay={100}>
                                <HoverCardTrigger>
                                    <span className="mx-0.5 cursor-pointer text-xs text-muted-foreground align-baseline hover:text-foreground transition-colors underline decoration-dotted underline-offset-2">
                                        {sortedCitationText}
                                    </span>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-96 p-4 max-h-[70vh] overflow-y-auto">
                                    <UnifiedCitationModal
                                        citation={firstCitation}
                                        source={firstSource || undefined}
                                        allCitations={normalizedCitations}
                                        responseType={responseType}
                                    />
                                </HoverCardContent>
                            </HoverCard>
                        </span>
                    );
                } else {
                    // Fallback: render as plain text if citation not found
                    parts.push(
                        <span key={match.index} className="inline-flex items-center whitespace-nowrap">
                            <span className="mx-0.5 text-xs text-muted-foreground align-baseline">
                                {sortedCitationText}
                            </span>
                        </span>
                    );
                }
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
                {processedAnswer}
            </Response>

            {/* REFERENCES Section - Numbered List */}
            {uniqueCitations.length > 0 && (
                <div className="space-y-2 border-t pt-4">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        REFERENCES
                    </h3>
                    <ol className="space-y-1 list-decimal list-inside">
                        {uniqueCitations.map((citation) => {
                            const citationNum = parseInt((citation.label || '').replace(/[\[\]]/g, '').trim(), 10);

                            // Format page number: handle "0", "unknown", "N/A", or actual page numbers
                            let pageDisplay = 'page unknown';
                            if (citation.page === '0') {
                                pageDisplay = 'page 0';
                            } else if (citation.page && citation.page !== 'unknown' && citation.page !== 'N/A') {
                                const pageNum = typeof citation.page === 'string' ? parseInt(citation.page, 10) : citation.page;
                                if (!Number.isNaN(pageNum) && pageNum > 0) {
                                    pageDisplay = `page ${pageNum}`;
                                }
                            }

                            const source =
                                citation?.chunk_id
                                    ? sourceMap.get(citation.chunk_id) || citationSourceMap.get(citation.chunk_id) || null
                                    : null;

                            return (
                                <li key={citationNum} className="text-xs text-muted-foreground">
                                    <HoverCard openDelay={200} closeDelay={100}>
                                        <HoverCardTrigger asChild>
                                            <span className="hover:text-foreground transition-colors cursor-pointer">
                                                {citation.pdf_name}, {pageDisplay}
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
                                </li>
                            );
                        })}
                    </ol>
                </div>
            )}
        </div>
    );
}


