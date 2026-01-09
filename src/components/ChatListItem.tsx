'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { chatApi, Chat } from '@/lib/axios';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { MessageSquare } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ChatListItemProps {
    chat: Chat;
    userId: string;
    isActive?: boolean;
    onChatSelect?: (chatId: string) => void;
    onChatUpdate?: () => void;
}

export function ChatListItem({
    chat,
    userId,
    isActive = false,
    onChatSelect,
    onChatUpdate,
}: ChatListItemProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(chat.title);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus and select text when entering edit mode
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Update editValue when chat title changes externally
    useEffect(() => {
        if (!isEditing) {
            setEditValue(chat.title);
        }
    }, [chat.title, isEditing]);

    // Rename mutation
    const renameMutation = useMutation({
        mutationFn: async (newTitle: string) => {
            return await chatApi.updateTitle(chat.id, {
                title: newTitle.trim(),
                userId,
            });
        },
        onSuccess: () => {
            toast.success('Chat renamed successfully');
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ['chats', userId] });
            onChatUpdate?.();
        },
        onError: (error: any) => {
            toast.error('Failed to rename chat');
            console.error('Error renaming chat:', error);
            // Keep edit mode open on error
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async () => {
            return await chatApi.delete(chat.id, userId);
        },
        onSuccess: () => {
            toast.success('Chat deleted successfully');
            setIsDeleteDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['chats', userId] });
            onChatUpdate?.();

            // Navigate away if this was the active chat
            const currentPath = window.location.pathname;
            if (currentPath === `/chat/${chat.id}`) {
                // Navigate to a new chat or home
                router.push('/chat');
            }
        },
        onError: (error: any) => {
            toast.error('Failed to delete chat');
            console.error('Error deleting chat:', error);
            setIsDeleteDialogOpen(false);
        },
    });

    const handleRenameClick = () => {
        setIsEditing(true);
        setEditValue(chat.title);
    };

    const handleEditSave = () => {
        const trimmedValue = editValue.trim();
        if (trimmedValue.length === 0) {
            toast.error('Chat title cannot be empty');
            return;
        }
        if (trimmedValue.length > 100) {
            toast.error('Chat title must be 100 characters or less');
            return;
        }
        if (trimmedValue === chat.title) {
            setIsEditing(false);
            return;
        }
        renameMutation.mutate(trimmedValue);
    };

    const handleEditCancel = () => {
        setEditValue(chat.title);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleEditSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleEditCancel();
        }
    };

    const handleDeleteClick = () => {
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        deleteMutation.mutate();
    };

    return (
        <>
            <SidebarMenuItem className="group relative">
                <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="w-full pr-8"
                >
                    <a
                        href={`/chat/${chat.id}`}
                        className="flex items-center gap-2"
                        onClick={(e) => {
                            // Don't navigate if clicking on the three-dots menu or input
                            if ((e.target as HTMLElement).closest('[data-dropdown-trigger]') ||
                                (e.target as HTMLElement).tagName === 'INPUT') {
                                e.preventDefault();
                                return;
                            }
                            if (onChatSelect) {
                                e.preventDefault();
                                onChatSelect(chat.id);
                            }
                        }}
                    >
                        <MessageSquare />
                        {isEditing ? (
                            <Input
                                ref={inputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={handleEditSave}
                                disabled={renameMutation.isPending}
                                className="h-7 flex-1 min-w-0"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                maxLength={100}
                            />
                        ) : (
                            <span className="flex-1 truncate">{chat.title}</span>
                        )}
                    </a>
                </SidebarMenuButton>

                {/* Three-dots menu button - appears on hover */}
                {!isEditing && (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            asChild
                            data-dropdown-trigger
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor pointer"
                                aria-label="Chat options"
                            >
                                <MoreVertical className="h-4 w-4 text-muted-foreground cursor-pointer" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="right">
                            <DropdownMenuItem onClick={handleRenameClick}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleDeleteClick}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </SidebarMenuItem>

            {/* Delete confirmation dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{chat.title}&quot;? This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={deleteMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

