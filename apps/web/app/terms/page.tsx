import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function TermsPage() {
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
                        <CardTitle className="text-3xl">Terms of Service</CardTitle>
                        <p className="text-sm text-muted-foreground">Last updated: February 12, 2026</p>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
                            <p className="text-muted-foreground">
                                Welcome to Bereka ("we," "our," or "us"). By accessing or using our Lightning-powered micro-task marketplace platform, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">2. Service Description</h2>
                            <p className="text-muted-foreground">
                                Bereka is a custodial micro-task marketplace that enables users to post jobs, accept tasks, and process payments using the Bitcoin Lightning Network. All balances are held in-app and managed through our custodial wallet system powered by LNbits.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">3. Account Registration</h2>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>You must provide accurate and complete information during registration</li>
                                <li>You are responsible for maintaining the security of your account credentials</li>
                                <li>You must notify us immediately of any unauthorized use of your account</li>
                                <li>You must be at least 18 years old to use this service</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">4. Custodial Wallet System</h2>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li><strong>Custodial Nature:</strong> Bereka maintains custody of all Bitcoin held in user accounts. We control the private keys.</li>
                                <li><strong>No Withdrawals:</strong> This MVP version does not support Bitcoin withdrawals. Funds can only be used within the platform.</li>
                                <li><strong>Top-ups Only:</strong> Users can add funds via Lightning Network invoices but cannot withdraw to external wallets.</li>
                                <li><strong>Risk:</strong> As a custodial service, users trust us to safeguard their funds. We are not liable for any loss of funds due to technical failures, hacks, or other unforeseen events.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">5. Job Posting and Escrow</h2>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>Job creators must fund the full job budget upfront from their available balance</li>
                                <li>Funds are moved to escrow when a job is posted and remain locked until resolution</li>
                                <li>Jobs can be completed, disputed, or cancelled according to platform rules</li>
                                <li>The platform takes a 5% fee on all approved payouts to workers</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">6. Disputes and Resolution</h2>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>Either party (creator or worker) may open a dispute if there is disagreement about job completion</li>
                                <li>All disputes are resolved by platform administrators at their sole discretion</li>
                                <li>Admin decisions are final and binding</li>
                                <li>Possible resolutions include: full refund to creator, full payment to worker, or 50/50 split</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">7. Prohibited Activities</h2>
                            <p className="text-muted-foreground mb-2">Users may not:</p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>Post illegal, fraudulent, or harmful content</li>
                                <li>Attempt to manipulate or game the platform</li>
                                <li>Engage in money laundering or other financial crimes</li>
                                <li>Harass, abuse, or threaten other users</li>
                                <li>Reverse engineer or exploit vulnerabilities in the platform</li>
                                <li>Create multiple accounts to circumvent platform rules</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">8. Fees</h2>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>Platform Fee: 5% of the job budget on approved payouts</li>
                                <li>Lightning Network fees may apply to top-up transactions</li>
                                <li>Fees are non-refundable once processed</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
                            <p className="text-muted-foreground">
                                TO THE MAXIMUM EXTENT PERMITTED BY LAW, BEREKA AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">10. Service Availability</h2>
                            <p className="text-muted-foreground">
                                We do not guarantee uninterrupted or error-free operation of the platform. We reserve the right to modify, suspend, or discontinue the service at any time without prior notice.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">11. Changes to Terms</h2>
                            <p className="text-muted-foreground">
                                We may update these Terms from time to time. Continued use of the platform after changes constitutes acceptance of the new Terms. We will notify users of material changes via email or platform notification.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">12. Governing Law</h2>
                            <p className="text-muted-foreground">
                                These Terms are governed by and construed in accordance with applicable laws. Any disputes arising from these Terms or use of the service shall be resolved through binding arbitration.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">13. Contact</h2>
                            <p className="text-muted-foreground">
                                For questions about these Terms, please contact us at: <a href="mailto:support@bereka.app" className="text-primary hover:underline">support@bereka.app</a>
                            </p>
                        </section>

                        <div className="mt-8 pt-6 border-t">
                            <p className="text-sm text-muted-foreground italic">
                                By using Bereka, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
