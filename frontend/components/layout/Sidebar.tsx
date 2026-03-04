'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MessageSquare, FileText, LogOut, BarChart2, Cpu } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn, getInitials } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/authStore'
import { useChatStore } from '@/lib/store/chatStore'
import { useDocumentStore } from '@/lib/store/documentStore'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const navLinks = [
  {
    href: '/chat',
    label: 'Chat',
    icon: MessageSquare,
  },
  {
    href: '/documents',
    label: 'Documentos',
    icon: FileText,
  },
  {
    href: '#',
    label: 'Avaliações (em breve)',
    icon: BarChart2,
    disabled: true,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { clearHistory } = useChatStore()
  const { stopPolling } = useDocumentStore()

  const handleLogout = () => {
    clearHistory()
    stopPolling()
    logout()
    router.push('/login')
  }

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="flex flex-col w-16 md:w-60 h-full bg-surface border-r border-border flex-shrink-0 transition-all duration-200">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
            <Cpu size={16} className="text-primary" />
          </div>
          <span className="hidden md:block text-sm font-semibold text-foreground tracking-wide">
            DocSense
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 p-2 pt-4" aria-label="Navegação principal">
          {navLinks.map(({ href, label, icon: Icon, disabled }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`)

            const linkContent = (
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface',
                  disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
                )}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="hidden md:block truncate">{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                  />
                )}
              </div>
            )

            return (
              <Tooltip key={href}>
                <TooltipTrigger asChild>
                  {disabled ? (
                    <div>{linkContent}</div>
                  ) : (
                    <Link href={href}>{linkContent}</Link>
                  )}
                </TooltipTrigger>
                <TooltipContent side="right" className="md:hidden">
                  {label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        <Separator />

        {/* User footer */}
        <div className="p-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="text-xs">
                {user ? getInitials(user.full_name) : '?'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-foreground truncate">
                {user?.full_name ?? 'Usuário'}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {user?.email ?? ''}
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="hidden md:flex flex-shrink-0 items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Sair"
                >
                  <LogOut size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Sair</TooltipContent>
            </Tooltip>
          </div>

          {/* Mobile logout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="md:hidden flex items-center justify-center w-full py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label="Sair"
              >
                <LogOut size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Sair</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
