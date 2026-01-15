"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ExternalLink, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentProgressBarProps {
    documentId: string;
    fileName: string;
    status: 'uploading' | 'processing' | 'chunking' | 'embedding' | 'storing' | 'completed' | 'failed';
    progress: number;
    errorMessage?: string | null;
    onClose?: () => void;
    onOpen?: () => void;
    onCancel?: () => void;
    isCancelling?: boolean;
}

export function DocumentProgressBar({
    documentId,
    fileName,
    status,
    progress,
    errorMessage,
    onClose,
    onOpen,
    onCancel,
    isCancelling = false,
}: DocumentProgressBarProps) {
    // Determine if we're in an active processing state (can be cancelled)
    const isActiveProcessing = ['uploading', 'processing', 'chunking', 'embedding', 'storing'].includes(status);
    // Determine UI stage and colors based on status
    const getStageInfo = () => {
        if (status === 'uploading') {
            return {
                stage: 1,
                stageLabel: 'STAGE 1',
                color: 'violet',
                spinnerColor: 'text-violet-600',
                progressColor: 'bg-violet-600',
                statusText: 'Uploading to S3...',
                showSpinner: true,
            };
        } else if (['processing', 'chunking', 'embedding', 'storing'].includes(status)) {
            return {
                stage: 2,
                stageLabel: 'STAGE 2',
                color: 'orange',
                spinnerColor: 'text-orange-500',
                progressColor: 'bg-orange-500',
                statusText: 'Ingestion & Embedding...',
                showSpinner: true,
            };
        } else if (status === 'completed') {
            return {
                stage: 3,
                stageLabel: 'DONE',
                color: 'green',
                spinnerColor: 'text-green-500',
                progressColor: 'bg-green-500',
                statusText: 'Ready to Chat',
                showSpinner: false,
            };
        } else {
            // failed
            return {
                stage: 0,
                stageLabel: 'FAILED',
                color: 'red',
                spinnerColor: 'text-red-500',
                progressColor: 'bg-red-500',
                statusText: errorMessage || 'Processing failed',
                showSpinner: false,
            };
        }
    };

    const stageInfo = getStageInfo();
    const displayProgress = status === 'completed' ? 100 : progress;

    return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-4">
                {/* Left: Spinner/Icon, File Name, Stage Badge */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {stageInfo.showSpinner ? (
                        <Loader2
                            className={cn(
                                "h-5 w-5 animate-spin flex-shrink-0",
                                stageInfo.spinnerColor
                            )}
                        />
                    ) : status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : null}

                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {fileName}
                        </span>
                        <Badge
                            variant="outline"
                            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-0.5 flex-shrink-0"
                        >
                            {stageInfo.stageLabel}
                        </Badge>
                    </div>
                </div>

                {/* Middle: Progress Bar, Percentage, Status Text */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                                className={cn(
                                    "h-full transition-all duration-300",
                                    stageInfo.progressColor
                                )}
                                style={{ width: `${displayProgress}%` }}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm flex-shrink-0">
                        <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {displayProgress}%
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {stageInfo.statusText}
                        </span>
                    </div>
                </div>

                {/* Right: Action Button (OPEN when completed), Cancel Button, and Close Button */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {status === 'completed' && onOpen && (
                        <Button
                            onClick={onOpen}
                            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 h-auto"
                            size="sm"
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Chat
                        </Button>
                    )}
                    {isActiveProcessing && onCancel && (
                        <button
                            onClick={onCancel}
                            disabled={isCancelling}
                            className={cn(
                                "text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors p-1",
                                isCancelling && "opacity-50 cursor-not-allowed"
                            )}
                            aria-label="Cancel upload"
                            title="Cancel document processing"
                        >
                            {isCancelling ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <X className="h-4 w-4" />
                            )}
                        </button>
                    )}
                    {!isActiveProcessing && onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Error Message Display */}
            {status === 'failed' && errorMessage && (
                <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
                    {errorMessage}
                </div>
            )}
        </div>
    );
}

