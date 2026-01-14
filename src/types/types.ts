// Database Types
export type UserRole = "system" | "user";

export interface Document {
    id: number;
    name: string;
    userId: string;
    fileKey: string;
    filePath: string;
    fileSize: number;
    createdAt: Date;
}

export interface SourceData {
    label?: string;
    pdf_name?: string;
    page?: number | string;
    chunk_id?: string;
    score?: number;
    chunk_text?: string;
}

export interface CitationData {
    label: string;        // e.g., "[1]"
    pdf_name: string;
    page: string;
    chunk_id: string;
    score: number;
    relevance_text?: string;  // Merged/structured relevance snippet for display
    chunk_text?: string;       // Raw chunk text (backward compatibility)
}

export interface ChunkDetail {
    chunk_id: string;
    page: number;
    score: number;
    excerpt: string;
    full_text?: string;
    source_data?: SourceData;
}

export interface DocumentSummary {
    document_id: string;
    document_name: string;
    summary: string;
    relevance_score: number;
    chunks_used: number;
    chunks?: ChunkDetail[];
}

export interface Chat {
    id: number;
    pdfName: string;
    pdfUrl: string;
    createdAt: Date;
    userId: string;
    fileKey: string;
}

export interface Message {
    id: number;
    chatId: number;
    content: string;
    createdAt: Date;
    role: UserRole;
}

export interface UserSubscription {
    id: number;
    userId: string;
    stripeCustomerId: string;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    stripeCurrentPeriodEnd?: Date;
}

// Input types for creating new records (without auto-generated fields)
export interface CreateDocumentInput {
    name: string;
    userId: string;
    file_key: string;
    file_path: string;
    file_size: number;
}

export interface CreateChatInput {
    pdfName: string;
    pdfUrl: string;
    userId: string;
    fileKey: string;
}

export interface CreateMessageInput {
    chatId: number;
    content: string;
    role: UserRole;
}

export interface CreateUserSubscriptionInput {
    userId: string;
    stripeCustomerId: string;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    stripeCurrentPeriodEnd?: Date;
}