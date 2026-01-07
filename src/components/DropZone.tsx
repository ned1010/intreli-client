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
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import api from '@/lib/axios';
import { toast } from 'sonner';

interface DropzoneProps {
    className?: string;
}

export function Dropzone({ className = "" }: DropzoneProps) {

    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useUser();
    const queryClient = useQueryClient();


    // const {sessionClaims} = useAuth();
    // Authorization: `Bearer ${sessionClaims}`

    // Upload mutation
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', user?.id || '');
            formData.append('name', file.name);

            const response = await api.post('/api/v1/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data', },
            });
            console.log('File upload data', response.data)
            return response.data;
        },
        onSuccess: (data) => {
            console.log('Upload successful:', data);

            // Dismiss loading toast
            toast.dismiss();
            setError(null);

            if (data && data.success && data.document) {
                toast.success('Document uploaded successfully!');
                // Invalidate and refetch documents
                queryClient.invalidateQueries({ queryKey: ['documents', user?.id] });
            } else {
                toast.error(data?.message || 'Upload completed but no document data received');
                setError(data?.message || 'Upload failed');
            }

            setIsUploading(false);
            // Reset file input to allow selecting the same file again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
        onError: (error: Error & { response?: { data?: { message?: string } } }) => {
            console.error('Upload error:', error);

            // Dismiss loading toast
            toast.dismiss();

            // Extract error message from response
            const errorMessage = error?.response?.data?.message || error.message || 'Unknown error';
            setError(errorMessage);
            toast.error('Upload failed: ' + errorMessage);

            setIsUploading(false);
            // Reset file input on error too
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
    });


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            toast.loading('Uploading document...', {
                duration: Infinity, // Keep loading toast until manually dismissed
            });
            uploadMutation.mutate(file);
        }
    };

    const handleClick = () => {
        if (!isUploading) {
            fileInputRef.current?.click();
        }
    };


    return (
        <div className={`space-y-6 ${className}`}>
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
                                    <Image className="w-3 h-3" /> Images
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
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </div>
                </CardContent>
            </Card>


        </div>
    );
}
