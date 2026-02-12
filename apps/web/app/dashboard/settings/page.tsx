"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Camera, X, Wallet } from "lucide-react"

interface Profile {
    username: string | null
    bio: string | null
    role: string
    lnbits_id: string | null
    skills: string[] | null
    avatar_url: string | null
}

type WalletStatus = "idle" | "creating" | "success" | "error"

const SUGGESTED_SKILLS = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python',
    'Design', 'Writing', 'Marketing', 'Data Entry', 'Testing',
    'Translation', 'Video Editing', 'Community Management', 'Research'
]

export default function SettingsPage() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [username, setUsername] = useState("")
    const [bio, setBio] = useState("")
    const [skills, setSkills] = useState<string[]>([])
    const [skillInput, setSkillInput] = useState("")
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [walletStatus, setWalletStatus] = useState<WalletStatus>("idle")
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('profiles')
                .select('username, bio, role, lnbits_id, skills, avatar_url')
                .eq('id', user.id)
                .single()

            if (data) {
                setProfile(data)
                setUsername(data.username ?? "")
                setBio(data.bio ?? "")
                setSkills(data.skills ?? [])
                setAvatarUrl(data.avatar_url)
            }
            setLoading(false)
        }
        fetchProfile()
    }, [])

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB')
            return
        }

        setUploadingAvatar(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        try {
            const fileExt = file.name.split('.').pop()
            const filePath = `${user.id}/avatar.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // Add cache buster
            const url = `${publicUrl}?t=${Date.now()}`
            setAvatarUrl(url)

            // Save to profile
            await supabase
                .from('profiles')
                .update({ avatar_url: url })
                .eq('id', user.id)

            toast.success('Avatar updated!')
        } catch (err: any) {
            toast.error(err.message || 'Failed to upload avatar')
        } finally {
            setUploadingAvatar(false)
        }
    }

    const addSkill = (skill: string) => {
        const trimmed = skill.trim()
        if (trimmed && !skills.includes(trimmed) && skills.length < 10) {
            setSkills([...skills, trimmed])
            setSkillInput("")
        }
    }

    const removeSkill = (skill: string) => {
        setSkills(skills.filter(s => s !== skill))
    }

    const handleSkillKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addSkill(skillInput)
        }
    }

    const handleCreateWallet = async () => {
        setWalletStatus("creating")
        const supabase = createClient()
        try {
            const { error } = await supabase.functions.invoke("create-wallet", {
                body: {},
            })
            if (error) throw error
            setWalletStatus("success")
            // Refresh profile to show wallet status
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from("profiles")
                    .select("username, bio, role, lnbits_id, skills, avatar_url")
                    .eq("id", user.id)
                    .single()
                if (data) setProfile(data)
            }
            toast.success("Lightning wallet created successfully!")
        } catch (err: any) {
            setWalletStatus("error")
            toast.error(err.message || "Failed to create wallet. Please try again.")
        }
    }

    const handleSave = async () => {
        if (username.trim().length < 3) {
            toast.error('Username must be at least 3 characters')
            return
        }

        setSaving(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('profiles')
            .update({
                username: username.trim() || null,
                bio: bio.trim() || null,
                skills: skills.length > 0 ? skills : null,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Profile updated successfully!')
        }
        setSaving(false)
    }

    if (loading) return <div className="p-8">Loading...</div>

    return (
        <div className="max-w-lg mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your profile and account.</p>

            {/* Avatar */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile Picture</CardTitle>
                    <CardDescription>Upload a profile photo.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                    <div
                        className="relative h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                            <Camera className="h-6 w-6 text-muted-foreground" />
                        )}
                        {uploadingAvatar && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                    <div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                        >
                            {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">Max 5MB. JPG, PNG, or WebP.</p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleAvatarUpload}
                    />
                </CardContent>
            </Card>

            {/* Profile Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Update your display name, bio, and skills.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="your_username"
                            minLength={3}
                        />
                        <p className="text-xs text-muted-foreground">Minimum 3 characters.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            placeholder="Tell us about yourself and your experience..."
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Skills & Tags</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {skills.map(skill => (
                                <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                                    {skill}
                                    <button
                                        onClick={() => removeSkill(skill)}
                                        className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={skillInput}
                                onChange={e => setSkillInput(e.target.value)}
                                onKeyDown={handleSkillKeyDown}
                                placeholder="Type a skill and press Enter"
                                disabled={skills.length >= 10}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addSkill(skillInput)}
                                disabled={!skillInput.trim() || skills.length >= 10}
                            >
                                Add
                            </Button>
                        </div>
                        {skills.length < 10 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {SUGGESTED_SKILLS
                                    .filter(s => !skills.includes(s))
                                    .slice(0, 6)
                                    .map(s => (
                                        <Button
                                            key={s}
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs"
                                            onClick={() => addSkill(s)}
                                        >
                                            + {s}
                                        </Button>
                                    ))
                                }
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">{skills.length}/10 skills added.</p>
                    </div>

                    <Button onClick={handleSave} disabled={saving} className="w-full">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Account Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Role</span>
                        <Badge variant="secondary">{profile?.role ?? 'worker'}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Lightning Wallet</span>
                        <Badge variant={profile?.lnbits_id ? 'default' : 'outline'}>
                            {profile?.lnbits_id ? 'Provisioned' : 'Not provisioned'}
                        </Badge>
                    </div>
                    {!profile?.lnbits_id && (
                        <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground mb-2">
                                Your Lightning wallet was not created during signup. Create one to start receiving payments and funding jobs.
                            </p>
                            <Button
                                onClick={handleCreateWallet}
                                disabled={walletStatus === "creating"}
                                variant="outline"
                                className="w-full gap-2"
                            >
                                <Wallet className="h-4 w-4" />
                                {walletStatus === "creating" ? "Creating wallet..." : "Create Lightning Wallet"}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
