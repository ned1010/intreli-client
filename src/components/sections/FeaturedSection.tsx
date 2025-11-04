import { Brain, Upload, MessageSquare, Users, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";



const features = [
    {
        icon: Brain,
        title: "AI-Powered Intelligence",
        description: "Advanced GPT-4o technology understands and analyzes your documents with human-like comprehension",
        color: "text-purple-600"
    },
    {
        icon: Upload,
        title: "Universal Document Support",
        description: "PDF, DOCX, XLSX, images, and web content - we process any format seamlessly",
        color: "text-blue-600"
    },
    {
        icon: MessageSquare,
        title: "Conversational Interface",
        description: "Ask questions naturally and get detailed answers with source citations and insights",
        color: "text-green-600"
    },

    {
        icon: Users,
        title: "Multi-Tenant Organizations",
        description: "Isolated knowledge bases with role-based access and team collaboration",
        color: "text-indigo-600"
    },
    {
        icon: Lock,
        title: "Enterprise Security",
        description: "Bank-level encryption, secure sessions, and granular permission controls",
        color: "text-red-600"
    }
];


const FeaturedSection = () => {
    return (
        <section className="py-20 bg-white/50 dark:bg-gray-800/20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        Powerful Features for Modern Teams
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        Everything you need to transform your organizational knowledge into an intelligent,
                        conversational AI assistant that works exactly how you need it to.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <Card key={index} className="p-8 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <CardContent className="p-0">
                                <feature.icon className={`w-12 h-12 ${feature.color} mb-6`} />
                                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {feature.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default FeaturedSection;