'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';

const NewChatPage = () => {
    const router = useRouter();

    useEffect(() => {
        // Generate a new chat ID and redirect to it
        const newChatId = nanoid();
        router.replace(`/chat/${newChatId}`);
    }, [router]);

    return null; // No need to render anything since we're redirecting
};

export default NewChatPage;