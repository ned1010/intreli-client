import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/QueryProvider";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, Monitor } from "lucide-react";
const Nav = () => {

    const { theme, setTheme } = useTheme();
    return (
        <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50 shadow-md border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <Image
                            src='/images/intreli-logo.png'
                            alt="Intreli AI Logo"
                            className="w-8 h-8 rounded-lg"
                            width={24}
                            height={24}
                        />
                        <span className="text-2xl font-bold bg-linear-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Intreli AI
                        </span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link href="/policies">
                            <Button variant="ghost">
                                Policies
                            </Button>
                        </Link>
                        <Button variant="ghost" onClick={() => window.location.href = "/sign-in"}>
                            Sign In
                        </Button>

                        <Button
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            onClick={() => window.location.href = "/sign-up"}
                        >
                            Get Started
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9">
                                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                    <span className="sr-only">Toggle theme</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => setTheme('light')}
                                    className={theme === 'light' ? 'bg-accent' : ''}
                                >
                                    <Sun className="mr-2 h-4 w-4" />
                                    <span>Light</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setTheme('dark')}
                                    className={theme === 'dark' ? 'bg-accent' : ''}
                                >
                                    <Moon className="mr-2 h-4 w-4" />
                                    <span>Dark</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setTheme('system')}
                                    className={theme === 'system' ? 'bg-accent' : ''}
                                >
                                    <Monitor className="mr-2 h-4 w-4" />
                                    <span>System</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </nav>

    )

};

export default Nav;