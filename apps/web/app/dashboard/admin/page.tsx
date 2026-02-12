"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert, Download } from "lucide-react"
import { toast } from "sonner"

interface DisputedJob {
    id: string
    title: string
    description: string
    budget_sats: number
    status: string
    creator_id: string
    worker_id: string | null
    disputes?: DisputeRecord[]
    creator_profile?: { username: string | null }
    worker_profile?: { username: string | null }
}

interface DisputeRecord {
    id: string
    reason: string
    evidence_urls: string[] | null
    opened_by: string
    status: string
    created_at: string
    opener_profile?: { username: string | null }
}

interface Profile {
    role: string
}

interface LedgerEntry {
    id: string
    debit_account_id: string
    credit_account_id: string
    amount_sats: number
    reference_type: string
    reference_id: string
    created_at: string
}

interface Account {
    id: string
    user_id: string | null
    type: string
    balance_sats: number
    created_at: string
}

interface PaymentEvent {
    id: string
    provider: string
    payment_hash: string
    amount_sats: number
    status: string
    processed_at: string
}

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'disputes' | 'ledger'>('disputes')
    const [disputes, setDisputes] = useState<DisputedJob[]>([])
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([])
    const [accounts, setAccounts] = useState<Account[]>([])
    const [paymentEvents, setPaymentEvents] = useState<PaymentEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [user, setUser] = useState<any>(null)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const init = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            if (!user) { setLoading(false); return }

            // Check admin role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'admin') {
                setIsAdmin(false)
                setLoading(false)
                return
            }
            setIsAdmin(true)

            // Fetch disputed jobs with their dispute records
            const { data: disputesData } = await supabase
                .from('jobs')
                .select(`
                    *,
                    disputes!disputes_job_id_fkey(
                        id,
                        reason,
                        evidence_urls,
                        opened_by,
                        status,
                        created_at
                    ),
                    creator_profile:profiles!jobs_creator_id_fkey(username),
                    worker_profile:profiles!jobs_worker_id_fkey(username)
                `)
                .eq('status', 'DISPUTED')
                .order('updated_at', { ascending: false })

            if (disputesData) setDisputes(disputesData as unknown as DisputedJob[])

            // Fetch ledger data
            const { data: ledgerData } = await supabase
                .from('ledger_entries')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100)

            if (ledgerData) setLedgerEntries(ledgerData)

            // Fetch accounts
            const { data: accountsData } = await supabase
                .from('accounts')
                .select('*')
                .order('created_at', { ascending: false })

            if (accountsData) setAccounts(accountsData)

            // Fetch payment events
            const { data: eventsData } = await supabase
                .from('payment_events')
                .select('*')
                .order('processed_at', { ascending: false })
                .limit(50)

            if (eventsData) setPaymentEvents(eventsData)

            setLoading(false)
        }
        init()
    }, [])

    const handleResolve = async (jobId: string, resolution: 'REFUND' | 'PAY_WORKER' | 'SPLIT') => {
        if (!user) return
        setActionLoading(jobId)
        const supabase = createClient()

        try {
            const { data, error } = await supabase.functions.invoke('resolve-dispute', {
                body: { jobId, resolution }
            })

            if (error) throw error
            setDisputes(disputes.filter(d => d.id !== jobId))
            toast.success(`Dispute resolved: ${resolution}`)
        } catch (e: any) {
            console.error(e)
            toast.error(e.message || "Resolution failed")
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) return <div className="p-8">Loading...</div>

    const exportToCsv = (data: any[], filename: string) => {
        if (data.length === 0) return

        const headers = Object.keys(data[0])
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <ShieldAlert className="h-12 w-12 text-red-500" />
                <h1 className="text-2xl font-bold">Unauthorized</h1>
                <p className="text-muted-foreground">You must be an admin to access this page.</p>
            </div>
        )
    }

    // Calculate summary stats
    const totalAvailable = accounts
        .filter(a => a.type === 'AVAILABLE')
        .reduce((sum, a) => sum + Number(a.balance_sats), 0)
    const totalEscrow = accounts
        .filter(a => a.type === 'ESCROW')
        .reduce((sum, a) => sum + Number(a.balance_sats), 0)
    const platformFees = accounts
        .find(a => a.type === 'PLATFORM_FEES')?.balance_sats || 0
    const externalDeposits = accounts
        .find(a => a.type === 'EXTERNAL_DEPOSITS')?.balance_sats || 0

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Admin Console</h1>
                    <p className="text-muted-foreground">Manage disputes and monitor ledger activity</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b">
                <Button
                    variant={activeTab === 'disputes' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('disputes')}
                >
                    Disputes {disputes.length > 0 && `(${disputes.length})`}
                </Button>
                <Button
                    variant={activeTab === 'ledger' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('ledger')}
                >
                    Ledger & Reconciliation
                </Button>
            </div>

            {/* Disputes Tab */}
            {activeTab === 'disputes' && (
                <div className="grid gap-4">
                    {disputes.map(dispute => {
                        const openDispute = dispute.disputes?.find(d => d.status === 'OPEN')
                        return (
                            <Card key={dispute.id} className="border-red-200 bg-red-50">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle>Dispute: {dispute.title}</CardTitle>
                                        <Badge variant="destructive">DISPUTED</Badge>
                                    </div>
                                    <CardDescription>
                                        Budget: {Number(dispute.budget_sats).toLocaleString()} sats
                                    </CardDescription>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Creator: {dispute.creator_profile?.username || dispute.creator_id.slice(0, 8) + '...'} 
                                        {' '}&bull;{' '}
                                        Worker: {dispute.worker_profile?.username || dispute.worker_id?.slice(0, 8) || 'N/A'}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {openDispute ? (
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs font-semibold text-red-700 uppercase">Dispute Reason</p>
                                                <p className="text-sm mt-1">{openDispute.reason}</p>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Opened {new Date(openDispute.created_at).toLocaleString()} by {openDispute.opened_by.slice(0, 8)}...
                                            </div>
                                            {openDispute.evidence_urls && openDispute.evidence_urls.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-muted-foreground">Evidence:</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {openDispute.evidence_urls.map((url, i) => (
                                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                               className="text-xs text-blue-600 hover:underline">
                                                                Evidence {i + 1}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">{dispute.description}</p>
                                    )}
                                    <div className="border-t pt-2">
                                        <p className="text-xs font-semibold text-muted-foreground">Job Description</p>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{dispute.description}</p>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleResolve(dispute.id, 'REFUND')}
                                        disabled={actionLoading === dispute.id}
                                    >
                                        Refund Creator
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleResolve(dispute.id, 'PAY_WORKER')}
                                        disabled={actionLoading === dispute.id}
                                    >
                                        Pay Worker
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={() => handleResolve(dispute.id, 'SPLIT')}
                                        disabled={actionLoading === dispute.id}
                                    >
                                        Split 50/50
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                    {disputes.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No active disputes. 🎉</p>
                        </div>
                    )}
                </div>
            )}

            {/* Ledger Tab */}
            {activeTab === 'ledger' && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Total Available</CardDescription>
                                <CardTitle className="text-2xl">{totalAvailable.toLocaleString()}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">User balances</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Total in Escrow</CardDescription>
                                <CardTitle className="text-2xl">{totalEscrow.toLocaleString()}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Locked funds</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Platform Fees</CardDescription>
                                <CardTitle className="text-2xl">{Number(platformFees).toLocaleString()}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Collected fees</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>External Deposits</CardDescription>
                                <CardTitle className="text-2xl">{Number(externalDeposits).toLocaleString()}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Total inflows</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Ledger Entries */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Recent Ledger Entries</CardTitle>
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => exportToCsv(ledgerEntries, 'ledger_entries.csv')}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export CSV
                                </Button>
                            </div>
                            <CardDescription>Last 100 transactions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">Date</th>
                                            <th className="text-left p-2">Type</th>
                                            <th className="text-left p-2">Debit Account</th>
                                            <th className="text-left p-2">Credit Account</th>
                                            <th className="text-right p-2">Amount (sats)</th>
                                            <th className="text-left p-2">Ref ID</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ledgerEntries.map(entry => (
                                            <tr key={entry.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2 text-xs">{new Date(entry.created_at).toLocaleDateString()}</td>
                                                <td className="p-2">
                                                    <Badge variant="outline" className="text-xs">{entry.reference_type}</Badge>
                                                </td>
                                                <td className="p-2 text-xs font-mono">{entry.debit_account_id.slice(0, 8)}...</td>
                                                <td className="p-2 text-xs font-mono">{entry.credit_account_id.slice(0, 8)}...</td>
                                                <td className="p-2 text-right font-semibold">{Number(entry.amount_sats).toLocaleString()}</td>
                                                <td className="p-2 text-xs font-mono">{entry.reference_id.slice(0, 12)}...</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Events */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Recent Payment Events</CardTitle>
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => exportToCsv(paymentEvents, 'payment_events.csv')}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export CSV
                                </Button>
                            </div>
                            <CardDescription>Last 50 payments processed</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">Date</th>
                                            <th className="text-left p-2">Provider</th>
                                            <th className="text-left p-2">Payment Hash</th>
                                            <th className="text-right p-2">Amount (sats)</th>
                                            <th className="text-left p-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentEvents.map(event => (
                                            <tr key={event.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2 text-xs">{new Date(event.processed_at).toLocaleString()}</td>
                                                <td className="p-2">
                                                    <Badge variant="secondary" className="text-xs">{event.provider}</Badge>
                                                </td>
                                                <td className="p-2 text-xs font-mono">{event.payment_hash.slice(0, 16)}...</td>
                                                <td className="p-2 text-right font-semibold">{Number(event.amount_sats).toLocaleString()}</td>
                                                <td className="p-2">
                                                    <Badge className="text-xs bg-green-100 text-green-800">{event.status}</Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
