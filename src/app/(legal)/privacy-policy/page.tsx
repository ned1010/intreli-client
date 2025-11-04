import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicy() {
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
                        Privacy Policy
                    </h1>
                    <p className="text-muted-foreground">
                        Last updated: January 2025
                    </p>
                </div>

                {/* Content */}
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                    <h2>1. Information We Collect</h2>
                    <p>
                        When you use Intreli, we collect information that you provide directly to us, such as when you create an account,
                        upload documents, or contact us for support.
                    </p>

                    <h3>Personal Information</h3>
                    <ul>
                        <li>Name and email address</li>
                        <li>Organization information</li>
                        <li>Account credentials</li>
                        <li>Profile information</li>
                    </ul>

                    <h3>Usage Information</h3>
                    <ul>
                        <li>Documents you upload and their content</li>
                        <li>Chat conversations and queries</li>
                        <li>Usage patterns and preferences</li>
                        <li>Technical information about your device and browser</li>
                    </ul>

                    <h2>2. How We Use Your Information</h2>
                    <p>We use the information we collect to:</p>
                    <ul>
                        <li>Provide and maintain our services</li>
                        <li>Process your documents and generate AI responses</li>
                        <li>Communicate with you about your account and our services</li>
                        <li>Improve our platform and develop new features</li>
                        <li>Ensure security and prevent fraud</li>
                        <li>Comply with legal obligations</li>
                    </ul>

                    <h2>3. Information Sharing</h2>
                    <p>
                        We do not sell, trade, or otherwise transfer your personal information to third parties without your consent,
                        except as described in this policy:
                    </p>
                    <ul>
                        <li>With service providers who assist us in operating our platform</li>
                        <li>When required by law or to protect our rights</li>
                        <li>In connection with a business transfer or acquisition</li>
                    </ul>

                    <h2>4. Data Security</h2>
                    <p>
                        We implement appropriate technical and organizational measures to protect your personal information against
                        unauthorized access, alteration, disclosure, or destruction. This includes:
                    </p>
                    <ul>
                        <li>End-to-end encryption for all uploaded documents</li>
                        <li>Secure data transmission using SSL/TLS</li>
                        <li>Regular security audits and updates</li>
                        <li>Access controls and authentication measures</li>
                    </ul>

                    <h2>5. Data Retention</h2>
                    <p>
                        We retain your personal information for as long as necessary to provide our services and fulfill the purposes
                        described in this policy. When you delete your account, we will delete your personal information within 30 days,
                        except where we are required to retain it for legal or regulatory purposes.
                    </p>

                    <h2>6. Your Rights</h2>
                    <p>Depending on your location, you may have the following rights regarding your personal information:</p>
                    <ul>
                        <li>Access: Request a copy of the personal information we hold about you</li>
                        <li>Correction: Request correction of inaccurate or incomplete information</li>
                        <li>Deletion: Request deletion of your personal information</li>
                        <li>Portability: Request transfer of your data to another service</li>
                        <li>Restriction: Request limitation of how we process your information</li>
                    </ul>

                    <h2>7. Cookies and Tracking</h2>
                    <p>
                        We use cookies and similar technologies to enhance your experience, analyze usage patterns, and provide
                        personalized content. You can control cookie settings through your browser preferences.
                    </p>

                    <h2>8. International Data Transfers</h2>
                    <p>
                        Your information may be transferred to and processed in countries other than your own. We ensure that such
                        transfers comply with applicable data protection laws and provide adequate protection for your personal information.
                    </p>

                    <h2>9. Children&apos;s Privacy</h2>
                    <p>
                        Our services are not intended for children under 13 years of age. We do not knowingly collect personal
                        information from children under 13.
                    </p>

                    <h2>10. Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time. We will notify you of any material changes by posting
                        the new policy on our website and updating the &apos;Last updated&apos; date.
                    </p>

                    <h2>11. Contact Us</h2>
                    <p>
                        If you have questions about this Privacy Policy or our privacy practices, please contact us at:
                    </p>
                    <p>
                        Email: <a href="mailto:privacy@intreli.com" className="text-primary hover:underline">privacy@intreli.com</a><br />
                        Address: Intreli Privacy Team, [Company Address]
                    </p>
                </div>
            </div>
        </div>
    );
}