"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import QRCode from "react-qr-code"
import { toast } from "sonner"
import { Copy, RefreshCw, CheckCircle } from "lucide-react"

const INVOICE_EXPIRY_SECONDS = 3600 // 1 hour
const POLL_INTERVAL_MS = 3000

export default function WalletPage() {
    const [amount, setAmount] = useState("")
    const [invoice, setInvoice] = useState<string | null>(null)
    const [paymentHash, setPaymentHash] = useState<string | null>(null)
    const [isPaid, setIsPaid] = useState(false)
    const [loading, setLoading] = useState(false)
    const [checkingNow, setCheckingNow] = useState(false)
    const [balance, setBalance] = useState(0)
    const [escrowBalance, setEscrowBalance] = useState(0)
    const [secondsLeft, setSecondsLeft] = useState(INVOICE_EXPIRY_SECONDS)
    const [isExpired, setIsExpired] = useState(false)
    const invoiceCreatedAt = useRef<number>(0)

    useEffect(() => {
        const fetchBalance = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: accounts } = await supabase
                .from('accounts')
                .select('type, balance_sats')
                .eq('user_id', user.id)

            if (accounts) {
                const avail = accounts.find(a => a.type === 'AVAILABLE')
                const escrow = accounts.find(a => a.type === 'ESCROW')
                if (avail) setBalance(avail.balance_sats)
                if (escrow) setEscrowBalance(escrow.balance_sats)
            }
        }
        fetchBalance()
    }, [isPaid])

    const handleCreateInvoice = async () => {
        if (!amount || Number(amount) <= 0) return
        setLoading(true)
        setInvoice(null)
        setIsPaid(false)
        setIsExpired(false)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        try {
            const { data, error } = await supabase.functions.invoke('create-invoice', {
                body: { amountSats: Number(amount) }
            })
            if (error) throw error

            setInvoice(data.payment_request)
            setPaymentHash(data.payment_hash)
            invoiceCreatedAt.current = Date.now()
            setSecondsLeft(INVOICE_EXPIRY_SECONDS)
        } catch (e: any) {
            toast.error(e.message || 'Failed to create invoice')
        } finally {
            setLoading(false)
        }
    }

    // Countdown timer
    useEffect(() => {
        if (!invoice || isPaid || isExpired) return

        const timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - invoiceCreatedAt.current) / 1000)
            const remaining = INVOICE_EXPIRY_SECONDS - elapsed

            if (remaining <= 0) {
                setIsExpired(true)
                setSecondsLeft(0)
                clearInterval(timer)
            } else {
                setSecondsLeft(remaining)
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [invoice, isPaid, isExpired])

    // Poll for payment status
    const checkPayment = useCallback(async () => {
        if (!paymentHash || isPaid || isExpired) return

        const supabase = createClient()
        try {
            const { data } = await supabase.functions.invoke('check-payment', {
                body: { paymentHash }
            })
            if (data?.paid) {
                setIsPaid(true)
                toast.success('Payment received!')
            }
        } catch {
            // Silently retry
        }
    }, [paymentHash, isPaid, isExpired])

    useEffect(() => {
        if (!paymentHash || isPaid || isExpired) return
        const interval = setInterval(checkPayment, POLL_INTERVAL_MS)
        return () => clearInterval(interval)
    }, [paymentHash, isPaid, isExpired, checkPayment])

    // Manual "I've paid" check
    const handleManualCheck = async () => {
        setCheckingNow(true)
        await checkPayment()
        if (!isPaid) {
            toast.info("Payment not detected yet. We'll keep checking...")
        }
        setCheckingNow(false)
    }

    const handleCopyInvoice = () => {
        if (invoice) {
            navigator.clipboard.writeText(invoice)
            toast.success("Invoice copied to clipboard!")
        }
    }

    const handleReset = () => {
        setInvoice(null)
        setPaymentHash(null)
        setIsPaid(false)
        setIsExpired(false)
        setAmount("")
        setSecondsLeft(INVOICE_EXPIRY_SECONDS)
    }

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60)
        const s = totalSeconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    return (
        <div className="max-w-lg mx-auto space-y-6">
            {/* Balance Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Wallet</CardTitle>
                    <CardDescription>Current balance overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-baseline justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Available</p>
                            <p className="text-3xl font-bold">{Number(balance).toLocaleString()} sats</p>
                        </div>
                        {escrowBalance > 0 && (
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">In Escrow</p>
                                <p className="text-xl font-semibold text-yellow-600">{Number(escrowBalance).toLocaleString()} sats</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Top Up Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Up via Lightning</CardTitle>
                    <CardDescription>
                        Generate a Lightning invoice and pay it from any wallet
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Step 1: Enter amount */}
                    {!invoice && !isPaid && (
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount (sats)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="1000"
                                    min="1"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                {[1000, 5000, 10000, 50000].map(preset => (
                                    <Button
                                        key={preset}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAmount(String(preset))}
                                        className="flex-1"
                                    >
                                        {(preset / 1000).toFixed(preset < 1000 ? 1 : 0)}k
                                    </Button>
                                ))}
                            </div>
                            <Button
                                onClick={handleCreateInvoice}
                                disabled={loading || !amount || Number(amount) <= 0}
                                className="w-full"
                            >
                                {loading ? 'Generating...' : 'Generate Invoice'}
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Show invoice (not expired) */}
                    {invoice && !isPaid && !isExpired && (
                        <div className="space-y-4 text-center">
                            {/* Countdown */}
                            <div className={`text-sm font-mono ${secondsLeft < 300 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                Expires in {formatTime(secondsLeft)}
                            </div>

                            {/* QR Code */}
                            <div className="bg-white p-6 rounded-md inline-block">
                                <QRCode value={invoice} size={240} />
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Scan with your Lightning wallet or copy the invoice below
                            </p>

                            {/* Invoice string + copy */}
                            <div className="relative">
                                <Input
                                    value={invoice}
                                    readOnly
                                    className="pr-20 text-xs font-mono"
                                />
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="absolute right-1 top-1"
                                    onClick={handleCopyInvoice}
                                >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy
                                </Button>
                            </div>

                            {/* I've Paid + Waiting */}
                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="default"
                                    onClick={handleManualCheck}
                                    disabled={checkingNow}
                                >
                                    {checkingNow ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Checking...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            I&apos;ve Paid
                                        </>
                                    )}
                                </Button>
                                <p className="text-xs text-muted-foreground animate-pulse">
                                    Auto-checking every {POLL_INTERVAL_MS / 1000}s...
                                </p>
                            </div>

                            <Button variant="ghost" size="sm" onClick={handleReset}>
                                Cancel
                            </Button>
                        </div>
                    )}

                    {/* Invoice expired */}
                    {invoice && !isPaid && isExpired && (
                        <div className="text-center py-8 space-y-4">
                            <div className="text-4xl">⏰</div>
                            <h3 className="text-lg font-semibold text-red-600">Invoice Expired</h3>
                            <p className="text-sm text-muted-foreground">
                                The invoice has expired. Generate a new one to continue.
                            </p>
                            <Button onClick={handleCreateInvoice} disabled={loading}>
                                {loading ? 'Generating...' : 'Generate New Invoice'}
                            </Button>
                            <div>
                                <Button variant="ghost" size="sm" onClick={handleReset}>
                                    Change Amount
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Payment successful */}
                    {isPaid && (
                        <div className="text-center py-8 space-y-4">
                            <div className="text-5xl">⚡</div>
                            <h3 className="text-xl font-bold text-green-600">Payment Received!</h3>
                            <p className="text-muted-foreground">
                                {Number(amount).toLocaleString()} sats have been added to your balance.
                            </p>
                            <Button onClick={handleReset}>
                                Top Up Again
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
