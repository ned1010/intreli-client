import { Calendar, Book, Inbox, MessageSquare, Search, Settings, DollarSign, LogOut, ChevronDown } from "lucide-react"
import { ReactNode, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { nanoid } from "nanoid"
import { chatApi } from "@/lib/axios"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { SignOutButton } from "@clerk/nextjs";


interface User {
    firstName: string | null;
    lastName: string | null;
    emailAddresses?: Array<{ emailAddress: string }>;
}

interface Chat {
    id: string;
    title: string;
    timestamp: string;
    preview: string;
}

interface AppSidebarProps {
    user?: User;
    userButton?: ReactNode;
    userId?: string;
}

const defaultApplicationItems = [
    {
        title: "New Chat",
        url: "#", // Will be handled by onClick
        icon: MessageSquare,
        isNewChat: true,
    },
    {
        title: "Knowledge Base",
        url: "/chat/knowledge-base",
        icon: Book,
    },
    {
        title: "Admin Panel",
        url: "/chat/admin",
        icon: Settings,
    },
    {
        title: "Billing & Plans",
        url: "/chat/billing",
        icon: DollarSign,
    },
]

// //these are the chats to be fetched from the 
// const defaultRecentChats: Chat[] = [
//     {
//         title: "Chat 1",
//         timestamp: "Yesterday",
//         preview: "Sure, here's a summary of the traineeship...",
//     },
//     {
//         title: "Chat 2",
//         timestamp: "22/10/2025",
//         preview: "Let's walk through a few troubleshooting steps...",
//     },
//     {
//         title: "Chat 3",
//         timestamp: "21/10/2025",
//         preview: "Our standard plan includes unlimited knowledge bases...",
//     },
//     {
//         title: "Chat 4",
//         timestamp: "16/10/2025",
//         preview: "The standard work week is 38 hours in NSW...",
//     }
// ]

//get the chats from the server by using user ID

export function AppSidebar({ user, userButton, userId }: AppSidebarProps) {
    const router = useRouter();
    const [chats, setChats] = useState<Chat[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(false);

    // Load user's chats
    useEffect(() => {
        const fetchChats = async () => {
            if (!userId) return;

            setIsLoadingChats(true);
            try {
                const result = await chatApi.getUserChats(userId);
                if (result.success && result.chats) {
                    const formattedChats = result.chats.map(chat => ({
                        id: chat.id,
                        title: chat.title,
                        timestamp: new Date(chat.updatedAt).toLocaleDateString(),
                        preview: 'Click to view conversation...'
                    }));
                    setChats(formattedChats);
                } else {
                    setChats([]);
                }
            } catch (error) {
                console.error('Failed to fetch chats:', error);
                setChats([]);
            } finally {
                setIsLoadingChats(false);
            }
        };

        fetchChats();
    }, [userId]);

    // Auto-refresh chats every 10 seconds to catch new chats
    useEffect(() => {
        if (!userId) return;

        const interval = setInterval(async () => {
            try {
                const result = await chatApi.getUserChats(userId);
                if (result.success && result.chats) {
                    const formattedChats = result.chats.map(chat => ({
                        id: chat.id,
                        title: chat.title,
                        timestamp: new Date(chat.updatedAt).toLocaleDateString(),
                        preview: 'Click to view conversation...'
                    }));
                    setChats(formattedChats);
                }
            } catch (error) {
                console.error('Failed to refresh chats:', error);
            }
        }, 3000); // Refresh every 3 seconds for faster updates

        return () => clearInterval(interval);
    }, [userId]);

    const handleNewChat = () => {
        const newChatId = nanoid();
        router.push(`/chat/${newChatId}`);

    };

    const isOpen = true; // static open view for UI preview

    // console.log('user', user)
    return (
        <Sidebar>
            <SidebarHeader className="flex flex-row items-center justify-around">
                <SidebarGroupLabel className="flex-1">
                    <h1 className="text-xl font-bold text-foreground">Intreli</h1>
                    <div className="flex items-center gap-1 ml-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse " />
                        <p className="text-xs text-muted-foreground font-medium">Connected</p>
                    </div>
                </SidebarGroupLabel>

            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {defaultApplicationItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        {item.isNewChat ? (
                                            <button onClick={handleNewChat}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </button>
                                        ) : (
                                            <a href={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </a>
                                        )}
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
                    <SidebarGroupContent>

                        <SidebarMenu>
                            {isLoadingChats ? (
                                <SidebarMenuItem>
                                    <SidebarMenuButton disabled>
                                        <MessageSquare />
                                        <span>Loading chats...</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ) : chats.length > 0 ? (
                                chats.map((chat) => (
                                    <SidebarMenuItem key={chat.id}>
                                        <SidebarMenuButton asChild>
                                            <a href={`/chat/${chat.id}`}>
                                                <MessageSquare />
                                                <span>{chat.title}</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))
                            ) : (
                                <SidebarMenuItem>
                                    <SidebarMenuButton disabled>
                                        <MessageSquare />
                                        <span>No chats yet</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t">
                <SidebarGroupContent className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        {userButton}
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">
                                {user?.firstName} {user?.lastName}
                            </span>
                        </div>
                    </div>
                    <div>
                        <SignOutButton>
                            <LogOut className="cursor-pointer w-5 h-5" />
                        </SignOutButton>
                    </div>
                </SidebarGroupContent>
            </SidebarFooter>
        </Sidebar>
    )
}