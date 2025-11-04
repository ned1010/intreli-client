'use client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/SideBar';
import { PageHeader } from '@/components/PageHeader';
import { useUser, UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface ChatLayoutProps {
    children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
    const { isLoaded, isSignedIn, user } = useUser();
    const pathname = usePathname();

    // Determine page title and subtitle based on pathname
    const getPageInfo = () => {
        if (pathname.includes('/knowledge-base')) {
            return { title: 'Knowledge Base', subtitle: 'Manage your documents and AI training data' };
        }
        if (pathname.includes('/admin')) {
            return { title: 'Admin Dashboard', subtitle: 'System administration and settings' };
        }
        if (pathname.includes('/billing')) {
            return { title: 'Billing & Usage', subtitle: 'Manage your subscription and usage' };
        }
        if (pathname === '/chat') {
            return { title: 'Chat', subtitle: 'AI-powered conversations' };
        }
        return { title: 'Chat', subtitle: 'AI-powered conversations' };
    };

    if (!isLoaded) {
        return (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!isSignedIn) {
        return (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full bg-background text-foreground-900">
                <AppSidebar
                    user={user}
                    userButton={<UserButton />}
                    userId={user?.id}
                />
                <main className="flex-1 overflow-hidden flex flex-col">
                    <PageHeader title={getPageInfo().title} subtitle={getPageInfo().subtitle} />
                    <div className="flex-1 overflow-auto">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}