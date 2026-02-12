import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="mb-8">
                    <Link href="/">
                        <Button variant="outline">← Back to Home</Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">Privacy Policy</CardTitle>
                        <p className="text-sm text-muted-foreground">Last updated: February 12, 2026</p>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
                            <p className="text-muted-foreground">
                                Bereka ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our micro-task marketplace platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
                            
                            <h3 className="text-lg font-semibold mb-2 mt-4">2.1 Account Information</h3>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>Email address</li>
                                <li>Username</li>
                                <li>Password (encrypted)</li>
                                <li>Profile information (bio, role)</li>
                            </ul>

                            <h3 className="text-lg font-semibold mb-2 mt-4">2.2 Financial Information</h3>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>Lightning wallet details (LNbits wallet ID and keys)</li>
                                <li>Transaction history (deposits, escrow movements, payouts)</li>
                                <li>Account balances</li>
                                <li>Payment invoices and hashes</li>
                            </ul>

                            <h3 className="text-lg font-semibold mb-2 mt-4">2.3 Platform Activity</h3>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>Jobs created, applied to, and completed</li>
                                <li>Work submissions and attachments</li>
                                <li>Dispute records and resolutions</li>
                                <li>Application cover letters</li>
                            </ul>

                            <h3 className="text-lg font-semibold mb-2 mt-4">2.4 Technical Data</h3>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>IP address</li>
                                <li>Browser type and version</li>
                                <li>Device information</li>
                                <li>Usage data and analytics</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
                            <p className="text-muted-foreground mb-2">We use the collected information to:</p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>Provide and maintain the Bereka platform</li>
                                <li>Process transactions and manage your Lightning wallet</li>
                                <li>Facilitate job postings, applications, and completions</li>
                                <li>Resolve disputes between users</li>
                                <li>Send notifications about platform activity</li>
                                <li>Prevent fraud and maintain platform security</li>
                                <li>Comply with legal obligations and regulations</li>
                                <li>Improve our services and user experience</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">4. Information Sharing and Disclosure</h2>
                            
                            <h3 className="text-lg font-semibold mb-2 mt-4">4.1 With Other Users</h3>
                            <p className="text-muted-foreground">
                                Your username, bio, and public profile information are visible to other platform users. Job creators can see applications and submissions from workers, and vice versa.
                            </p>

                            <h3 className="text-lg font-semibold mb-2 mt-4">4.2 With Service Providers</h3>
                            <p className="text-muted-foreground">
                                We share information with third-party service providers who help us operate the platform:
                            </p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li><strong>Supabase:</strong> Database, authentication, and storage services</li>
                                <li><strong>LNbits:</strong> Lightning Network wallet and payment processing</li>
                                <li><strong>Vercel:</strong> Web hosting and deployment</li>
                                <li><strong>Email service provider:</strong> For sending notifications</li>
                            </ul>

                            <h3 className="text-lg font-semibold mb-2 mt-4">4.3 Legal Requirements</h3>
                            <p className="text-muted-foreground">
                                We may disclose your information if required by law, court order, or governmental authority, or to protect the rights, property, or safety of Bereka, our users, or the public.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
                            <p className="text-muted-foreground">
                                We implement industry-standard security measures to protect your information:
                            </p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>Encrypted data transmission (HTTPS)</li>
                                <li>Encrypted password storage</li>
                                <li>Secure database with Row Level Security (RLS)</li>
                                <li>Private storage for file attachments</li>
                                <li>Limited access to sensitive information (admin keys, wallet keys)</li>
                            </ul>
                            <p className="text-muted-foreground mt-2">
                                However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your data.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">6. Custodial Wallet Privacy</h2>
                            <p className="text-muted-foreground">
                                As a custodial wallet service, we have access to:
                            </p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>Your Lightning wallet admin and invoice keys</li>
                                <li>All transaction history and balances</li>
                                <li>Payment hashes and invoice details</li>
                                <li>Internal ledger movements (deposits, escrow, payouts)</li>
                            </ul>
                            <p className="text-muted-foreground mt-2">
                                This information is necessary to operate the custodial service and is not shared with third parties except as required by law.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
                            <p className="text-muted-foreground mb-2">You have the right to:</p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                                <li><strong>Correction:</strong> Update or correct your profile information</li>
                                <li><strong>Deletion:</strong> Request deletion of your account and associated data (subject to legal retention requirements)</li>
                                <li><strong>Portability:</strong> Request export of your data in a machine-readable format</li>
                                <li><strong>Object:</strong> Object to certain types of data processing</li>
                            </ul>
                            <p className="text-muted-foreground mt-2">
                                To exercise these rights, contact us at <a href="mailto:privacy@bereka.app" className="text-primary hover:underline">privacy@bereka.app</a>
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">8. Data Retention</h2>
                            <p className="text-muted-foreground">
                                We retain your information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain information for legal, regulatory, or audit purposes for up to 7 years.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">9. Cookies and Tracking</h2>
                            <p className="text-muted-foreground">
                                We use cookies and similar tracking technologies to:
                            </p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>Maintain your login session</li>
                                <li>Remember your preferences</li>
                                <li>Analyze platform usage</li>
                            </ul>
                            <p className="text-muted-foreground mt-2">
                                You can control cookies through your browser settings, but disabling cookies may affect platform functionality.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">10. Children's Privacy</h2>
                            <p className="text-muted-foreground">
                                Bereka is not intended for users under 18 years of age. We do not knowingly collect information from children. If you believe we have collected information from a child, please contact us immediately.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">11. International Data Transfers</h2>
                            <p className="text-muted-foreground">
                                Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. We ensure appropriate safeguards are in place for such transfers.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">12. Changes to This Policy</h2>
                            <p className="text-muted-foreground">
                                We may update this Privacy Policy from time to time. We will notify you of material changes by email or through a platform notification. Your continued use of Bereka after changes constitutes acceptance of the updated policy.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">13. Contact Us</h2>
                            <p className="text-muted-foreground">
                                If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
                            </p>
                            <ul className="list-none text-muted-foreground space-y-1 mt-2">
                                <li>Email: <a href="mailto:privacy@bereka.app" className="text-primary hover:underline">privacy@bereka.app</a></li>
                                <li>Support: <a href="mailto:support@bereka.app" className="text-primary hover:underline">support@bereka.app</a></li>
                            </ul>
                        </section>

                        <div className="mt-8 pt-6 border-t">
                            <p className="text-sm text-muted-foreground italic">
                                By using Bereka, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, use, and disclosure of your information as described herein.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
