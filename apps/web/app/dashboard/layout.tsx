"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { LayoutDashboard, Wallet, Briefcase, PlusCircle, Settings, LogOut, ShieldCheck, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase"

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
    { href: '/dashboard/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/dashboard/jobs/create', label: 'Create Job', icon: PlusCircle },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [isAdmin, setIsAdmin] = useState(false)
    const [username, setUsername] = useState<string | null>(null)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        const fetchProfile = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('role, username')
                .eq('id', user.id)
                .single()

            if (profile) {
                setIsAdmin(profile.role === 'admin')
                setUsername(profile.username)
            }
        }
        fetchProfile()
    }, [])

    // Close mobile menu on navigation
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [pathname])

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard'
        return pathname.startsWith(href)
    }

    const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
        <>
            {navItems.map(item => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-muted ${
                        isActive(item.href)
                            ? 'text-primary bg-muted font-medium'
                            : 'text-muted-foreground'
                    } ${mobile ? 'text-base' : ''}`}
                >
                    <item.icon className="h-4 w-4" />
                    <span className={mobile ? '' : 'hidden md:inline'}>{item.label}</span>
                </Link>
            ))}
            {isAdmin && (
                <Link
                    href="/dashboard/admin"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-muted ${
                        isActive('/dashboard/admin')
                            ? 'text-primary bg-muted font-medium'
                            : 'text-muted-foreground'
                    } ${mobile ? 'text-base' : ''}`}
                >
                    <ShieldCheck className="h-4 w-4" />
                    <span className={mobile ? '' : 'hidden md:inline'}>Admin</span>
                </Link>
            )}
        </>
    )

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40 md:flex-row">
            {/* Desktop Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex md:w-64">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <span>Bereka</span>
                    </Link>
                </div>
                {username && (
                    <div className="px-4 py-2 border-b">
                        <p className="text-xs text-muted-foreground hidden md:block">Signed in as</p>
                        <p className="text-sm font-medium hidden md:block truncate">{username}</p>
                    </div>
                )}
                <nav className="flex flex-1 flex-col gap-2 p-4">
                    <NavLinks />
                </nav>
                <div className="mt-auto p-4 space-y-2">
                    <Link
                        href="/dashboard/settings"
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-muted ${
                            isActive('/dashboard/settings')
                                ? 'text-primary bg-muted font-medium'
                                : 'text-muted-foreground'
                        }`}
                    >
                        <Settings className="h-4 w-4" />
                        <span className="hidden md:inline">Settings</span>
                    </Link>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 sm:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Drawer */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-background border-r transform transition-transform duration-200 ease-in-out sm:hidden ${
                mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="flex h-14 items-center justify-between border-b px-4">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        Bereka
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                {username && (
                    <div className="px-4 py-3 border-b">
                        <p className="text-xs text-muted-foreground">Signed in as</p>
                        <p className="text-sm font-medium truncate">{username}</p>
                    </div>
                )}
                <nav className="flex flex-col gap-1 p-4">
                    <NavLinks mobile />
                </nav>
                <div className="mt-auto p-4 border-t space-y-2">
                    <Link
                        href="/dashboard/settings"
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-muted ${
                            isActive('/dashboard/settings')
                                ? 'text-primary bg-muted font-medium'
                                : 'text-muted-foreground'
                        }`}
                    >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                    </Link>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-muted-foreground"
                        onClick={handleSignOut}
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-col flex-1 sm:gap-4 sm:py-4 sm:pl-14 md:pl-64">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    {/* Mobile hamburger */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="sm:hidden"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                    <div className="font-semibold sm:hidden">Bereka</div>
                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleSignOut}>
                            <LogOut className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </Button>
                    </div>
                </header>
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
