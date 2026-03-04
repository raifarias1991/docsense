'use client'

import { usePathname } from 'next/navigation'
import { FileText, MessageSquare, CheckCircle } from 'lucide-react'
import { useDocumentStore } from '@/lib/store/documentStore'
import { useAuthStore } from '@/lib/store/authStore'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

const PAGE_META: Record<string, { title: string; icon: React.ElementType }> = {
  '/chat': { title: 'Chat', icon: MessageSquare },
  '/documents': { title: 'Documentos', icon: FileText },
}

export function Header() {
  const pathname = usePathname()
  const { documents } = useDocumentStore()
  const { user } = useAuthStore()

  const pageMeta = PAGE_META[pathname] ?? { title: 'DocSense', icon: MessageSquare }
  const PageIcon = pageMeta.icon

  const readyCount = documents.filter((d) => d.status === 'ready').length

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface/50 backdrop-blur-sm h-14 flex-shrink-0">
      {/* Page title */}
      <div className="flex items-center gap-2.5">
        <PageIcon size={18} className="text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{pageMeta.title}</h2>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Ready documents count */}
        {readyCount > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle size={13} className="text-success" />
            <span>{readyCount} {readyCount === 1 ? 'documento pronto' : 'documentos prontos'}</span>
          </div>
        )}

        {/* User avatar */}
        <Avatar className="w-7 h-7">
          <AvatarFallback className="text-xs">
            {user ? getInitials(user.full_name) : '?'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
