import { Calendar, Book, Inbox, MessageSquare, Search, Settings, DollarSign, LogOut, ChevronDown } from "lucide-react"
import { ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { nanoid } from "nanoid"
import { chatApi, Chat } from "@/lib/axios"
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
import { ChatListItem } from "@/components/ChatListItem";
import { useQuery } from "@tanstack/react-query";


interface User {
    firstName: string | null;
    lastName: string | null;
    emailAddresses?: Array<{ emailAddress: string }>;
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
        url: "/knowledge-base",
        icon: Book,
    },
    {
        title: "Admin Panel",
        url: "/admin",
        icon: Settings,
    },
    {
        title: "Billing & Plans",
        url: "/billing",
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
    const pathname = usePathname();

    // Get current chatId from pathname
    const currentChatId = pathname?.startsWith('/chat/') 
        ? pathname.split('/chat/')[1]?.split('/')[0] || null
        : null;

    // Load user's chats with React Query
    const {
        data: chats = [],
        isLoading: isLoadingChats,
        refetch: refetchChats,
    } = useQuery<Chat[]>({
        queryKey: ['chats', userId],
        queryFn: async () => {
            if (!userId) return [];
            const result = await chatApi.getUserChats(userId);
            if (result.success && result.chats) {
                return result.chats;
            }
            return [];
        },
        enabled: !!userId,
        staleTime: 3000, // Consider data fresh for 3 seconds
        refetchInterval: 10000, // Refetch every 10 seconds
    });

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
                                    <ChatListItem
                                        key={chat.id}
                                        chat={chat}
                                        userId={userId || ''}
                                        isActive={currentChatId === chat.id}
                                        onChatUpdate={() => refetchChats()}
                                    />
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