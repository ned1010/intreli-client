import Image from "next/image";
import Link from "next/link";
const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white py-12">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-8">
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <Image
                                src="/images/intreli-logo.png"
                                alt="Intreli AI Logo"
                                className="w-8 h-8 rounded-lg"
                                width={24}
                                height={24}
                            />
                            <span className="text-2xl font-bold">Intreli AI</span>
                        </div>
                        <p className="text-gray-400 mb-4">
                            Personalised AI that transforms your knowledge into intelligent conversations.
                        </p>
                        <p className="text-sm text-gray-500">
                            Your intelligence, Your responses.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Quick Access</h4>
                        <div className="space-y-2">
                            <div className="text-gray-400 hover:text-white cursor-pointer" onClick={() => window.location.href = "/organization-signup"}>
                                Create Organization
                            </div>
                            <div className="text-gray-400 hover:text-white cursor-pointer" onClick={() => window.location.href = "/login"}>
                                Sign In
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Legal</h4>
                        <div className="space-y-2">
                            <Link href="/policies" className="text-gray-400 hover:text-white block">
                                Policies
                            </Link>
                            <Link href="/privacy-policy" className="text-gray-400 hover:text-white block">
                                Privacy Policy
                            </Link>
                            <Link href="/terms-of-use" className="text-gray-400 hover:text-white block">
                                Terms of Use
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
                    <p>&copy; 2025 Intreli AI. Transforming knowledge into intelligence.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer;