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
import { DocumentAutocomplete } from '@/components/DocumentAutocomplete';
import { MultiDocumentResponse } from '@/components/MultiDocumentResponse';
import { MarkdownResponse } from '@/components/MarkdownResponse';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

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
};


interface ChatInterfaceProps {
    chatId: string | null;
    userId: string; // Add userId prop
}

const ML_SERVER_URL = process.env.NEXT_PUBLIC_ML_SERVER_URL || 'http://localhost:8000/';
const StreamChat = ({ chatId, userId }: ChatInterfaceProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [, setIsLoadingChat] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
    const [currentChatId, setCurrentChatId] = useState<string | null>(chatId);
    const [cursorPosition, setCursorPosition] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const savedMessageIdsRef = useRef<Set<string>>(new Set());
    const fallbackTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const messageContentRef = useRef<Map<string, string>>(new Map());

    const { user } = useUser();

    const userProfileImage = user?.imageUrl;

    // Fetch documents with React Query caching
    const { data: documents = [] } = useQuery<Document[]>({
        queryKey: ['documents', userId],
        queryFn: async () => {
            const response = await api.get(`/api/v1/documents?userId=${userId}`);
            console.log('Documents fetched:', response.data.documents);
            return response.data.documents || [];
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
    const extractDocumentIdFromQuestion = useCallback((text: string, docs: Document[]): string | null => {
        if (!text.trim() || !docs.length) return null;

        const tagRegex = /@-([^\s]+)/g;
        let match;

        while ((match = tagRegex.exec(text)) !== null) {
            const tagName = match[1];
            // Find matching document (case-insensitive, supports partial matches)
            const matchingDoc = docs.find(doc =>
                doc.name.toLowerCase() === tagName.toLowerCase() ||
                doc.name.toLowerCase().includes(tagName.toLowerCase())
            );

            if (matchingDoc) {
                // Return document ID as string (ML server expects string)
                return String(matchingDoc.id);
            }
        }

        return null;
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

    const handleStreamChat = useCallback(async (question: string, messageId?: string, chatIdForSaving?: string) => {
        const targetMessageId = messageId || streamingMessageId;
        const activeChatId = chatIdForSaving || currentChatId;

        // Extract document ID from question if document tag is present
        const documentId = extractDocumentIdFromQuestion(question, documents);

        console.log('Starting stream chat with userId:', userId, 'question:', question, 'messageId:', targetMessageId, 'documentId:', documentId);
        try {
            // Build request payload - include documentId if found
            const requestPayload: {
                question: string;
                userId: string;
                documentId?: string;
            } = {
                question,
                userId
            };

            // Include documentId if we successfully extracted it
            if (documentId) {
                requestPayload.documentId = documentId;
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
                                // Update status message
                                setMessages(prev => prev.map(msg => {
                                    if (msg.id === targetMessageId) {
                                        return {
                                            ...msg,
                                            status: data.message
                                        };
                                    }
                                    return msg;
                                }));

                            } else if (data.type === 'done') {
                                // Mark streaming as complete
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
                                const citationsFromDone = (data.citations || []).map((cite: CitationData) => ({
                                    ...cite,
                                    label: normalizeCitationLabel(cite.label || '')
                                }));

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
                                    finalCitations: finalCitations
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
    }, [userId, streamingMessageId, currentChatId, saveAssistantMessage, hasDocumentTag, documents, extractDocumentIdFromQuestion]);

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
        const assistantMessage: ChatMessage = {
            id: targetMessageId,
            content: '',
            role: 'assistant',
            timestamp: new Date(),
            isStreaming: true,
            status: 'Thinking...'
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
    }, [inputValue, isTyping, handleStreamChat, currentChatId, userId, user, hasQuestionTextResult]);

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
                                            <span className="text-muted-foreground text-sm">Thinking...</span>
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
                    <PromptInputToolbar className='flex justify-end'>
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