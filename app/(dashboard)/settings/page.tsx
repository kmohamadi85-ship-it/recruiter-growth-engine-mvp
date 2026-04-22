'use client'

import { useState, useEffect } from 'react'
import { Settings, Building2, Users, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const { toast } = useToast()
  const [profile, setProfile] = useState<{ full_name?: string; email?: string; role?: string } | null>(null)
  const [agency, setAgency] = useState<{ name?: string } | null>(null)
  const [members, setMembers] = useState<Array<{ id: string; full_name?: string; email: string; role: string }>>([])
  const [fullName, setFullName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: p } = await supabase.from('profiles').select('*, agencies(name)').eq('id', user.id).single()
      if (p) {
        setProfile(p)
        setFullName(p.full_name || '')
        setAgency((p.agencies as { name?: string } | null))

        const { data: team } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .eq('agency_id', p.agency_id)
        setMembers(team || [])
      }
    }
    load()
  }, [])

  async function saveProfile() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)
      if (error) throw error
      toast({ title: 'Profile updated' })
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail) return
    setInviting(true)
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Invitation sent', description: `Invite sent to ${inviteEmail}` })
      setInviteEmail('')
    } catch {
      toast({ title: 'Failed to send invite', variant: 'destructive' })
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-indigo-600" />
          Settings
        </h1>
        <p className="text-gray-500 mt-1">Manage your profile and team</p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={profile?.email || ''} disabled className="mt-1 bg-gray-50" />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
            </div>
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Agency */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Agency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Agency Name</Label>
              <Input value={agency?.name || ''} disabled className="mt-1 bg-gray-50" />
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6">
              {members.map(member => (
                <div key={member.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-semibold">
                    {(member.full_name || member.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{member.full_name || member.email}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{member.role}</span>
                </div>
              ))}
            </div>

            {profile?.role === 'owner' && (
              <form onSubmit={sendInvite} className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Invite Team Member
                </h3>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="colleague@agency.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button type="submit" disabled={inviting}>
                    {inviting ? 'Sending…' : 'Invite'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
