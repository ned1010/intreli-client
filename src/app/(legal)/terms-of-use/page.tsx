import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsOfUse() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-6 py-12 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/policies">
                        <Button variant="ghost" className="mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Policies
                        </Button>
                    </Link>
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Terms of Use
                    </h1>
                    <p className="text-muted-foreground">
                        Last updated: January 2025
                    </p>
                </div>

                {/* Content */}
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using Intreli (&quot;the Service&quot;), you agree to be bound by these Terms of Use (&quot;Terms&quot;).
                        If you do not agree to these Terms, please do not use the Service.
                    </p>

                    <h2>2. Description of Service</h2>
                    <p>
                        Intreli is an AI-powered knowledge management platform that allows organizations to upload documents,
                        create knowledge bases, and interact with AI-powered chat assistants to extract insights from their content.
                    </p>

                    <h2>3. User Accounts</h2>
                    <h3>Registration</h3>
                    <ul>
                        <li>You must provide accurate and complete information when creating an account</li>
                        <li>You are responsible for maintaining the security of your account credentials</li>
                        <li>You must notify us immediately of any unauthorized use of your account</li>
                        <li>One person or entity may not maintain more than one free account</li>
                    </ul>

                    <h3>Account Responsibilities</h3>
                    <ul>
                        <li>You are responsible for all activities that occur under your account</li>
                        <li>You must not share your account credentials with others</li>
                        <li>You must keep your contact information up to date</li>
                    </ul>

                    <h2>4. Acceptable Use</h2>
                    <p>You agree not to use the Service to:</p>
                    <ul>
                        <li>Upload content that is illegal, harmful, threatening, abusive, or violates any law</li>
                        <li>Infringe upon intellectual property rights of others</li>
                        <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
                        <li>Distribute malware, viruses, or other harmful code</li>
                        <li>Use the Service for any commercial purpose without appropriate subscription</li>
                        <li>Reverse engineer, decompile, or attempt to extract source code</li>
                        <li>Use automated systems to access the Service without permission</li>
                    </ul>

                    <h2>5. Content and Intellectual Property</h2>
                    <h3>Your Content</h3>
                    <ul>
                        <li>You retain ownership of all content you upload to the Service</li>
                        <li>You grant us a license to process, store, and analyze your content to provide the Service</li>
                        <li>You represent that you have the right to upload and share your content</li>
                        <li>You are responsible for ensuring your content complies with applicable laws</li>
                    </ul>

                    <h3>Our Content</h3>
                    <ul>
                        <li>The Service and its original content are protected by copyright and other laws</li>
                        <li>You may not copy, modify, or distribute our proprietary content without permission</li>
                        <li>All trademarks and service marks are the property of their respective owners</li>
                    </ul>

                    <h2>6. Subscription and Payment Terms</h2>
                    <h3>Free and Paid Plans</h3>
                    <ul>
                        <li>We offer both free and paid subscription plans with different features and limits</li>
                        <li>Free accounts are subject to usage limitations (storage, chat messages, users)</li>
                        <li>Paid subscriptions are billed monthly or annually as selected</li>
                        <li>All fees are non-refundable except as required by law</li>
                    </ul>

                    <h3>Billing and Cancellation</h3>
                    <ul>
                        <li>Subscriptions automatically renew unless cancelled</li>
                        <li>You can cancel your subscription at any time through your account settings</li>
                        <li>Cancellations take effect at the end of the current billing period</li>
                        <li>We may change subscription prices with 30 days&apos; notice</li>
                    </ul>

                    <h2>7. Privacy and Data Protection</h2>
                    <p>
                        Your privacy is important to us. Please review our Privacy Policy to understand how we collect,
                        use, and protect your information. By using the Service, you consent to our data practices as
                        described in the Privacy Policy.
                    </p>

                    <h2>8. Service Availability</h2>
                    <ul>
                        <li>We strive to maintain high service availability but cannot guarantee 100% uptime</li>
                        <li>We may temporarily suspend the Service for maintenance or updates</li>
                        <li>We are not liable for any interruptions or loss of data due to service outages</li>
                    </ul>

                    <h2>9. Limitation of Liability</h2>
                    <p>
                        To the maximum extent permitted by law, Intreli shall not be liable for any indirect, incidental,
                        special, consequential, or punitive damages, including but not limited to loss of profits, data,
                        or use, arising out of your use of the Service.
                    </p>

                    <h2>10. Indemnification</h2>
                    <p>
                        You agree to indemnify and hold harmless Intreli from any claims, damages, losses, or expenses
                        arising from your use of the Service, violation of these Terms, or infringement of any rights of another.
                    </p>

                    <h2>11. Termination</h2>
                    <h3>By You</h3>
                    <ul>
                        <li>You may terminate your account at any time by contacting us or using account settings</li>
                        <li>Upon termination, your access to the Service will be discontinued</li>
                        <li>We will delete your data within 30 days of account termination</li>
                    </ul>

                    <h3>By Us</h3>
                    <ul>
                        <li>We may suspend or terminate your account for violations of these Terms</li>
                        <li>We may terminate the Service with 30 days&apos; notice</li>
                        <li>We may immediately suspend accounts for security or legal reasons</li>
                    </ul>

                    <h2>12. Disclaimers</h2>
                    <ul>
                        <li>The Service is provided &quot;as is&quot; without warranties of any kind</li>
                        <li>We do not guarantee the accuracy of AI-generated responses</li>
                        <li>You should verify important information from AI responses</li>
                        <li>We are not responsible for the content of documents you upload</li>
                    </ul>

                    <h2>13. Governing Law</h2>
                    <p>
                        These Terms are governed by the laws of [Jurisdiction] without regard to conflict of law principles.
                        Any disputes arising from these Terms or the Service will be resolved in the courts of [Jurisdiction].
                    </p>

                    <h2>14. Changes to Terms</h2>
                    <p>
                        We may modify these Terms at any time. We will notify you of material changes by email or through
                        the Service. Your continued use of the Service after changes constitute acceptance of the new Terms.
                    </p>

                    <h2>15. Severability</h2>
                    <p>
                        If any provision of these Terms is found to be unenforceable, the remaining provisions will remain
                        in full force and effect.
                    </p>

                    <h2>16. Contact Information</h2>
                    <p>
                        If you have questions about these Terms of Use, please contact us at:
                    </p>
                    <p>
                        Email: <a href="mailto:legal@intreli.com" className="text-primary hover:underline">legal@intreli.com</a><br />
                        Address: Intreli Legal Team, [Company Address]
                    </p>
                </div>
            </div>
        </div>
    );
}