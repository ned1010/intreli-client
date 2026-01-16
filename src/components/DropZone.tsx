"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    CloudUpload,
    FileText,
    FileSpreadsheet,
    Presentation,
    Image,
    File,
    CheckCircle2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { useDocumentProgress } from '@/hooks/use-document-progress';
import { DocumentProgressBar } from './DocumentProgressBar';
import { useRouter, usePathname } from 'next/navigation';
import { nanoid } from 'nanoid';

interface DropzoneProps {
    className?: string;
}

interface UploadState {
    documentId: string;
    fileName: string;
    isCancelling?: boolean;
}

export function Dropzone({ className = "" }: DropzoneProps) {

    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeUploads, setActiveUploads] = useState<Map<string, UploadState>>(new Map());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useUser();
    const queryClient = useQueryClient();
    const router = useRouter();
    const pathname = usePathname();
    const previousPathnameRef = useRef<string | null>(null);


    // const {sessionClaims} = useAuth();
    // Authorization: `Bearer ${sessionClaims}`

    // Upload mutation - handles single file
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', user?.id || '');
            formData.append('name', file.name);

            const response = await api.post('/api/v1/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 30000, // 30 seconds for uploads (S3 + DB operations)
            });
            return { ...response.data, fileName: file.name };
        },
        onSuccess: (data, file) => {
            // Dismiss loading toast
            toast.dismiss();
            setError(null);

            if (data && data.success && data.document) {
                const documentId = data.document.id;
                const fileName = data.document.name || file.name;

                // Add to active uploads to track progress
                setActiveUploads(prev => {
                    const newMap = new Map(prev);
                    newMap.set(documentId, { documentId, fileName });
                    return newMap;
                });

                // Invalidate and refetch documents
                queryClient.invalidateQueries({ queryKey: ['documents', user?.id] });
            } else {
                toast.error(data?.message || 'Upload completed but no document data received');
                setError(data?.message || 'Upload failed');
            }

            // Reset uploading state - individual file upload is complete
            // Note: isUploading tracks if we're currently uploading files, not processing
            setIsUploading(false);
            
            // Reset file input to allow selecting the same file again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
        onError: (error: Error & { response?: { status?: number; data?: { message?: string } } }) => {
            // Dismiss loading toast
            toast.dismiss();

            // Extract error message and status from response
            const status = error?.response?.status;
            const errorMessage = error?.response?.data?.message || error.message || 'Unknown error';
            setError(errorMessage);

            // Check if duplicate document (409 Conflict)
            if (status === 409) {
                toast.error('Document not uploaded - duplicate document detected. Document already exists in the database');
            } else {
                toast.error('Upload failed: ' + errorMessage);
            }

            // Reset uploading state
            setIsUploading(false);
            
            // Reset file input on error too
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
    });


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const fileArray = Array.from(files);
            
            // Show loading toast for multiple files
            if (fileArray.length > 1) {
                toast.loading(`Uploading ${fileArray.length} documents...`, {
                    duration: Infinity,
                });
            } else {
                toast.loading('Uploading document...', {
                    duration: Infinity,
                });
            }

            // Upload each file independently
            fileArray.forEach((file) => {
                setIsUploading(true);
                uploadMutation.mutate(file);
            });
        }
    };

    const handleClick = () => {
        if (!isUploading) {
            fileInputRef.current?.click();
        }
    };


    // Handle cancellation
    const handleCancel = async (documentId: string) => {
        const upload = activeUploads.get(documentId);
        if (!upload) return;

        // Set cancelling state
        setActiveUploads(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(documentId);
            if (existing) {
                newMap.set(documentId, { ...existing, isCancelling: true });
            }
            return newMap;
        });

        try {
            // Call DELETE endpoint
            await api.delete(`/api/v1/documents/${documentId}?userId=${user?.id || ''}`);
            
            // Remove from active uploads
            setActiveUploads(prev => {
                const newMap = new Map(prev);
                newMap.delete(documentId);
                return newMap;
            });

            toast.success('Document upload cancelled');
            queryClient.invalidateQueries({ queryKey: ['documents', user?.id] });
        } catch (error: unknown) {
            console.error('Error cancelling document:', error);
            const errorMessage = error && typeof error === 'object' && 'response' in error
                ? (error as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message || (error as { message?: string }).message
                : error instanceof Error
                ? error.message
                : 'Failed to cancel upload';
            toast.error('Failed to cancel: ' + errorMessage);
            
            // Reset cancelling state on error
            setActiveUploads(prev => {
                const newMap = new Map(prev);
                const existing = newMap.get(documentId);
                if (existing) {
                    newMap.set(documentId, { ...existing, isCancelling: false });
                }
                return newMap;
            });
        }
    };

    // Component to track individual document progress
    const DocumentProgressTracker = ({ documentId, fileName, isCancelling }: UploadState) => {
        const { status, progress, error, cancel } = useDocumentProgress(documentId, user?.id || null, true);

        // Handle completion - show toast but don't auto-remove
        useEffect(() => {
            if (status === 'completed') {
                toast.success(`${fileName} is ready! You can now ask questions about it.`);
            }
        }, [status, fileName]);

        const handleOpen = () => {
            // Generate a new chat ID and navigate with document name
            const newChatId = nanoid();
            router.push(`/chat/${newChatId}?documentName=${encodeURIComponent(fileName)}`);
        };

        const handleClose = () => {
            setActiveUploads(prev => {
                const newMap = new Map(prev);
                newMap.delete(documentId);
                return newMap;
            });
        };

        const handleCancelClick = () => {
            // Stop polling first
            cancel();
            // Then call the cancel handler
            handleCancel(documentId);
        };

        if (!status) {
            return null;
        }

        return (
            <DocumentProgressBar
                documentId={documentId}
                fileName={fileName}
                status={status}
                progress={progress}
                errorMessage={error}
                onOpen={status === 'completed' ? handleOpen : undefined}
                onClose={handleClose}
                onCancel={handleCancelClick}
                isCancelling={isCancelling}
            />
        );
    };

    // Cleanup on pathname change (navigation away from knowledge-base page)
    useEffect(() => {
        const isKnowledgeBasePage = pathname?.includes('/knowledge-base');
        const wasKnowledgeBasePage = previousPathnameRef.current?.includes('/knowledge-base');
        
        // If we were on knowledge-base page and navigated away, clean up progress bars
        if (wasKnowledgeBasePage && !isKnowledgeBasePage && previousPathnameRef.current !== null) {
            setActiveUploads(new Map());
        }
        
        previousPathnameRef.current = pathname;
    }, [pathname]);

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Progress Bars for Active Uploads */}
            {Array.from(activeUploads.values()).length > 0 && (
                <div className="space-y-3">
                    {Array.from(activeUploads.values()).map((upload) => (
                        <DocumentProgressTracker
                            key={upload.documentId}
                            documentId={upload.documentId}
                            fileName={upload.fileName}
                            isCancelling={upload.isCancelling}
                        />
                    ))}
                </div>
            )}

            {/* Dropzone Card */}

            <Card className="overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <CloudUpload className="h-5 w-5 text-blue-600" />
                        Document Upload for AI Knowledge Base
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Upload documents to make them available for GPT-5 nano AI chat responses
                    </p>
                </CardHeader>

                <CardContent>
                    <div
                        className={`
              relative border-2 border-dashed border-gray-300 dark:border-gray-600
              transition-all duration-300 ease-out overflow-hidden rounded-lg
              ${isUploading ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'}
            `}
                        onClick={handleClick}
                    >
                        <div className="p-12 text-center">
                            <div
                                className={`
                  mx-auto w-20 h-20 mb-6 flex items-center justify-center rounded-full
                  bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700
                  text-gray-500 dark:text-gray-400 hover:scale-105 transition-transform duration-300
                `}
                            >
                                <CloudUpload className="w-10 h-10" />
                            </div>

                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                {isUploading ? 'Uploading...' : 'Upload Documents for AI'}
                            </h3>

                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                {isUploading ? 'Please wait while your document is being uploaded' : 'Click to browse and select PDF files'}
                            </p>

                            <div className="grid grid-cols-3 gap-3 text-xs text-gray-400 dark:text-gray-500 max-w-lg mx-auto mb-6">
                                <div className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" /> PDF, Word
                                </div>
                                <div className="flex items-center gap-1">
                                    <FileSpreadsheet className="w-3 h-3" /> Excel, CSV
                                </div>
                                <div className="flex items-center gap-1">
                                    <Presentation className="w-3 h-3" /> PowerPoint
                                </div>
                                <div className="flex items-center gap-1">
                                    <Image className="w-3 h-3" aria-hidden="true" /> Images
                                </div>
                                <div className="flex items-center gap-1">
                                    <File className="w-3 h-3" /> Text, Markdown
                                </div>
                                <div className="flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> AI Ready
                                </div>
                            </div>

                            <Badge variant="outline" className="text-xs">
                                PDF only • Up to 50MB • AI Knowledge Base
                            </Badge>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf"
                            multiple
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </div>
                </CardContent>
            </Card>


        </div>
    );
}
