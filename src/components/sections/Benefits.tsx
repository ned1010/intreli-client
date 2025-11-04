import { Button } from "@/components/ui/button";
import { Bot, FileText, Globe, Target, Check, ArrowRight } from "lucide-react";

const benefits = [
    "Reduce research time by 90%",
    "Instant access to organizational knowledge",
    "Seamless team collaboration",
    "Custom AI personality per organization",
    "Real-time document processing",
    "Advanced web scraping capabilities"
];
const Benefits = () => {
    return (
        <section className="py-20">
            <div className="container mx-auto px-4">
                {/* Interactive Demo Section */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 mb-20">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            See It In Action
                        </h2>
                        <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                            Watch a live demo of how Intreli AI transforms your documents into intelligent conversations
                        </p>
                    </div>

                    {/* Mock Interface Demo */}
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
                        <div className="bg-gray-50 px-6 py-4 border-b flex items-center space-x-3">
                            <div className="flex space-x-2">
                                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            </div>
                            <span className="text-gray-600 font-medium">Intreli AI - Knowledge Assistant</span>
                        </div>

                        <div className="p-6">
                            <div className="grid lg:grid-cols-2 gap-8">
                                {/* Knowledge Base Side */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Knowledge Base</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                            <FileText className="w-5 h-5 text-green-600" />
                                            <div className="flex-1">
                                                <div className="font-medium text-green-800">Employee Handbook</div>
                                                <div className="text-sm text-green-600">245 pages • Processed</div>
                                            </div>
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        </div>
                                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <Globe className="w-5 h-5 text-blue-600" />
                                            <div className="flex-1">
                                                <div className="font-medium text-blue-800">Company Website</div>
                                                <div className="text-sm text-blue-600">15 pages • Processed</div>
                                            </div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        </div>
                                        <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                            <FileText className="w-5 h-5 text-purple-600" />
                                            <div className="flex-1">
                                                <div className="font-medium text-purple-800">Training Materials</div>
                                                <div className="text-sm text-purple-600">89 pages • Processing...</div>
                                            </div>
                                            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Side */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Live Chat</h3>
                                    <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
                                        <div className="space-y-4">
                                            <div className="flex">
                                                <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-[80%]">
                                                    What&apos;s our policy on remote work?
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                <div className="bg-white border rounded-lg px-4 py-2 max-w-[80%] shadow-sm animate-fade-in">
                                                    Based on your Employee Handbook (page 42), remote work is available up to 3 days per week with manager approval. Employees must maintain core hours of 10 AM - 3 PM in their local timezone.
                                                    <div className="mt-2 text-xs text-gray-500">
                                                        📄 Source: Employee Handbook, Section 4.2
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex">
                                                <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-[80%]">
                                                    What about vacation time?
                                                </div>
                                            </div>
                                            <div className="flex justify-end items-end space-x-2">
                                                <div className="flex space-x-1 mb-2">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-100"></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-200"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8">
                            Why Organizations Choose Intreli AI
                        </h2>
                        <div className="space-y-4 mb-8">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex items-center space-x-3">
                                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-green-600" />
                                    </div>
                                    <span className="text-lg text-gray-700 dark:text-gray-300">{benefit}</span>
                                </div>
                            ))}
                        </div>
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                            onClick={() => window.location.href = "/organization-signup"}
                        >
                            Start Free Trial
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 shadow-2xl">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-white font-medium">Intreli Assistant</span>
                                </div>
                                <p className="text-white/90">
                                    &quot;Based on your uploaded documents, I found 3 relevant policies that address your question about remote work guidelines...&quot;
                                </p>
                            </div>
                            <div className="flex items-center space-x-4 text-white/80">
                                <FileText className="w-5 h-5" />
                                <span>42 documents processed</span>
                                <Target className="w-5 h-5 ml-4" />
                                <span>99.8% accuracy</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Benefits;