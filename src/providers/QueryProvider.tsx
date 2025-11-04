'use client';

import { QueryClient, QueryClientProvider, type QueryClientConfig } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // optional
import React, { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

const queryClientConfig: QueryClientConfig = {
    defaultOptions: {
        queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
        },
    },
};

export const QueryProvider = ({ children }: PropsWithChildren) => {
    const [client] = useState(() => new QueryClient(queryClientConfig));

    return (
        <QueryClientProvider client={client}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
};

// Theme Provider
type Theme = 'light' | 'dark' | 'system';

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    actualTheme: 'light' | 'dark';
};

const initialState: ThemeProviderState = {
    theme: 'system',
    setTheme: () => null,
    actualTheme: 'light',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = 'system',
    storageKey = 'intreli-ui-theme',
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(defaultTheme);
    const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const storedTheme = localStorage.getItem(storageKey) as Theme;
        if (storedTheme) {
            setTheme(storedTheme);
        }
        setMounted(true);
    }, [storageKey]);

    useEffect(() => {
        if (!mounted) return;

        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        let resolvedTheme: 'light' | 'dark';

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
            resolvedTheme = systemTheme;
        } else {
            resolvedTheme = theme;
        }

        root.classList.add(resolvedTheme);
        setActualTheme(resolvedTheme);
        localStorage.setItem(storageKey, theme);
    }, [theme, storageKey, mounted]);

    useEffect(() => {
        if (!mounted || theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            const root = window.document.documentElement;
            root.classList.remove('light', 'dark');

            const newTheme = e.matches ? 'dark' : 'light';
            root.classList.add(newTheme);
            setActualTheme(newTheme);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, mounted]);

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            setTheme(theme);
        },
        actualTheme,
    };

    if (!mounted) {
        return null;
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined)
        throw new Error('useTheme must be used within a ThemeProvider');

    return context;
};