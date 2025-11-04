'use client'
import Landing from "@/components/pages/landing";
import StreamChat from "@/components/StreamChat";
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/SideBar';
import { useUser, UserButton } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

//if logged in and not expired, then show the dashboard with chat interface otherwise
//else show the landing page
export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  console.log('User Details', user?.id)

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isSignedIn) {
    // Show chat interface with sidebar at home page
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AppSidebar
            user={user}
            userButton={<UserButton />}
            userId={user?.id}
          />
          <main className="flex-1 overflow-hidden">
            <StreamChat chatId={null} userId={user?.id || ''} />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <div className="min-h-screen">
      <Landing />
    </div>
  );
}
