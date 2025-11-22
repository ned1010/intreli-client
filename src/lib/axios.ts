import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5500/',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, //10 seconds
})

// Types

//Source Type
type SourceData = {
    chunk_id?: string;
    chunk_text?: string;
    label?: string;
    page?: number | string;
    pdf_name?: string;
    score?: number;
};
export interface ChatMessage {
    id: string;
    chatId: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    reasoning?: string;
    sources?: Array<SourceData>;
    status?: string;
    createdAt: string;
}

export interface Chat {
    id: string;
    title: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    documentId?: string;
}

export interface ChatWithMessages extends Chat {
    messages: ChatMessage[];
}

// Chat API
export const chatApi = {
    // Create a new chat
    create: async (data: { userId: string; title?: string; documentId?: string; chatId?: string }): Promise<{ success: boolean; chat: Chat }> => {
        const response = await api.post('/api/v1/chats', data);
        return response.data;
    },

    // Get user's chats
    getUserChats: async (userId: string): Promise<{ success: boolean; chats: Chat[] }> => {
        const response = await api.get(`/api/v1/chats/users/${userId}`);
        return response.data;
    },

    // Get chat with messages
    getChatWithMessages: async (chatId: string): Promise<{ success: boolean; chat: Chat; messages: ChatMessage[] }> => {
        const response = await api.get(`/api/v1/chats/${chatId}`);
        return response.data;
    },

    // Update chat title
    updateTitle: async (chatId: string, data: { title: string; userId: string }): Promise<{ success: boolean; chat: Chat }> => {
        const response = await api.put(`/api/v1/chats/${chatId}`, data);
        return response.data;
    },

    // Delete chat
    delete: async (chatId: string, userId: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete(`/api/v1/chats/${chatId}`, { data: { userId } });
        return response.data;
    }
};

// Messages API
export const messagesApi = {
    // Save a message
    save: async (data: {
        messageId: string;
        chatId: string;
        content: string;
        role: 'user' | 'assistant' | 'system';
        reasoning?: string;
        sources?: Array<SourceData>;
        status?: string;
    }): Promise<{ success: boolean; message: ChatMessage }> => {
        const response = await api.post('/api/v1/messages', data);
        return response.data;
    },

    // Update a message
    update: async (messageId: string, data: {
        content?: string;
        reasoning?: string;
        sources?: Array<SourceData>;
        status?: string;
    }): Promise<{ success: boolean; message: ChatMessage }> => {
        const response = await api.put(`/api/v1/messages/${messageId}`, data);
        return response.data;
    }
};

// Utility functions
export const apiUtils = {
    // Create a new chat and return its ID
    createNewChat: async (userId: string, title?: string): Promise<string> => {
        const result = await chatApi.create({ userId, title });
        if (result.success) {
            return result.chat.id;
        }
        throw new Error('Failed to create chat');
    },

    // Save user message
    saveUserMessage: async (chatId: string, messageId: string, content: string): Promise<void> => {
        await messagesApi.save({
            messageId,
            chatId,
            content,
            role: 'user'
        });
    },

    // Save assistant message
    saveAssistantMessage: async (chatId: string, messageId: string, content: string, reasoning?: string, sources?: Array<SourceData>): Promise<void> => {
        await messagesApi.save({
            messageId,
            chatId,
            content,
            role: 'assistant',
            reasoning,
            sources
        });
    }
};

export default api;