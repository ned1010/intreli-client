import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, FileText, Scale } from "lucide-react";
import Link from "next/link";

export default function TermsAndConditions() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/signup">
                        <Button variant="ghost" className="mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Signup
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                            <Scale className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Terms and Conditions
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300">
                                Last updated: September 1, 2025
                            </p>
                        </div>
                    </div>
                </div>

                {/* Terms Content */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                1. Agreement to Terms
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                            <p>
                                By accessing and using Intreli AI (&quot;Service&quot;), you accept and agree to be bound by the terms and provision of this agreement.
                                If you do not agree to abide by the above, please do not use this service.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                2. Service Description
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                            <p>
                                Intreli AI is a personalized AI knowledge management system that allows organizations to:
                            </p>
                            <ul>
                                <li>Upload and process various document types (PDF, DOCX, XLSX, images, etc.)</li>
                                <li>Create intelligent AI chat systems based on uploaded content</li>
                                <li>Manage organizational knowledge bases with role-based access control</li>
                                <li>Team collaboration with role-based permissions</li>
                            </ul>
                            <p>
                                The service uses AI models to process and respond to queries based solely on uploaded content.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>3. User Accounts and Registration</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                            <p>
                                To access certain features of the Service, you must register for an account. When you register, you agree to:
                            </p>
                            <ul>
                                <li>Provide accurate, current, and complete information</li>
                                <li>Maintain and update your information to keep it accurate</li>
                                <li>Keep your password secure and confidential</li>
                                <li>Accept responsibility for all activities under your account</li>
                                <li>Notify us immediately of any unauthorized use of your account</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>4. Data Privacy and Security</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                            <p>
                                We take data privacy and security seriously:
                            </p>
                            <ul>
                                <li><strong>Encryption:</strong> All uploaded documents and content are encrypted using AES-256-GCM encryption</li>
                                <li><strong>Data Isolation:</strong> Each organization&apos;s data is completely isolated from others</li>
                                <li><strong>AI Processing:</strong> AI responses are strictly limited to your uploaded knowledge base content</li>
                                <li><strong>No External Knowledge:</strong> Our AI cannot and will not use external knowledge or training data beyond your uploads</li>
                                <li><strong>Data Ownership:</strong> You retain full ownership of all content you upload</li>
                                <li><strong>Data Deletion:</strong> You can delete your data at any time, and it will be permanently removed from our systems</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>5. Subscription Plans and Billing</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                            <p>
                                Intreli AI offers various subscription plans:
                            </p>
                            <ul>
                                <li><strong>Free Tier:</strong> 1 user, 200MB storage, 300 conversations/month</li>
                                <li><strong>Paid Plans:</strong> Basic, Professional, Premium, and Enterprise with varying limits</li>
                                <li><strong>Billing:</strong> Paid plans are billed monthly via Stripe</li>
                                <li><strong>Cancellation:</strong> You may cancel your subscription at any time</li>
                                <li><strong>Refunds:</strong> Refunds are handled on a case-by-case basis</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>6. Acceptable Use Policy</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                            <p>
                                You agree not to use the Service to:
                            </p>
                            <ul>
                                <li>Upload illegal, harmful, threatening, abusive, or defamatory content</li>
                                <li>Violate any applicable laws or regulations</li>
                                <li>Infringe upon intellectual property rights of others</li>
                                <li>Attempt to gain unauthorized access to our systems</li>
                                <li>Interfere with or disrupt the Service</li>
                                <li>Use the Service for spam or unsolicited communications</li>
                                <li>Upload malware, viruses, or other harmful code</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>7. Intellectual Property Rights</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                            <p>
                                The Service and its original content, features, and functionality are owned by Intreli AI and are protected by
                                international copyright, trademark, patent, trade secret, and other intellectual property laws.
                            </p>
                            <p>
                                You retain all rights to content you upload. By uploading content, you grant us a limited license to process,
                                store, and analyze your content solely for the purpose of providing the Service to you.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>8. Service Availability</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                            <p>
                                We strive to provide reliable service but do not guarantee 100% uptime. The Service may be temporarily
                                unavailable due to maintenance, updates, or technical issues. We will make reasonable efforts to provide
                                advance notice of planned downtime.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>9. Limitation of Liability</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                            <p>
                                To the fullest extent permitted by applicable law, Intreli AI shall not be liable for any indirect,
                                incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether
                                incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>10. Termination</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                            <p>
                                We may terminate or suspend your account and access to the Service immediately, without prior notice,
                                if you breach these Terms. You may also terminate your account at any time by contacting us.
                            </p>
                            <p>
                                Upon termination, your right to use the Service will cease immediately, and we will delete your data
                                in accordance with our data retention policies.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>11. Changes to Terms</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                            <p>
                                We reserve the right to modify these Terms at any time. We will notify users of significant changes
                                via email or through the Service. Your continued use of the Service after such modifications constitutes
                                acceptance of the updated Terms.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>12. Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                            <p>
                                If you have any questions about these Terms and Conditions, please contact us at:
                            </p>
                            <ul>
                                <li>Email: support@intreli.ai</li>
                                <li>Website: https://intreli.ai</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center">
                    <Link href="/signup">
                        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                            I Accept - Continue to Signup
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}