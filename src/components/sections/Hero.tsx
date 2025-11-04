import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, MessageSquare, Rocket } from "lucide-react";
const Hero = () => {
    return (

        <section className="py-20 md:py-32">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-4xl mx-auto">
                    <div className="flex justify-center items-center flex-wrap gap-3 mb-6">
                        <Badge className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-200 text-sm px-4 py-2">
                            <Shield className="w-4 h-4 mr-2" />
                            Safe and Encrypted
                        </Badge>
                        <Badge className="bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-200 text-sm px-4 py-2">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Responsive Conversations
                        </Badge>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-8 leading-tight">
                        Your intelligence, Your Responses.
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
                        Upload your information into the brain library and allow your team, customers, clients and more to get answers only based on the information you have trained Intreli.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                            onClick={() => window.location.href = "/organization-signup"}
                        >
                            <Rocket className="w-5 h-5 mr-2" />
                            Start Your Organization
                        </Button>
                    </div>

                    {/* Social Proof */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-3xl font-bold text-blue-600">99.9%</div>
                            <div className="text-gray-600 dark:text-gray-400">Accuracy Rate</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-purple-600">10x</div>
                            <div className="text-gray-600 dark:text-gray-400">Faster Research</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-green-600">Fully Encrypted</div>
                            <div className="text-gray-600 dark:text-gray-400">we cant see your information</div >
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-orange-600">24/7</div>
                            <div className="text-gray-600 dark:text-gray-400">AI Assistant</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
};

export default Hero;