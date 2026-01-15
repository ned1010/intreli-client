'use client';
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
} from '@/components/ui/shadcn-io/ai/conversation';
import { Loader } from '@/components/ui/shadcn-io/ai/loader';
import { Message, MessageAvatar, MessageContent } from '@/components/ui/shadcn-io/ai/message';
import {
    PromptInput,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputToolbar,
} from '@/components/ui/shadcn-io/ai/prompt-input';
import {
    Reasoning,
    ReasoningContent,
    ReasoningTrigger,
} from '@/components/ui/shadcn-io/ai/reasoning';
import { nanoid } from 'nanoid';
import { type FormEventHandler, useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { chatApi, messagesApi } from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Document, CitationData, SourceData } from '@/types/types';
import { useDocumentAutocomplete } from '@/hooks/use-document-autocomplete';
import { documentCache } from '@/lib/cache';
import { DocumentAutocomplete } from '@/components/DocumentAutocomplete';
import { MultiDocumentResponse } from '@/components/MultiDocumentResponse';
import { MarkdownResponse } from '@/components/MarkdownResponse';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { DocumentSelector } from '@/components/DocumentSelector';
import { SelectedDocumentChips } from '@/components/SelectedDocumentChips';

type ChatMessage = {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: Date;
    reasoning?: string;
    sources?: Array<SourceData>;
    citations?: Array<CitationData>;
    isStreaming?: boolean;
    status?: string;
    responseType?: 'single_document' | 'all_documents';
    documentSummaries?: Array<{
        document_id: string;
        document_name: string;
        summary: string;
        relevance_score: number;
        chunks_used: number;
    }>;
    totalDocuments?: number;
    documentsAnalyzed?: number;
    hasRelevantInformation?: boolean;
    intent?: 'factual' | 'list' | 'summary' | 'comparison' | 'analytical' | 'definition';
    documentCount?: number; // Store document count for status message determination
};


interface ChatInterfaceProps {
    chatId: string | null;
    userId: string; // Add userId prop
    documentName?: string; // Document name to auto-insert into input
}

const ML_SERVER_URL = process.env.NEXT_PUBLIC_ML_SERVER_URL || 'http://localhost:8000/';
const StreamChat = ({ chatId, userId, documentName }: ChatInterfaceProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [, setIsLoadingChat] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
    const [currentChatId, setCurrentChatId] = useState<string | null>(chatId);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const savedMessageIdsRef = useRef<Set<string>>(new Set());
    const fallbackTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const messageContentRef = useRef<Map<string, string>>(new Map());
    const documentNameInsertedRef = useRef<boolean>(false);

    const { user } = useUser();

    const userProfileImage = user?.imageUrl;

    // Fetch documents with React Query caching
    const { data: documents = [] } = useQuery<Document[]>({
        queryKey: ['documents', userId],
        queryFn: async () => {
            const response = await api.get(`/api/v1/documents?userId=${userId}`);
            console.log('Documents fetched:', response.data.documents);
            const docs = response.data.documents || [];

            // Invalidate cache when documents change
            // This ensures cache stays in sync with server data
            if (userId) {
                // Clear query caches for this user
                const cacheKeys = documentCache.keys();
                cacheKeys.forEach(key => {
                    if (key.startsWith(`${userId}-`)) {
                        documentCache.remove(key);
                    }
                });
            }

            return docs;
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Document autocomplete hook
    const {
        isOpen: isAutocompleteOpen,
        selectedIndex,
        filteredDocuments,
        triggerPosition,
        handleKeyDown: handleAutocompleteKeyDown,
        handleSelect: handleAutocompleteSelect,
        close: closeAutocomplete
    } = useDocumentAutocomplete(inputValue, cursorPosition, {
        documents,
        onSelect: (doc, triggerPos) => {
            // Insert document name into input
            const beforeTrigger = inputValue.substring(0, triggerPos.start);
            const afterQuery = inputValue.substring(triggerPos.end);
            const newValue = `${beforeTrigger}@-${doc.name} ${afterQuery}`;
            setInputValue(newValue);

            // Set cursor position after inserted document name
            setTimeout(() => {
                if (textareaRef.current) {
                    const newCursorPos = triggerPos.start + `@-${doc.name} `.length;
                    textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                    textareaRef.current.focus();
                    setCursorPosition(newCursorPos);
                }
            }, 0);

            closeAutocomplete();
        },
        maxResults: 20,
        debounceMs: 150 // Optimized debounce for better performance
    });

    // Helper function to save assistant messages
    const saveAssistantMessage = useCallback(async (
        messageId: string,
        chatId: string,
        content: string,
        reasoning?: string,
        sources?: Array<SourceData>,
        citations?: Array<CitationData>,
        responseType?: 'single_document' | 'all_documents',
        documentSummaries?: Array<{
            document_id: string;
            document_name: string;
            summary: string;
            relevance_score: number;
            chunks_used: number;
        }>,
        totalDocuments?: number,
        documentsAnalyzed?: number,
        hasRelevantInformation?: boolean
    ) => {
        // Prevent duplicate saves
        if (savedMessageIdsRef.current.has(messageId)) {
            console.log('Skipping save - message already saved:', messageId);
            return;
        }

        if (!messageId || !chatId || !content) {
            console.log('Skipping save - missing required data for assistant message');
            return;
        }

        // Mark as saved BEFORE the async call to prevent race conditions
        savedMessageIdsRef.current.add(messageId);

        try {
            console.log('Saving assistant message:', {
                messageId,
                chatId,
                contentLength: content.length,
                sourcesCount: sources?.length,
                citationsCount: citations?.length
            });

            // Ensure citations is always an array when provided - never undefined
            // This ensures axios sends the citations array to the server
            const citationsToSave = Array.isArray(citations) ? citations : (citations ? [citations] : undefined);

            // Ensure sources is always an array when provided - never undefined
            // This ensures axios sends the sources array to the server
            const sourcesToSave = Array.isArray(sources) ? sources : (sources ? [sources] : undefined);

            // Prepare the payload - explicitly include citations and sources even if empty array
            // Axios may strip undefined values, so we need to ensure they're always included when they exist
            const payload: {
                messageId: string;
                chatId: string;
                content: string;
                role: 'assistant';
                reasoning?: string;
                sources?: Array<SourceData>;
                citations?: Array<CitationData>;
                responseType?: 'single_document' | 'all_documents';
                documentSummaries?: Array<{
                    document_id: string;
                    document_name: string;
                    summary: string;
                    relevance_score: number;
                    chunks_used: number;
                }>;
                totalDocuments?: number;
                documentsAnalyzed?: number;
                hasRelevantInformation?: boolean;
            } = {
                messageId,
                chatId,
                content,
                role: 'assistant',
                reasoning: reasoning || undefined,
                responseType: responseType || undefined,
                documentSummaries: documentSummaries || undefined,
                totalDocuments: totalDocuments || undefined,
                documentsAnalyzed: documentsAnalyzed || undefined,
                hasRelevantInformation: hasRelevantInformation !== undefined ? hasRelevantInformation : undefined
            };

            // Always include sources if it's an array (even if empty) - don't let axios strip it
            if (sourcesToSave !== undefined) {
                payload.sources = sourcesToSave;
            }

            // Always include citations if it's an array (even if empty) - don't let axios strip it
            if (citationsToSave !== undefined) {
                payload.citations = citationsToSave;
            }

            await messagesApi.save(payload);
            console.log('Assistant message saved successfully');
        } catch (error) {
            console.error('Failed to save assistant message:', error);
            // Remove from saved set on error so it can be retried
            savedMessageIdsRef.current.delete(messageId);
        }
    }, []);



    // Auto-insert document name when provided
    useEffect(() => {
        if (documentName && !documentNameInsertedRef.current && inputValue === '') {
            const documentTag = `@-${documentName} `;
            setInputValue(documentTag);
            documentNameInsertedRef.current = true;

            // Set cursor position and focus after insertion
            setTimeout(() => {
                if (textareaRef.current) {
                    const cursorPos = documentTag.length;
                    textareaRef.current.setSelectionRange(cursorPos, cursorPos);
                    textareaRef.current.focus();
                    setCursorPosition(cursorPos);
                }
            }, 0);
        }
    }, [documentName, inputValue]);

    // Reset document name insertion flag when chatId changes
    useEffect(() => {
        documentNameInsertedRef.current = false;
    }, [chatId]);

    // Load chat messages when chatId changes
    useEffect(() => {
        const loadChatMessages = async () => {
            // If messages already exist in UI (user started typing), do not overwrite with loader
            if (messages.length > 0) {
                return;
            }
            if (chatId === 'new' || chatId === null) {
                // New chat - show welcome message
                setMessages([
                    {
                        id: nanoid(),
                        content: "Welcome! I'm Intreli, your personalised AI assistant. Ask me questions about any of your information base and I'll provide detailed answers with insights and explanations.",
                        role: 'assistant',
                        timestamp: new Date(),
                        sources: [
                            // { chunk_text: "Getting Started Guide", page: "#" },
                            // { chunk_text: "API Documentation", page: "#" }
                        ]
                    }
                ]);
                setCurrentChatId(null);
                return;
            }

            setIsLoadingChat(true);
            try {
                console.log('Attempting to load chat:', chatId);
                // Load actual chat messages from database
                const result = await chatApi.getChatWithMessages(chatId);
                console.log('Chat API response:', result);


                if (result.success) {
                    // Chat exists - check if it has messages
                    if (result.messages && result.messages.length > 0) {
                        // Normalize citation labels to ensure consistent format [N]
                        const normalizeCitationLabel = (label: string): string => {
                            if (!label) return '';
                            // Remove any existing brackets and add them back consistently
                            const numStr = label.replace(/[\[\]]/g, '').trim();
                            const num = parseInt(numStr, 10);
                            if (!isNaN(num)) {
                                return `[${num}]`;
                            }
                            return label; // Return original if can't parse
                        };

                        // Convert API messages to component format
                        const formattedMessages: ChatMessage[] = (result.messages as unknown as Array<{
                            id: string;
                            content: string;
                            role: string;
                            createdAt: string | Date;
                            citations?: Array<CitationData>;
                            responseType?: 'single_document' | 'all_documents';
                            documentsAnalyzed?: number;
                            intent?: ChatMessage['intent'];
                            [key: string]: unknown;
                        }>).map((msg) => {
                            const normalizedCites = (msg.citations || []).map((cite: CitationData) => ({
                                ...cite,
                                label: normalizeCitationLabel(cite.label || '')
                            }));

                            // Default to 'single_document' if responseType is not set (for backward compatibility)
                            const defaultResponseType = msg.responseType ||
                                (msg.documentsAnalyzed && typeof msg.documentsAnalyzed === 'number' && msg.documentsAnalyzed > 1 ? 'all_documents' : 'single_document');

                            return {
                                id: msg.id,
                                content: msg.content,
                                role: (msg.role === 'system' ? 'assistant' : msg.role) as 'user' | 'assistant' | 'system',
                                timestamp: new Date(msg.createdAt as string | Date),
                                reasoning: msg.reasoning as string | undefined,
                                sources: (msg.sources || []) as Array<SourceData>,
                                // Normalize citation labels to ensure consistent format
                                citations: normalizedCites,
                                responseType: defaultResponseType,
                                documentSummaries: msg.documentSummaries as Array<{
                                    document_id: string;
                                    document_name: string;
                                    summary: string;
                                    relevance_score: number;
                                    chunks_used: number;
                                }> | undefined,
                                totalDocuments: msg.totalDocuments as number | undefined,
                                documentsAnalyzed: msg.documentsAnalyzed as number | undefined,
                                hasRelevantInformation: msg.hasRelevantInformation as boolean | undefined,
                                status: msg.status as string | undefined,
                                intent: msg.intent as ChatMessage['intent'] | undefined
                            };
                        });
                        console.log('Formatted messages:', formattedMessages);
                        setMessages(formattedMessages);
                    } else {
                        // Chat exists but has no messages - show welcome for existing chat
                        console.log('Chat exists but no messages found');
                        setMessages([
                            {
                                id: nanoid(),
                                content: "Welcome! I'm Intreli, your personalised AI assistant. Ask me questions about any of your information base and I'll provide detailed answers with insights and explanations.",
                                role: 'assistant',
                                timestamp: new Date(),
                            }
                        ]);
                    }
                    setCurrentChatId(chatId);
                } else {
                    // Chat not found - show welcome instead of error for better UX
                    console.log('Chat not found or API returned error:', result);
                    setMessages([
                        {
                            id: nanoid(),
                            content: "Welcome! I'm Intreli, your personalised AI assistant. Ask me questions about any of your information base and I'll provide detailed answers with insights and explanations.",
                            role: 'assistant',
                            timestamp: new Date(),
                        }
                    ]);
                    setCurrentChatId(chatId); // Keep the chatId so new messages will be saved to it
                }
            } catch (error) {
                console.error('Failed to load chat - Network/API Error:', error);
                // On error, default to welcome message rather than an error for first load
                setMessages([
                    {
                        id: nanoid(),
                        content: "Welcome! I'm Intreli, your personalised AI assistant. Ask me questions about any of your information base and I'll provide detailed answers with insights and explanations.",
                        role: 'assistant',
                        timestamp: new Date(),
                    }
                ]);
                setCurrentChatId(chatId);
            } finally {
                setIsLoadingChat(false);
            }
        };

        loadChatMessages();
    }, [chatId, messages.length, setCurrentChatId]);

    // Helper function to extract document ID from question text
    // Returns the first matching document ID if a document tag is found
    // Create name-to-ID map for fast O(1) lookups
    const nameToIdMapRef = useRef<Map<string, string>>(new Map());

    // Update name-to-ID map when documents change
    useEffect(() => {
        const map = new Map<string, string>();
        documents.forEach(doc => {
            const lowerName = doc.name.toLowerCase();
            const docId = String(doc.id);
            map.set(lowerName, docId);
        });
        nameToIdMapRef.current = map;
    }, [documents]);

    const extractDocumentIdFromQuestion = useCallback((text: string, docs: Document[]): string[] => {
        if (!text.trim() || !docs.length) return [];

        // Updated regex to handle document names with spaces
        // Matches @- followed by characters until next @- or end of string
        const tagRegex = /@-([^@]+?)(?=\s*@-|$)/g;
        let match;
        const documentIds: string[] = [];
        const seenIds = new Set<string>();

        while ((match = tagRegex.exec(text)) !== null) {
            let tagName = match[1].trim();
            // Remove trailing punctuation (but keep .pdf extensions)
            if (!tagName.toLowerCase().endsWith('.pdf')) {
                tagName = tagName.replace(/[.,;:!?]+$/, '');
            }
            const tagNameLower = tagName.toLowerCase();

            // Use cached name-to-ID map for O(1) lookup
            let docId = nameToIdMapRef.current.get(tagNameLower);

            // Fallback: check for partial matches (exact match first, then partial)
            if (!docId) {
                // First try exact match
                for (const [name, id] of nameToIdMapRef.current.entries()) {
                    if (name === tagNameLower) {
                        docId = id;
                        break;
                    }
                }
                // Then try partial match
                if (!docId) {
                    for (const [name, id] of nameToIdMapRef.current.entries()) {
                        if (name.includes(tagNameLower) || tagNameLower.includes(name)) {
                            docId = id;
                            break;
                        }
                    }
                }
            }

            // Add to array if found and not already added
            if (docId && !seenIds.has(docId)) {
                documentIds.push(docId);
                seenIds.add(docId);
            }
        }

        return documentIds;
    }, []);

    // Helper function to check if a question contains a document tag
    const hasDocumentTag = useCallback((text: string, docs: Document[]): boolean => {
        if (!text.trim()) return false;

        const tagRegex = /@-([^\s]+)/g;
        let match;

        while ((match = tagRegex.exec(text)) !== null) {
            const tagName = match[1];
            // Check if this tag matches an actual document
            const matchingDoc = docs.find(doc =>
                doc.name.toLowerCase() === tagName.toLowerCase() ||
                doc.name.toLowerCase().includes(tagName.toLowerCase())
            );

            if (matchingDoc) {
                return true;
            }
        }

        return false;
    }, []);

    // Helper function to determine status message based on document selection
    const getStatusMessage = useCallback((selectedDocs: Document[], question: string, docs: Document[]): string => {
        let documentCount = 0;

        // Priority 1: Use selected documents if any
        if (selectedDocs.length > 0) {
            documentCount = selectedDocs.length;
        } else {
            // Priority 2: Extract from @- tags in question
            const documentIds = extractDocumentIdFromQuestion(question, docs);
            documentCount = documentIds.length;
        }

        // Determine status message based on document count
        if (documentCount === 1) {
            return 'searching and analysing single document';
        } else if (documentCount > 1) {
            return `searching and analysing ${documentCount} documents`;
        } else {
            return 'searching and analysing all documents';
        }
    }, [extractDocumentIdFromQuestion]);

    const handleStreamChat = useCallback(async (question: string, messageId?: string, chatIdForSaving?: string) => {
        const targetMessageId = messageId || streamingMessageId;
        const activeChatId = chatIdForSaving || currentChatId;

        // Extract document IDs from selected documents (priority) or from question tags
        let documentIds: string[] = [];

        // Priority 1: Use selected documents if any
        if (selectedDocuments.length > 0) {
            documentIds = selectedDocuments.map(doc => String(doc.id));
        } else {
            // Priority 2: Extract from @- tags in question
            documentIds = extractDocumentIdFromQuestion(question, documents);
        }

        console.log('Starting stream chat with userId:', userId, 'question:', question, 'messageId:', targetMessageId, 'documentIds:', documentIds);
        try {
            // Build request payload - include documentIds if found
            const requestPayload: {
                question: string;
                userId: string;
                documentId?: string;
                documentIds?: string[];
            } = {
                question,
                userId
            };

            // Include documentIds if we successfully extracted any
            if (documentIds.length > 0) {
                // For backward compatibility, also set documentId if only one document
                if (documentIds.length === 1) {
                    requestPayload.documentId = documentIds[0];
                }
                // Always include documentIds array for multi-document support
                requestPayload.documentIds = documentIds;
            }

            const response = await fetch(`${ML_SERVER_URL}/api/ml/streamchat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestPayload)
            });

            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No reader available');
            }

            const decoder = new TextDecoder();
            console.log('Using assistant message ID:', targetMessageId);

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        console.log('Received SSE:', line); // Debug log
                        try {
                            const data = JSON.parse(line.slice(6));
                            console.log('Parsed data:', data); // Debug log

                            if (data.type === 'sources') {
                                // Update message with sources
                                console.log('Received sources:', data.sources);
                                setMessages(prev => prev.map(msg => {
                                    if (msg.id === targetMessageId) {
                                        return {
                                            ...msg,
                                            sources: data.sources,
                                            status: undefined
                                        };
                                    }
                                    return msg;
                                }));

                            } else if (data.type === 'token') {
                                // Append token to current message
                                console.log('Received token:', data.content);

                                // Use ref to track latest content and prevent stale closure issues
                                if (!targetMessageId) return;
                                const currentContent = messageContentRef.current.get(targetMessageId) || '';
                                const newContent = currentContent + data.content;
                                messageContentRef.current.set(targetMessageId, newContent);

                                setMessages(prev => {
                                    const updated = prev.map(msg => {
                                        if (msg.id === targetMessageId) {
                                            // Use ref content to ensure we have the latest, not stale state
                                            const contentToUse = messageContentRef.current.get(targetMessageId) || msg.content;
                                            console.log('Updating message ID:', msg.id, 'New content length:', contentToUse.length);
                                            return {
                                                ...msg,
                                                content: contentToUse,
                                                isStreaming: true,
                                                status: undefined
                                            };
                                        }
                                        return msg;
                                    });
                                    console.log('Messages after token update:', updated.length);
                                    return updated;
                                });

                            } else if (data.type === 'status') {
                                // Update status message with mode-based message instead of server message
                                setMessages(prev => {
                                    const currentMessage = prev.find(msg => msg.id === targetMessageId);
                                    const currentIndex = prev.findIndex(msg => msg.id === targetMessageId);

                                    // Use stored documentCount if available, otherwise determine from previous user message
                                    let modeBasedStatus: string;
                                    if (currentMessage?.documentCount !== undefined) {
                                        if (currentMessage.documentCount === 1) {
                                            modeBasedStatus = 'searching and analysing single document';
                                        } else if (currentMessage.documentCount > 1) {
                                            modeBasedStatus = `searching and analysing ${currentMessage.documentCount} documents`;
                                        } else {
                                            modeBasedStatus = 'searching and analysing all documents';
                                        }
                                    } else {
                                        const previousUserMessage = currentIndex > 0 ? prev[currentIndex - 1] : null;
                                        const userQuestion = previousUserMessage?.role === 'user' ? previousUserMessage.content : '';
                                        modeBasedStatus = getStatusMessage([], userQuestion, documents);
                                    }

                                    return prev.map(msg => {
                                        if (msg.id === targetMessageId) {
                                            return {
                                                ...msg,
                                                status: modeBasedStatus
                                            };
                                        }
                                        return msg;
                                    });
                                });

                            } else if (data.type === 'done') {
                                // Mark streaming as complete
                                console.log('Received done event:', {
                                    hasCitations: !!data.citations,
                                    citationsCount: data.citations?.length || 0,
                                    hasSources: !!data.sources,
                                    sourcesCount: data.sources?.length || 0,
                                    fullResponseLength: data.full_response?.length || 0,
                                    responseType: data.response_type
                                });

                                let finalContent = '';
                                let finalSources: Array<SourceData> = [];
                                let finalCitations: Array<CitationData> = [];
                                let finalReasoning = '';
                                let finalResponseType: 'single_document' | 'all_documents' | undefined = undefined;
                                let finalDocumentSummaries: Array<{
                                    document_id: string;
                                    document_name: string;
                                    summary: string;
                                    relevance_score: number;
                                    chunks_used: number;
                                }> | undefined = undefined;
                                let finalTotalDocuments: number | undefined = undefined;
                                let finalDocumentsAnalyzed: number | undefined = undefined;
                                let finalHasRelevantInformation: boolean | undefined = undefined;

                                // Normalize citation labels to ensure consistent format [N]
                                const normalizeCitationLabel = (label: string): string => {
                                    if (!label) return '';
                                    // Remove any existing brackets and add them back consistently
                                    const numStr = label.replace(/[\[\]]/g, '').trim();
                                    const num = parseInt(numStr, 10);
                                    if (!isNaN(num)) {
                                        return `[${num}]`;
                                    }
                                    return label; // Return original if can't parse
                                };

                                // Normalize citations from 'done' event - this is the authoritative source
                                let citationsFromDone: Array<CitationData> = [];

                                if (data.citations && data.citations.length > 0) {
                                    // Use citations if provided
                                    citationsFromDone = (data.citations || []).map((cite: CitationData) => ({
                                        ...cite,
                                        label: normalizeCitationLabel(cite.label || '')
                                    }));
                                    console.log('Using citations from data.citations:', citationsFromDone.length);
                                } else if (data.sources && data.sources.length > 0) {
                                    // Fallback: Extract citations from sources if citations array is not provided
                                    // Sources with labels are actually citations
                                    citationsFromDone = (data.sources || [])
                                        .filter((source: SourceData & { label?: string; document_id?: string }) => source.label) // Only sources with labels
                                        .map((source: SourceData & { label?: string; document_id?: string }) => ({
                                            label: normalizeCitationLabel(source.label || ''),
                                            pdf_name: source.pdf_name || '',
                                            page: String(source.page || ''),
                                            chunk_id: source.chunk_id || '',
                                            score: source.score || 0,
                                            chunk_text: source.chunk_text
                                        } as CitationData));
                                    console.log('Extracted citations from sources:', citationsFromDone.length);
                                }

                                // Set finalCitations BEFORE setMessages to ensure it's available for saving
                                finalCitations = citationsFromDone;

                                // Set finalSources BEFORE setMessages to ensure it's available for saving
                                // Use sources from 'done' event - this is the authoritative source
                                // This ensures sources are properly set for both single and multi-document responses
                                const sourcesFromDone = data.sources || [];
                                finalSources = sourcesFromDone;

                                // Get final content from data.full_response (authoritative source) or message state
                                // This ensures we have content available for saving even if setMessages hasn't executed yet
                                const contentForSave = data.full_response || '';

                                // Update ref with final content
                                if (targetMessageId && contentForSave) {
                                    messageContentRef.current.set(targetMessageId, contentForSave);
                                }

                                setMessages(prev => {
                                    // Get current message to access existing sources
                                    const currentMessage = prev.find(msg => msg.id === targetMessageId);
                                    const existingSources = currentMessage?.sources || [];

                                    // Find the previous user message to check if it had a document tag
                                    const currentIndex = prev.findIndex(msg => msg.id === targetMessageId);
                                    const previousUserMessage = currentIndex > 0 ? prev[currentIndex - 1] : null;
                                    const userQuestion = previousUserMessage?.role === 'user' ? previousUserMessage.content : '';
                                    const isAllDocumentsQuery = !hasDocumentTag(userQuestion, documents);

                                    const updated = prev.map(msg => {
                                        if (msg.id === targetMessageId) {
                                            // Use data.full_response if available, otherwise use msg.content
                                            const messageContent = data.full_response || msg.content;
                                            finalContent = messageContent;
                                            // Use sources from done event if available, otherwise keep existing
                                            const messageSources = sourcesFromDone.length > 0 ? sourcesFromDone : existingSources;
                                            finalReasoning = msg.reasoning || '';

                                            // Detect response type and store metadata
                                            // If querying all documents (no document tag), force all_documents mode
                                            let responseType = data.response_type ||
                                                (data.documents_analyzed && data.documents_analyzed > 1 ? 'all_documents' : 'single_document');

                                            // Override to all_documents if user is querying all documents
                                            if (isAllDocumentsQuery) {
                                                responseType = 'all_documents';
                                            }

                                            finalResponseType = responseType;
                                            finalDocumentSummaries = data.document_summaries || undefined;
                                            finalTotalDocuments = data.total_documents || undefined;
                                            finalDocumentsAnalyzed = data.documents_analyzed || undefined;
                                            finalHasRelevantInformation = data.has_relevant_information !== undefined ? data.has_relevant_information : true;

                                            return {
                                                ...msg,
                                                content: messageContent, // Update content with full_response
                                                isStreaming: false,
                                                status: undefined,
                                                responseType: responseType,
                                                sources: messageSources, // Update sources from done event
                                                citations: citationsFromDone, // Use normalized citations from done event
                                                documentSummaries: data.document_summaries || undefined,
                                                totalDocuments: data.total_documents || undefined,
                                                documentsAnalyzed: data.documents_analyzed || undefined,
                                                hasRelevantInformation: data.has_relevant_information !== undefined ? data.has_relevant_information : true
                                            };
                                        }
                                        return msg;
                                    });
                                    return updated;
                                });

                                // Set finalContent from data.full_response BEFORE save check
                                finalContent = contentForSave;

                                setIsTyping(false);
                                setStreamingMessageId(null);

                                // Cancel fallback timeout since we're saving from 'done' event
                                if (targetMessageId) {
                                    const fallbackTimeout = fallbackTimeoutRef.current.get(targetMessageId);
                                    if (fallbackTimeout) {
                                        clearTimeout(fallbackTimeout);
                                        fallbackTimeoutRef.current.delete(targetMessageId);
                                    }
                                }

                                // Save assistant message to database
                                console.log('Attempting to save message:', {
                                    activeChatId,
                                    finalContent: finalContent?.length,
                                    targetMessageId,
                                    hasContent: !!finalContent,
                                    sourcesCount: finalSources?.length,
                                    sources: finalSources,
                                    citationsCount: finalCitations?.length,
                                    finalCitations: finalCitations,
                                    citationsPreview: finalCitations.slice(0, 3).map(c => ({ label: c.label, pdf_name: c.pdf_name }))
                                });

                                // Log final message state for debugging
                                console.log('Final message state:', {
                                    hasCitations: finalCitations.length > 0,
                                    citationsCount: finalCitations.length,
                                    hasSources: finalSources.length > 0,
                                    sourcesCount: finalSources.length,
                                    isStreaming: false, // Should be false to unblock UI
                                    hasContent: !!finalContent
                                });

                                if (activeChatId && finalContent && targetMessageId) {
                                    await saveAssistantMessage(
                                        targetMessageId,
                                        activeChatId,
                                        finalContent,
                                        finalReasoning,
                                        finalSources,
                                        finalCitations,
                                        finalResponseType,
                                        finalDocumentSummaries,
                                        finalTotalDocuments,
                                        finalDocumentsAnalyzed,
                                        finalHasRelevantInformation
                                    );
                                } else {
                                    console.log('Skipping save - missing required data:', {
                                        hasActiveChatId: !!activeChatId,
                                        hasFinalContent: !!finalContent,
                                        hasTargetMessageId: !!targetMessageId
                                    });
                                }




                            } else if (data.type === 'error' || data.error) {
                                // Handle error
                                const errorMessage = data.error || 'An error occurred';
                                setMessages(prev => prev.map(msg => {
                                    if (msg.id === targetMessageId) {
                                        return {
                                            ...msg,
                                            content: `Error: ${errorMessage}`,
                                            isStreaming: false,
                                            status: undefined
                                        };
                                    }
                                    return msg;
                                }));
                                setIsTyping(false);
                                setStreamingMessageId(null);
                            }
                        } catch (e) {
                            console.error('Failed to parse JSON:', e, line);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Stream error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to get response. Please try again.';
            setMessages(prev => prev.map(msg => {
                if (streamingMessageId && msg.id === streamingMessageId) {
                    return {
                        ...msg,
                        content: `Error: ${errorMessage}`,
                        isStreaming: false,
                        status: undefined
                    };
                }
                return msg;
            }));
            setIsTyping(false);
            setStreamingMessageId(null);
        }

        // Fallback: Ensure assistant message is saved even if stream didn't complete properly
        //No error of assistant message not being saved
        if (targetMessageId && activeChatId) {
            // Clear any existing timeout for this message
            const existingTimeout = fallbackTimeoutRef.current.get(targetMessageId);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }

            const timeoutId = setTimeout(async () => {
                // Check if already saved before proceeding
                if (savedMessageIdsRef.current.has(targetMessageId)) {
                    fallbackTimeoutRef.current.delete(targetMessageId);
                    return;
                }

                // Get the current message from state
                setMessages(currentMessages => {
                    const assistantMessage = currentMessages.find(msg => msg.id === targetMessageId);
                    if (assistantMessage && assistantMessage.content && assistantMessage.role === 'assistant') {
                        console.log('Fallback: Attempting to save assistant message');
                        saveAssistantMessage(
                            targetMessageId,
                            activeChatId,
                            assistantMessage.content,
                            assistantMessage.reasoning,
                            assistantMessage.sources
                        );
                    }
                    fallbackTimeoutRef.current.delete(targetMessageId);
                    return currentMessages;
                });
            }, 1000); // Wait 1 second to ensure state is updated

            fallbackTimeoutRef.current.set(targetMessageId, timeoutId);
        }
    }, [userId, streamingMessageId, currentChatId, saveAssistantMessage, hasDocumentTag, documents, extractDocumentIdFromQuestion, selectedDocuments, getStatusMessage]);

    // Helper function to check if input has actual question text (not just document tags)
    const hasQuestionText = useCallback((text: string, docs: Document[]): boolean => {
        if (!text.trim()) return false;

        // Remove all document tags that match actual documents
        let cleanedText = text;
        const tagRegex = /@-([^\s]+)/g;
        let match;
        const tagsToRemove: Array<{ fullText: string }> = [];

        while ((match = tagRegex.exec(text)) !== null) {
            const tagName = match[1];
            // Check if this tag matches an actual document
            const matchingDoc = docs.find(doc =>
                doc.name.toLowerCase() === tagName.toLowerCase() ||
                doc.name.toLowerCase().includes(tagName.toLowerCase())
            );

            if (matchingDoc) {
                tagsToRemove.push({ fullText: match[0] });
            }
        }

        // Remove all matched document tags
        tagsToRemove.forEach(tag => {
            cleanedText = cleanedText.replace(tag.fullText, '');
        });

        // Check if there's any non-whitespace text remaining
        return cleanedText.trim().length > 0;
    }, []);

    // Memoize hasQuestionText result to prevent recalculation on every render
    const hasQuestionTextResult = useMemo(() => {
        return hasQuestionText(inputValue, documents);
    }, [inputValue, documents, hasQuestionText]);

    const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(async (event) => {
        event.preventDefault();

        if (!inputValue.trim() || isTyping) {
            console.log('Submit blocked:', { inputEmpty: !inputValue.trim(), isTyping });
            return;
        }

        // Check if there's actual question text (not just document tags)
        if (!hasQuestionTextResult) {
            console.log('Submit blocked: Only document tags, no question text');
            return;
        }

        // Disable the interface immediately to prevent multiple submissions
        setIsTyping(true);

        const question = inputValue.trim();
        let activeChatId = currentChatId;
        console.log('Starting handleSubmit:', { question, activeChatId, currentChatId });

        // Create new chat if needed
        if (!activeChatId) {
            try {
                console.log('Creating new chat for user:', userId, 'User object:', user);
                const newChatId = nanoid();
                const result = await chatApi.create({
                    userId,
                    title: question.length > 50 ? question.substring(0, 50) + '...' : question,
                    chatId: newChatId
                });

                if (result.success) {
                    activeChatId = result.chat.id;
                    setCurrentChatId(activeChatId);
                    console.log('New chat created:', activeChatId);

                    // Update URL without navigation to avoid interrupting the flow
                    window.history.replaceState({}, '', `/chat/${activeChatId}`);
                } else {
                    console.error('Failed to create chat:', result);
                    setIsTyping(false);
                    return;
                }
            } catch (error) {
                console.error('Failed to create new chat:', error);
                setIsTyping(false);
                return;
            }
        } else {
            // Check if chat exists, if not create it with the current chatId
            try {
                console.log('Checking if chat exists:', activeChatId);
                const existingChat = await chatApi.getChatWithMessages(activeChatId);
                console.log('Chat check result:', existingChat);
                if (!existingChat.success) {
                    console.log('Chat does not exist, creating with ID:', activeChatId);
                    const chatTitle = question.length > 50 ? question.substring(0, 50) + '...' : question;
                    console.log('Creating chat with title:', chatTitle);
                    const result = await chatApi.create({
                        userId,
                        title: chatTitle,
                        chatId: activeChatId
                    });

                    if (!result.success) {
                        console.error('Failed to create chat with specific ID:', activeChatId);
                        // If we can't create the chat, we can't save messages - abort
                        setIsTyping(false);
                        return;
                    }
                    console.log('Chat created with specific ID:', activeChatId);
                }
            } catch (error) {
                console.error('Failed to verify/create chat:', error);
                console.log('Assuming chat does not exist and attempting to create it...');
                // If we can't verify the chat (e.g., database tables don't exist), 
                // assume it doesn't exist and try to create it
                try {
                    const chatTitle = question.length > 50 ? question.substring(0, 50) + '...' : question;
                    console.log('Creating chat with title (fallback):', chatTitle);
                    const result = await chatApi.create({
                        userId,
                        title: chatTitle,
                        chatId: activeChatId
                    });

                    if (!result.success) {
                        console.error('Failed to create chat (fallback):', result);
                        setIsTyping(false);
                        return;
                    }
                    console.log('Chat created successfully (fallback):', activeChatId);
                } catch (createError) {
                    console.error('Failed to create chat in fallback:', createError);
                    setIsTyping(false);
                    return;
                }
            }
        }

        // Create and save user message
        console.log('Creating user message...');
        const userMessageId = nanoid();
        const userMessage: ChatMessage = {
            id: userMessageId,
            content: question,
            role: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setSelectedDocuments([]);

        // Save user message to database
        if (activeChatId) {
            try {
                await messagesApi.save({
                    messageId: userMessageId,
                    chatId: activeChatId,
                    content: question,
                    role: 'user'
                });
                console.log('User message saved to database');
            } catch (error) {
                console.error('Failed to save user message:', error);
                console.error('Chat ID:', activeChatId, 'Message ID:', userMessageId);
            }
        } else {
            console.error('No valid chat ID available for saving user message');
        }

        // Create assistant message placeholder
        const targetMessageId = nanoid();
        // Determine document count for status message
        let documentCount = 0;
        if (selectedDocuments.length > 0) {
            documentCount = selectedDocuments.length;
        } else {
            const documentIds = extractDocumentIdFromQuestion(question, documents);
            documentCount = documentIds.length;
        }
        // Determine status message based on document selection
        const statusMessage = getStatusMessage(selectedDocuments, question, documents);
        const assistantMessage: ChatMessage = {
            id: targetMessageId,
            content: '',
            role: 'assistant',
            timestamp: new Date(),
            isStreaming: true,
            status: statusMessage,
            documentCount: documentCount // Store document count for later use
        };

        setMessages(prev => [...prev, assistantMessage]);
        // Initialize ref for new streaming message
        if (assistantMessage.id) {
            messageContentRef.current.set(assistantMessage.id, assistantMessage.content);
        }
        setStreamingMessageId(targetMessageId);

        // Start streaming with the specific message ID and chat ID
        console.log('About to start streaming:', { question, targetMessageId, activeChatId });
        handleStreamChat(question, targetMessageId, activeChatId);
    }, [inputValue, isTyping, handleStreamChat, currentChatId, userId, user, hasQuestionTextResult, getStatusMessage, extractDocumentIdFromQuestion, selectedDocuments, documents]);

    return (
        <div className="flex w-full h-full flex-col overflow-hidden border bg-background">
            {/* Conversation Area */}
            <Conversation className="flex-1">
                <ConversationContent className="space-y-4">
                    {messages.map((message) => (
                        <div key={message.id} className="space-y-3">
                            <Message from={message.role}>
                                <MessageContent>
                                    {message.status ? (
                                        <div className="flex items-center gap-2">
                                            <Loader size={14} />
                                            <span className="text-muted-foreground text-sm">{message.status}</span>
                                        </div>
                                    ) : message.isStreaming && message.content === '' ? (
                                        <div className="flex items-center gap-2">
                                            <Loader size={14} />
                                            <span className="text-muted-foreground text-sm">
                                                {(() => {
                                                    // Use stored documentCount if available, otherwise determine from previous user message
                                                    if (message.documentCount !== undefined) {
                                                        if (message.documentCount === 1) {
                                                            return 'searching and analysing single document';
                                                        } else if (message.documentCount > 1) {
                                                            return `searching and analysing ${message.documentCount} documents`;
                                                        } else {
                                                            return 'searching and analysing all documents';
                                                        }
                                                    }
                                                    // Fallback: determine status from previous user message
                                                    const messageIndex = messages.findIndex(m => m.id === message.id);
                                                    const previousUserMessage = messageIndex > 0 ? messages[messageIndex - 1] : null;
                                                    const userQuestion = previousUserMessage?.role === 'user' ? previousUserMessage.content : '';
                                                    return getStatusMessage([], userQuestion, documents);
                                                })()}
                                            </span>
                                        </div>
                                    ) : message.role === 'assistant' ? (
                                        // Determine if this is an all-documents query by checking the previous user message
                                        (() => {
                                            const messageIndex = messages.findIndex(m => m.id === message.id);
                                            const previousUserMessage = messageIndex > 0 ? messages[messageIndex - 1] : null;
                                            const userQuestion = previousUserMessage?.role === 'user' ? previousUserMessage.content : '';
                                            const isAllDocumentsQuery = !hasDocumentTag(userQuestion, documents);

                                            // Show multi-document response if:
                                            // 1. responseType is 'all_documents', OR
                                            // 2. documentsAnalyzed > 1, OR
                                            // 3. user is querying all documents (no document tag)
                                            return message.responseType === 'all_documents' ||
                                                (message.documentsAnalyzed && message.documentsAnalyzed > 1) ||
                                                isAllDocumentsQuery;
                                        })() ? (
                                            // Multi-document response
                                            <MultiDocumentResponse
                                                answer={message.content}
                                                documentSummaries={message.documentSummaries || []}
                                                totalDocuments={message.totalDocuments || 0}
                                                documentsAnalyzed={message.documentsAnalyzed || 0}
                                                sources={message.sources}
                                                citations={message.citations}
                                                onViewDocumentSources={(documentId) => {
                                                    // Filter sources by document ID
                                                    console.log('View sources for document:', documentId);
                                                }}
                                            />
                                        ) : (
                                            // Single document response (default) - use MarkdownResponse
                                            <div className="space-y-2">
                                                {message.responseType === 'single_document' && (
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            <FileText className="h-3 w-3 mr-1" />
                                                            Single Document
                                                        </Badge>
                                                    </div>
                                                )}
                                                <MarkdownResponse
                                                    answer={message.content}
                                                    citations={message.citations || []}
                                                    sources={message.sources}
                                                    responseType={message.responseType || 'single_document'}
                                                />
                                            </div>
                                        )
                                    ) : (
                                        // User message
                                        message.content
                                    )}
                                </MessageContent>
                                <MessageAvatar
                                    src={message.role === 'user' ? (userProfileImage || '/images/default-user.png') : '/images/intreli-logo.png'}
                                    name={message.role === 'user' ? (user?.firstName || 'User') : 'Intreli AI'}
                                />
                            </Message>

                            {/* Reasoning */}
                            {message.reasoning && (
                                <div className="ml-10">
                                    <Reasoning isStreaming={message.isStreaming} defaultOpen={false}>
                                        <ReasoningTrigger />
                                        <ReasoningContent>{message.reasoning}</ReasoningContent>
                                    </Reasoning>
                                </div>
                            )}

                            {/* Sources section removed - REFERENCES section handles source display */}
                        </div>
                    ))}
                </ConversationContent>
                <ConversationScrollButton />
            </Conversation>

            {/* Input Area */}
            <div className="border-t p-4 relative">
                {/* Selected Documents Chips */}
                {selectedDocuments.length > 0 && (
                    <div className="mb-2">
                        <div className="text-xs font-medium text-muted-foreground mb-1.5 px-1">
                            Context Used
                        </div>
                        <SelectedDocumentChips
                            documents={selectedDocuments}
                            onRemove={(documentId) => {
                                setSelectedDocuments(prev =>
                                    prev.filter(doc => String(doc.id) !== String(documentId))
                                );
                            }}
                        />
                    </div>
                )}

                <PromptInput onSubmit={handleSubmit}>
                    <PromptInputTextarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                        }}
                        onCursorPositionChange={(pos) => {
                            // Only update cursor position state when it actually changes
                            // This prevents unnecessary re-renders
                            setCursorPosition(prevPos => prevPos !== pos ? pos : prevPos);
                        }}
                        onAutocompleteKeyDown={handleAutocompleteKeyDown}
                        placeholder="Type @ or @- to query a specific document, or ask questions to search across all documents"
                        disabled={isTyping}
                        documents={documents}
                    />
                    <PromptInputToolbar className='flex items-center justify-between'>
                        <div className="flex items-center gap-2">
                            <DocumentSelector
                                documents={documents}
                                selectedDocuments={selectedDocuments}
                                onSelectionChange={setSelectedDocuments}
                            />
                        </div>
                        <PromptInputSubmit
                            disabled={!inputValue.trim() || isTyping || !hasQuestionTextResult}
                            status={isTyping ? 'streaming' : 'ready'}
                        />
                    </PromptInputToolbar>
                </PromptInput>

                {/* Document Autocomplete Dropdown */}
                {isAutocompleteOpen && (
                    <DocumentAutocomplete
                        isOpen={isAutocompleteOpen}
                        documents={filteredDocuments}
                        selectedIndex={selectedIndex}
                        triggerPosition={triggerPosition}
                        textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
                        onSelect={handleAutocompleteSelect}
                        onClose={closeAutocomplete}
                    />
                )}
            </div>
        </div>
    );
};

export default StreamChat;