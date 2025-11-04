
import { Upload, Brain, FileText, Globe, MessageSquare, Zap, Rocket } from "lucide-react";
import { Button } from "../ui/button";

const HowItWorks = () => {
    return (
        <section className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-gray-900/50 dark:via-blue-900/20 dark:to-purple-900/20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        See How Intreli AI Works
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        Watch your documents transform into intelligent conversations in three simple steps
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 mb-16">
                    {/* Step 1: Upload */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                        <div className="relative mb-6">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                                <Upload className="w-8 h-8 text-white" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                                <span className="text-white text-xs font-bold">1</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-center mb-4">Upload Documents</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                            Drag & drop PDFs, Word docs, spreadsheets, presentations, or paste website URLs
                        </p>

                        {/* Animated upload demo */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2 animate-fade-in">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm">company-handbook.pdf</span>
                                    <div className="ml-auto w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                <div className="flex items-center space-x-2 opacity-75">
                                    <FileText className="w-4 h-4 text-green-500" />
                                    <span className="text-sm">training-materials.docx</span>
                                    <div className="ml-auto text-green-500">✓</div>
                                </div>
                                <div className="flex items-center space-x-2 opacity-50">
                                    <Globe className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm">website-content.html</span>
                                    <div className="ml-auto text-purple-500">✓</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: AI Processing */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                        <div className="relative mb-6">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                                <Brain className="w-8 h-8 text-white animate-pulse" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                                <span className="text-white text-xs font-bold">2</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-center mb-4">AI Intelligence</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                            Advanced AI analyzes, understands, and organizes your content for intelligent responses
                        </p>

                        {/* Animated processing demo */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm">Extracting content...</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse animation-delay-200"></div>
                                    <span className="text-sm">Understanding context...</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse animation-delay-400"></div>
                                    <span className="text-sm">Building knowledge graph...</span>
                                </div>
                                <div className="mt-4 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                                    <div className="flex items-center space-x-2">
                                        <Zap className="w-4 h-4 text-green-600" />
                                        <span className="text-sm text-green-700 dark:text-green-300 font-medium">Ready for conversations!</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Chat */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                        <div className="relative mb-6">
                            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto">
                                <MessageSquare className="w-8 h-8 text-white animate-bounce" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                                <span className="text-white text-xs font-bold">3</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-center mb-4">Smart Conversations</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                            Ask questions and get accurate answers based only on your uploaded content
                        </p>

                        {/* Animated chat demo */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-40 overflow-hidden">
                            <div className="space-y-2">
                                <div className="flex">
                                    <div className="bg-blue-500 text-white rounded-lg px-3 py-2 text-sm max-w-[80%]">
                                        What&apos;s our remote work policy?
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <div className="bg-gray-200 dark:bg-gray-600 rounded-lg px-3 py-2 text-sm max-w-[80%] animate-fade-in">
                                        Based on your company handbook, remote work is available 3 days per week with approval from your manager...
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="bg-blue-500 text-white rounded-lg px-3 py-2 text-sm max-w-[80%] opacity-75">
                                        What about vacation days?
                                    </div>
                                </div>
                                <div className="flex justify-end items-center space-x-2 opacity-50">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-100"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-200"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Demo CTA */}
                <div className="text-center">
                    <Button
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                        onClick={() => window.location.href = "/organization-signup"}
                    >
                        <Rocket className="w-5 h-5 mr-2" />
                        Try It Now - Start Free
                    </Button>
                </div>
            </div>
        </section>
    )
}

export default HowItWorks;