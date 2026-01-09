'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronRight, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from '@/lib/axios';
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Document } from "@/types/types";
import { toast } from 'sonner';

export function Documents() {
    const { user, isLoaded, isSignedIn } = useUser();
    const queryClient = useQueryClient();

    // State for delete confirmation and success modals
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);

    console.log('Document to Delete', documentToDelete)
    const [isOpen, setIsOpen] = useState(false); // Start collapsed

    // Ensure user.id is not null - TypeScript will know it's non-null after this check
    const userId = isLoaded && isSignedIn && user?.id ? user.id : null;

    // Fetch documents with React Query
    const { data: documents = [], isLoading, error: queryError } = useQuery({
        queryKey: ['documents', userId],
        queryFn: async () => {
            console.log('Making API call to fetch documents for user:', userId);
            const response = await api.get(`/api/v1/documents?userId=${userId}`);
            console.log('API Response:', response.data);
            console.log('Documents from API:', response.data.documents);
            return response.data.documents || [];
        },
        enabled: !!userId,
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (documentId: string | number) => {
            console.log('Making API call to delete document to Node Server', documentId);
            console.log('User ID for deleting to Node Server', userId);

            // Show loading toast
            toast.loading('Deleting document...', {
                duration: Infinity, // Keep loading until manually dismissed
            });

            const response = await api.delete(`/api/v1/documents/${String(documentId)}?userId=${userId}`);
            return response.data;
        },
        onSuccess: () => {
            // Dismiss loading toast
            toast.dismiss();

            // Show success toast
            toast.success('Document deleted successfully');

            // Invalidate and refetch documents
            queryClient.invalidateQueries({ queryKey: ['documents', userId] });
            setDeleteDialogOpen(false);
            setSuccessDialogOpen(true);
            setDocumentToDelete(null);
        },
        onError: (error: Error & { response?: { data?: { message?: string } } }) => {
            console.error('Error deleting document:', error);

            // Dismiss loading toast
            toast.dismiss();

            // Extract error message from response
            const errorMessage = error?.response?.data?.message || error.message || 'Failed to delete document';
            toast.error('Delete failed: ' + errorMessage);

            // Keep dialog open on error so user can try again or cancel
        },
    });

    const isDeleting = deleteMutation.isPending;

    const handleDeleteClick = (doc: Document) => {
        // Prevent opening dialog if already deleting
        if (isDeleting) return;

        setDocumentToDelete(doc);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (documentToDelete) {
            deleteMutation.mutate(String(documentToDelete.id));
        }
    };

    const handleDialogOpenChange = (open: boolean) => {
        // Prevent closing dialog while deletion is in progress
        if (!isDeleting) {
            setDeleteDialogOpen(open);
            if (!open) {
                setDocumentToDelete(null);
            }
        }
    };

    const handleCloseSuccess = () => {
        setSuccessDialogOpen(false);
    };

    // Early return if user is not loaded or not signed in
    if (!isLoaded) {
        return (
            <div className="mt-4 flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!isSignedIn || !userId) {
        return (
            <div className="mt-4 p-4">
                <p className="text-sm text-muted-foreground">Please sign in to view your documents.</p>
            </div>
        );
    }

    return (
        <div className="mt-4">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-6 text-xs hover:bg-muted"
                    >
                        {isOpen ? (
                            <ChevronDown className="w-3 h-3 mr-1" />
                        ) : (
                            <ChevronRight className="w-3 h-3 mr-1" />
                        )}
                        {documents.length > 0
                            ? `${documents.length} content document`
                            : "View content"}
                    </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    {
                        true && (
                            <Card >
                                <CardHeader>
                                    <CardTitle className="text-lg">Your Documents</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                        {isLoading ? (
                                            <p className="text-sm text-gray-500">Loading documents...</p>
                                        ) : queryError ? (
                                            <p className="text-sm text-red-500">Error loading documents: {queryError.message}</p>
                                        ) : documents.length === 0 ? (
                                            <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                                        ) : (
                                            documents.map((doc: Document) => (
                                                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg ">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-5 h-5 text-blue-600" />
                                                        <div>
                                                            <p className="font-medium text-sm">{doc.name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(doc.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            onClick={() => handleDeleteClick(doc)}
                                                            disabled={isDeleting}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    }
                </CollapsibleContent>
            </Collapsible>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={handleDialogOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document</AlertDialogTitle>
                        <AlertDialogDescription>
                            {isDeleting ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Deleting document...</span>
                                </div>
                            ) : (
                                "Are you sure you want to delete this document? Once deleted, the document is permanently removed and you will not be able to recover it."
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                            {isDeleting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Deleting...
                                </span>
                            ) : (
                                'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Success Dialog */}
            <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Document Deleted</DialogTitle>
                        <DialogDescription>
                            Your document has been successfully removed
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={handleCloseSuccess}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}