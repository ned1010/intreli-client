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
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ui/shadcn-io/ai/source';
import { nanoid } from 'nanoid';
import { type FormEventHandler, useCallback, useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { chatApi, messagesApi } from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Document } from '@/types/types';
import { useDocumentAutocomplete } from '@/hooks/use-document-autocomplete';
import { DocumentAutocomplete } from '@/components/DocumentAutocomplete';
import { MultiDocumentResponse } from '@/components/MultiDocumentResponse';
import { Badge } from '@/components/ui/badge';
import { Response } from '@/components/ui/shadcn-io/ai/response';
import { FileText } from 'lucide-react';

type ChatMessage = {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: Date;
    reasoning?: string;
    sources?: Array<SourceData>;
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
};

type SourceData = {
    chunk_id?: string;
    chunk_text?: string;
    label?: string;
    page?: number | string;
    pdf_name?: string;
    score?: number;
};

interface ChatInterfaceProps {
    chatId: string | null;
    userId: string; // Add userId prop
}

const ML_SERVER_URL = process.env.NEXT_PUBLIC_ML_SERVER_URL || 'http://localhost:8000/';
const StreamChat = ({ chatId, userId }: ChatInterfaceProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
    const [currentChatId, setCurrentChatId] = useState<string | null>(chatId);
    const [cursorPosition, setCursorPosition] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        debounceMs: 100 // Reduced debounce for faster response
    });

    // Debug: Log documents and autocomplete state (moved after hook initialization)
    useEffect(() => {
        console.log('Autocomplete state:', {
            isAutocompleteOpen,
            documentsCount: documents.length,
            filteredCount: filteredDocuments.length,
            cursorPosition,
            inputValue: inputValue.substring(0, 50),
            triggerPosition
        });
    }, [isAutocompleteOpen, documents.length, filteredDocuments.length, cursorPosition, inputValue, triggerPosition]);

    console.log("This is a message", messages)

    // Helper function to save assistant messages
    const saveAssistantMessage = useCallback(async (messageId: string, chatId: string, content: string, reasoning?: string, sources?: Array<SourceData>) => {
        if (!messageId || !chatId || !content) {
            console.log('Skipping save - missing required data for assistant message');
            return;
        }

        try {
            console.log('Saving assistant message:', { messageId, chatId, contentLength: content.length });
            await messagesApi.save({
                messageId,
                chatId,
                content,
                role: 'assistant',
                reasoning: reasoning || undefined,
                sources: sources || undefined
            });
            console.log('Assistant message saved successfully');
        } catch (error) {
            console.error('Failed to save assistant message:', error);
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
                        // Convert API messages to component format
                        const formattedMessages = result.messages.map(msg => ({
                            id: msg.id,
                            content: msg.content,
                            role: msg.role === 'system' ? 'assistant' : msg.role, // Convert 'system' back to 'assistant' for display
                            timestamp: new Date(msg.createdAt),
                            reasoning: msg.reasoning,
                            sources: msg.sources || [],
                            status: msg.status
                        }));
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

    const handleStreamChat = useCallback(async (question: string, messageId?: string, chatIdForSaving?: string) => {
        const targetMessageId = messageId || streamingMessageId;
        const activeChatId = chatIdForSaving || currentChatId;
        console.log('Starting stream chat with userId:', userId, 'question:', question, 'messageId:', targetMessageId);
        try {
            const response = await fetch(`${ML_SERVER_URL}/api/ml/streamchat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question,
                    userId
                })
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
                if (done) break;

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
                                setMessages(prev => {
                                    const updated = prev.map(msg => {
                                        if (msg.id === targetMessageId) {
                                            const newContent = msg.content + data.content;
                                            console.log('Updating message ID:', msg.id, 'New content length:', newContent.length);
                                            return {
                                                ...msg,
                                                content: newContent,
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
                                console.log('Stream completed. Full response:', data.full_response);
                                console.log('Response type:', data.response_type);
                                console.log('Document summaries:', data.document_summaries);

                                let finalContent = '';
                                let finalSources: Array<SourceData> = [];
                                let finalReasoning = '';

                                setMessages(prev => {
                                    const updated = prev.map(msg => {
                                        if (msg.id === targetMessageId) {
                                            finalContent = msg.content;
                                            finalSources = msg.sources || [];
                                            finalReasoning = msg.reasoning || '';

                                            // Detect response type and store metadata
                                            const responseType = data.response_type ||
                                                (data.documents_analyzed && data.documents_analyzed > 1 ? 'all_documents' : 'single_document');

                                            return {
                                                ...msg,
                                                isStreaming: false,
                                                status: undefined,
                                                responseType: responseType,
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

                                setIsTyping(false);
                                setStreamingMessageId(null);

                                // Save assistant message to database
                                console.log('Attempting to save message:', {
                                    activeChatId,
                                    finalContent: finalContent?.length,
                                    targetMessageId,
                                    hasContent: !!finalContent
                                });

                                if (activeChatId && finalContent && targetMessageId) {
                                    await saveAssistantMessage(targetMessageId, activeChatId, finalContent, finalReasoning, finalSources);
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
                if (msg.id === streamingMessageId) {
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
            setTimeout(async () => {
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
                    return currentMessages;
                });
            }, 1000); // Wait 1 second to ensure state is updated
        }
    }, [userId, streamingMessageId, currentChatId, saveAssistantMessage]);

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

    const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(async (event) => {
        event.preventDefault();

        if (!inputValue.trim() || isTyping) {
            console.log('Submit blocked:', { inputEmpty: !inputValue.trim(), isTyping });
            return;
        }

        // Check if there's actual question text (not just document tags)
        if (!hasQuestionText(inputValue, documents)) {
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
        setStreamingMessageId(targetMessageId);

        // Start streaming with the specific message ID and chat ID
        console.log('About to start streaming:', { question, targetMessageId, activeChatId });
        handleStreamChat(question, targetMessageId, activeChatId);
    }, [inputValue, isTyping, handleStreamChat, currentChatId, userId, user, documents, hasQuestionText]);

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
                                    ) : message.role === 'assistant' &&
                                        (message.responseType === 'all_documents' ||
                                            (message.documentsAnalyzed && message.documentsAnalyzed > 1)) ? (
                                        // Multi-document response
                                        <MultiDocumentResponse
                                            answer={message.content}
                                            documentSummaries={message.documentSummaries || []}
                                            totalDocuments={message.totalDocuments || 0}
                                            documentsAnalyzed={message.documentsAnalyzed || 0}
                                            sources={message.sources}
                                            onViewDocumentSources={(documentId) => {
                                                // Filter sources by document ID
                                                console.log('View sources for document:', documentId);
                                            }}
                                        />
                                    ) : message.role === 'assistant' && message.responseType === 'single_document' ? (
                                        // Single document response with indicator
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    <FileText className="h-3 w-3 mr-1" />
                                                    Single Document
                                                </Badge>
                                            </div>
                                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                                <Response>{message.content}</Response>
                                            </div>
                                        </div>
                                    ) : (
                                        // User message or default
                                        message.role === 'user' ? message.content : (
                                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                                <Response>{message.content}</Response>
                                            </div>
                                        )
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

                            {/* Sources - Hide if server indicates no relevant information found */}
                            {message.hasRelevantInformation !== false && message.sources && message.sources.length > 0 ? (
                                <div className="ml-10">
                                    <Sources>
                                        <SourcesTrigger count={message.sources.length} />
                                        <SourcesContent>
                                            {/* Group sources by document if multi-document response */}
                                            {message.responseType === 'all_documents' && message.documentsAnalyzed && message.documentsAnalyzed > 1 ? (
                                                (() => {
                                                    // Group sources by document name
                                                    const sourcesByDoc = message.sources.reduce((acc, source) => {
                                                        const docName = source.pdf_name || 'Unknown';
                                                        if (!acc[docName]) {
                                                            acc[docName] = [];
                                                        }
                                                        acc[docName].push(source);
                                                        return acc;
                                                    }, {} as Record<string, typeof message.sources>);

                                                    return Object.entries(sourcesByDoc).map(([docName, docSources]) => (
                                                        <div key={docName} className="mb-4 last:mb-0">
                                                            <h4 className="text-xs font-semibold text-foreground mb-2">
                                                                {docName} ({docSources.length} source{docSources.length !== 1 ? 's' : ''})
                                                            </h4>
                                                            <div className="space-y-2 pl-4 border-l-2 border-muted">
                                                                {docSources.map((source) => (
                                                                    <Source
                                                                        key={source.chunk_id}
                                                                        title={`${source.pdf_name} - Page ${source.page} (Score: ${source.score?.toFixed(3)})`}
                                                                    >
                                                                        <div className="space-y-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                                                                    {source.label}
                                                                                </span>
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    Page {source.page}
                                                                                </span>
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    Score: {source.score?.toFixed(3)}
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded border-l-2 border-blue-200">
                                                                                {source.chunk_text}
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground truncate">
                                                                                ID: {source.chunk_id}
                                                                            </div>
                                                                        </div>
                                                                    </Source>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ));
                                                })()
                                            ) : (
                                                // Single document or regular display
                                                message.sources.map((source) => (
                                                    <Source
                                                        key={source.chunk_id}
                                                        title={`${source.pdf_name} - Page ${source.page} (Score: ${source.score?.toFixed(3)})`}
                                                    >
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                                                    {source.label}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    Page {source.page}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    Score: {source.score?.toFixed(3)}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded border-l-2 border-blue-200">
                                                                {source.chunk_text}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground truncate">
                                                                ID: {source.chunk_id}
                                                            </div>
                                                        </div>
                                                    </Source>
                                                ))
                                            )}
                                        </SourcesContent>
                                    </Sources>
                                </div>
                            ) : null}
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
                            setCursorPosition(pos);
                        }}
                        onAutocompleteKeyDown={handleAutocompleteKeyDown}
                        placeholder="Type @ or @- to query a specific document, or ask questions to search across all documents"
                        disabled={isTyping}
                        documents={documents}
                    />
                    <PromptInputToolbar className='flex justify-end'>
                        <PromptInputSubmit
                            disabled={!inputValue.trim() || isTyping || !hasQuestionText(inputValue, documents)}
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

                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                        <div>Debug Info:</div>
                        <div>Documents: {documents.length}</div>
                        <div>Autocomplete Open: {isAutocompleteOpen ? 'Yes' : 'No'}</div>
                        <div>Filtered: {filteredDocuments.length}</div>
                        <div>Cursor: {cursorPosition}</div>
                        <div>Input: &quot;{inputValue.substring(Math.max(0, cursorPosition - 10), cursorPosition + 10)}&quot;</div>
                        <div>Trigger: {triggerPosition ? `@${triggerPosition.query}` : 'None'}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StreamChat;