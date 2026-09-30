import { Image as ImageIcon, LockSimple, Wrench } from '@phosphor-icons/react'
import { cn } from '../../../shared/lib/cn'
import { messageTime } from '../lib/format'
import type { TicketMessage } from '../types'

export function MessageBubble({ m }: { m: TicketMessage }) {
  if (m.kind === 'event') {
    return (
      <div className="flex justify-center">
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-surface-alt px-3 py-1.5 text-11 font-medium text-ink-muted">
          <Wrench size={12} className="flex-none" />
          <span className="truncate">{m.body}</span>
        </span>
      </div>
    )
  }
  const customer = m.kind === 'customer'
  const note = m.kind === 'note'
  return (
    <div className={cn('flex', customer ? 'justify-start' : 'justify-end')}>
      <div className={cn('flex max-w-[82%] flex-col gap-1.5 rounded-2xl px-4 py-3', customer && 'bg-surface-alt', m.kind === 'agent' && 'bg-primary-soft', note && 'border border-dashed border-warning bg-warning-soft')}>
        <div className="flex items-center justify-between gap-6 text-11 font-bold" style={{ color: customer ? 'var(--ink)' : note ? 'var(--warning-ink)' : 'var(--primary)' }}>
          <span className="inline-flex items-center gap-1.5">{note && <LockSimple size={11} />}{m.author}{note ? ' · internal note' : ''}</span>
          <span className="font-medium text-ink-faint">{messageTime(m.at)}</span>
        </div>
        <p className="m-0 text-13 leading-normal font-medium break-words whitespace-pre-wrap">{m.body}</p>
        {m.attachments.map((a) => (
          <span key={a.name} className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-card px-2.5 py-1.5 text-12 font-medium"><ImageIcon size={13} className="text-ink-muted" />{a.url ? <a href={a.url} target="_blank" rel="noreferrer" className="text-secondary">{a.name}</a> : a.name}</span>
        ))}
      </div>
    </div>
  )
}
