import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavLink } from '@/components/nav-link'
import { Sparkles, Target, Kanban, BarChart3, Settings, LogOut, Building2 } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, agencies(name)')
    .eq('id', user.id)
    .single()

  const agencyName = (profile?.agencies as { name?: string } | null)?.name || 'My Agency'
  const fullName = profile?.full_name || user.email || 'User'
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">Growth Engine</p>
              <div className="flex items-center gap-1 text-slate-400 text-xs">
                <Building2 className="h-3 w-3" />
                <span className="truncate">{agencyName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <NavLink href="/" icon={<Sparkles className="h-4 w-4" />}>
            Discovery Feed
          </NavLink>
          <NavLink href="/missions" icon={<Target className="h-4 w-4" />}>
            Talent Missions
          </NavLink>
          <NavLink href="/pipeline" icon={<Kanban className="h-4 w-4" />}>
            Pipeline
          </NavLink>
          <NavLink href="/dashboard" icon={<BarChart3 className="h-4 w-4" />}>
            Dashboard
          </NavLink>
          <NavLink href="/settings" icon={<Settings className="h-4 w-4" />}>
            Settings
          </NavLink>
        </nav>

        {/* User */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{fullName}</p>
              <p className="text-slate-400 text-xs truncate">{profile?.role}</p>
            </div>
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="text-slate-400 hover:text-white transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
