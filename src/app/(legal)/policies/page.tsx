import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Shield, Scale } from "lucide-react";
import Link from "next/link";

export default function Policies() {
    const policies = [
        {
            title: "Privacy Policy",
            description: "Learn how we collect, use, and protect your personal information.",
            icon: Shield,
            href: "/privacy-policy",
            lastUpdated: "January 2025"
        },
        {
            title: "Terms of Use",
            description: "Understand the terms and conditions for using our platform.",
            icon: Scale,
            href: "/terms-of-use",
            lastUpdated: "January 2025"
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/">
                        <Button variant="ghost" className="mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Legal Policies
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Review our policies to understand how we protect your data and outline the terms of service for using Intreli.
                    </p>
                </div>

                {/* Policies Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                    {policies.map((policy) => {
                        const Icon = policy.icon;
                        return (
                            <Card key={policy.title} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <Icon className="w-6 h-6 text-primary" />
                                        {policy.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-muted-foreground">
                                        {policy.description}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Last updated: {policy.lastUpdated}
                                        </span>
                                        <Link href={policy.href}>
                                            <Button variant="outline">
                                                <FileText className="w-4 h-4 mr-2" />
                                                Read Policy
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Contact Section */}
                <div className="mt-12 p-6 bg-muted rounded-lg max-w-4xl">
                    <h3 className="text-lg font-semibold mb-2">Questions About Our Policies?</h3>
                    <p className="text-muted-foreground mb-4">
                        If you have any questions about these policies or how they apply to your use of Intreli,
                        please don&apos;t hesitate to contact us.
                    </p>
                    <a
                        href="mailto:legal@intreli.com"
                        className="text-primary hover:underline font-medium"
                    >
                        legal@intreli.com
                    </a>
                </div>
            </div>
        </div>
    );
}