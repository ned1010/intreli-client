'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

export function DocumentChunks() {
    // purely visual — no state, no fetching
    const mockChunks = [
        {
            id: 1,
            content:
                "[Introduction] This document explains the fundamentals of retrieval augmented generation (RAG) systems and their architecture."
        },
        {
            id: 2,
            content:
                "[Architecture] The RAG pipeline consists of data ingestion, vectorization, retrieval, and response generation components."
        },
        {
            id: 3,
            content:
                "[Implementation] Using LangChain, Pinecone, and FastAPI for ML backend enables efficient document search and response composition."
        }
    ];

    const isOpen = true; // static open view for UI preview

    return (
        <div className="mt-4">
            <Collapsible open={isOpen}>
                <CollapsibleTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-6 text-xs hover:bg-muted"
                    >
                        {isOpen ? (
                            <ChevronDown className="w-3 h-3 mr-1" />
                        ) : (
                            <ChevronRight className="w-3 h-3 mr-1" />
                        )}
                        {mockChunks.length > 0
                            ? `${mockChunks.length} content chunks`
                            : "View content"}
                    </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <div className="mt-2 space-y-2">
                        {mockChunks.map((chunk, index) => {
                            const topicMatch = chunk.content.match(/^\[([^\]]+)\]/);
                            const topic = topicMatch ? topicMatch[1] : "General";
                            const content = topicMatch
                                ? chunk.content.replace(/^\[([^\]]+)\]\s*/, "")
                                : chunk.content;

                            return (
                                <div
                                    key={chunk.id}
                                    className="p-3 bg-muted/30 rounded border-l-2 border-primary/20"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-xs">
                                            {topic}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            Chunk {index + 1}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground line-clamp-3">
                                        {content.substring(0, 200)}
                                        {content.length > 200 && "..."}
                                    </p>
                                </div>
                            );
                        })}

                        {mockChunks.length === 0 && (
                            <div className="p-3 bg-muted/30 rounded text-sm text-muted-foreground">
                                No content chunks available
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
