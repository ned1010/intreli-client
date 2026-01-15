'use client';
import { useParams, useSearchParams } from 'next/navigation';
import StreamChat from '@/components/StreamChat';
import { useAuth } from '@clerk/nextjs'

const ChatPage = () => {
    const { chatId } = useParams();
    const { userId } = useAuth();
    const searchParams = useSearchParams();
    const documentName = searchParams.get('documentName') || undefined;
    
    console.log('Chat ID:', chatId);
    console.log('User ID:', userId);
    console.log('Document Name:', documentName);
    //TODO: fetch the chat from the server
    //ADD the chat to the sidebar

    return <StreamChat chatId={chatId as string} userId={userId as string} documentName={documentName} />;
};

export default ChatPage;