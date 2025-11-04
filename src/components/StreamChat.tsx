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
import { type FormEventHandler, useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { chatApi, messagesApi } from '@/lib/axios';

type ChatMessage = {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: Date;
    reasoning?: string;
    sources?: Array<{ source: string; page?: number | string; chunk_id?: string; preview?: string }>;
    isStreaming?: boolean;
    status?: string;
};

interface ChatInterfaceProps {
    chatId: string | null;
    userId: string; // Add userId prop
}

const StreamChat = ({ chatId, userId }: ChatInterfaceProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
    const [currentChatId, setCurrentChatId] = useState<string | null>(chatId);

    const { user } = useUser();

    const userProfileImage = user?.imageUrl;

    // Helper function to save assistant messages
    const saveAssistantMessage = useCallback(async (messageId: string, chatId: string, content: string, reasoning?: string, sources?: Array<{ source: string; page?: number | string; chunk_id?: string; preview?: string }>) => {
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
                sources: sources && sources.length > 0 ? sources : undefined
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
                            { source: "Getting Started Guide", page: "#" },
                            { source: "API Documentation", page: "#" }
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
            const response = await fetch('http://localhost:8000/api/ml/streamchat', {
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

                                let finalContent = '';
                                let finalSources: Array<{ source: string; page?: number | string; chunk_id?: string; preview?: string }> = [];
                                let finalReasoning = '';

                                setMessages(prev => {
                                    const updated = prev.map(msg => {
                                        if (msg.id === targetMessageId) {
                                            finalContent = msg.content;
                                            finalSources = msg.sources || [];
                                            finalReasoning = msg.reasoning || '';
                                            return {
                                                ...msg,
                                                isStreaming: false,
                                                status: undefined
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

    const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(async (event) => {
        event.preventDefault();

        if (!inputValue.trim() || isTyping) {
            console.log('Submit blocked:', { inputEmpty: !inputValue.trim(), isTyping });
            return;
        }

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
                    return;
                }
            } catch (error) {
                console.error('Failed to create new chat:', error);
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
                        return;
                    }
                    console.log('Chat created successfully (fallback):', activeChatId);
                } catch (createError) {
                    console.error('Failed to create chat in fallback:', createError);
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
        setIsTyping(true);

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
            status: 'Preparing...'
        };

        setMessages(prev => [...prev, assistantMessage]);
        setStreamingMessageId(targetMessageId);

        // Start streaming with the specific message ID and chat ID
        console.log('About to start streaming:', { question, targetMessageId, activeChatId });
        handleStreamChat(question, targetMessageId, activeChatId);
    }, [inputValue, isTyping, handleStreamChat, currentChatId, userId, user]);

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
                                            Stream completed. Full response:  </div>
                                    ) : (
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

                            {/* Sources */}
                            {message.sources && message.sources.length > 0 && (
                                <div className="ml-10">
                                    <Sources>
                                        <SourcesTrigger count={message.sources.length} />
                                        <SourcesContent>
                                            {message.sources.map((source, index) => (
                                                <Source
                                                    key={index}
                                                    href={source.page?.toString() || '#'}
                                                    title={`${source.source}${source.page ? ` - Page ${source.page}` : ''}`}
                                                >
                                                    {source.preview && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {source.preview}
                                                        </div>
                                                    )}
                                                </Source>
                                            ))}
                                        </SourcesContent>
                                    </Sources>
                                </div>
                            )}
                        </div>
                    ))}
                </ConversationContent>
                <ConversationScrollButton />
            </Conversation>

            {/* Input Area */}
            <div className="border-t p-4">
                <PromptInput onSubmit={handleSubmit}>
                    <PromptInputTextarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Query your knowledge base for information. I am ready to respond"
                        disabled={isTyping && isLoadingChat}

                    />
                    <PromptInputToolbar className='flex justify-end'>
                        <PromptInputSubmit
                            disabled={!inputValue.trim() || isTyping}
                            status={isTyping ? 'streaming' : 'ready'}
                        />
                    </PromptInputToolbar>
                </PromptInput>
            </div>
        </div>
    );
};

export default StreamChat;