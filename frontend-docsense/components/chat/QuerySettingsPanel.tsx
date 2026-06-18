'use client'

import { Settings2, Zap, Search } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { QuerySettings } from '@/lib/types'

interface QuerySettingsPanelProps {
  settings: QuerySettings
  onChange: (settings: Partial<QuerySettings>) => void
}

export function QuerySettingsPanel({ settings, onChange }: QuerySettingsPanelProps) {
  return (
    <aside className="hidden lg:flex flex-col w-72 border-l border-border bg-surface/30 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Settings2 size={14} className="text-muted-foreground" />
        <span className="text-xs font-medium text-foreground uppercase tracking-wider">
          Configuracoes
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Retrieval section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search size={13} className="text-accent" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Busca
            </span>
          </div>

          {/* top_k */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-foreground">
                Trechos recuperados
              </Label>
              <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                {settings.top_k}
              </span>
            </div>
            <Slider
              min={1}
              max={20}
              step={1}
              value={[settings.top_k]}
              onValueChange={([v]) => onChange({ top_k: v })}
              className="w-full"
              aria-label="Número de trechos recuperados"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Quantos trechos do documento serão usados como contexto.
            </p>
          </div>

          <Separator />

          {/* score_threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-foreground">
                Limiar de relevância
              </Label>
              <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                {settings.score_threshold.toFixed(2)}
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[settings.score_threshold]}
              onValueChange={([v]) => onChange({ score_threshold: v })}
              className="w-full"
              aria-label="Limiar de relevância semântica"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Score mínimo de similaridade para incluir um trecho.
            </p>
          </div>
        </div>

        <Separator />

        {/* Generation section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap size={13} className="text-accent" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Geração
            </span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="generate-answer" className="text-xs text-foreground cursor-pointer">
                Gerar resposta com IA
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Usa o LLaMA3 para sintetizar uma resposta a partir dos trechos.
              </p>
            </div>
            <Switch
              id="generate-answer"
              checked={settings.generate_answer}
              onCheckedChange={(v) => onChange({ generate_answer: v })}
            />
          </div>
        </div>

        <Separator />

        {/* Info box */}
        <div className="rounded-lg border border-border bg-surface/60 p-3 space-y-1">
          <p className="text-xs font-medium text-foreground">Como funciona</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Cada pergunta é convertida em um vetor semântico e comparada com os chunks dos
            documentos via pgvector. Os trechos mais similares formam o contexto da resposta.
          </p>
        </div>
      </div>
    </aside>
  )
}
