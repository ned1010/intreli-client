'use client';
import { useParams } from 'next/navigation';
import StreamChat from '@/components/StreamChat';
import { useAuth } from '@clerk/nextjs'

const ChatPage = () => {
    const { chatId } = useParams();
    const { userId } = useAuth();
    console.log('Chat ID:', chatId);
    console.log('User ID:', userId);
    //TODO: fetch the chat from the server
    //ADD the chat to the sidebar

    return <StreamChat chatId={chatId as string} userId={userId as string} />;
};

export default ChatPage;