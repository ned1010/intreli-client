import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';

interface DocumentStatus {
    id: string;
    name: string;
    status: 'uploading' | 'processing' | 'chunking' | 'embedding' | 'storing' | 'completed' | 'failed';
    progress: number;
    errorMessage: string | null;
}

interface UseDocumentProgressReturn {
    status: DocumentStatus['status'] | null;
    progress: number;
    error: string | null;
    isLoading: boolean;
    cancel: () => void;
}

export function useDocumentProgress(
    documentId: string | null,
    userId: string | null,
    enabled: boolean = true
): UseDocumentProgressReturn {
    const [status, setStatus] = useState<DocumentStatus['status'] | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isCancelled, setIsCancelled] = useState<boolean>(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const pollCountRef = useRef<number>(0);
    const maxPolls = 300; // 10 minutes at 2 second intervals

    const cancel = () => {
        setIsCancelled(true);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (!documentId || !userId || !enabled || isCancelled) {
            return;
        }

        // Reset cancelled state when documentId changes
        setIsCancelled(false);

        const pollStatus = async () => {
            // Don't poll if cancelled
            if (isCancelled) {
                return;
            }

            try {
                setIsLoading(true);
                const response = await api.get(
                    `/api/v1/documents/${documentId}/status?userId=${userId}`
                );

                // Check if cancelled during request
                if (isCancelled) {
                    return;
                }

                if (response.data.success && response.data.document) {
                    const doc = response.data.document;
                    setStatus(doc.status);
                    setProgress(doc.progress || 0);
                    setError(doc.errorMessage || null);

                    // Stop polling if document is completed or failed
                    if (doc.status === 'completed' || doc.status === 'failed') {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                        setIsLoading(false);
                        return;
                    }
                }
            } catch (err: unknown) {
                // Don't update state if cancelled
                if (isCancelled) {
                    return;
                }
                console.error('Error polling document status:', err);
                const errorMessage = err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                    : 'Failed to fetch document status';
                setError(errorMessage || 'Failed to fetch document status');
                // Continue polling on error (with exponential backoff could be added)
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                    pollCountRef.current += 1;

                    // Stop polling after max attempts
                    if (pollCountRef.current >= maxPolls) {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                        setError('Document processing timed out');
                    }
                }
            }
        };

        // Poll immediately, then every 2 seconds
        pollStatus();
        intervalRef.current = setInterval(pollStatus, 2000);

        // Cleanup on unmount or when dependencies change
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            pollCountRef.current = 0;
        };
    }, [documentId, userId, enabled, isCancelled]);

    return { status, progress, error, isLoading, cancel };
}

