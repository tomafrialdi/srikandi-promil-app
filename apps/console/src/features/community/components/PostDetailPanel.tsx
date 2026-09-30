import { ArrowSquareOut, HeartStraight } from '@phosphor-icons/react'
import { useState } from 'react'
import { Badge, Button, Card, Tooltip, TooltipBody, TextAreaField } from '../../../shared/ui'
import { REASON, PROTOCOL, shortAge } from '../config/labels'
import type { PostDetail, ResolveAction } from '../types'

const atFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' })

interface PostDetailPanelProps {
  post?: PostDetail | null
  loading: boolean
  busy: boolean
  onResolve: (action: ResolveAction, note: string) => void
  onAddNote: (note: string) => Promise<void>
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-surface p-3">
      <span className="text-11 font-medium text-ink-muted">{label}</span>
      <span className="text-13 font-bold">{value}</span>
    </div>
  )
}

export function PostDetailPanel({ post, loading, busy, onResolve, onAddNote }: PostDetailPanelProps) {
  const [note, setNote] = useState('')

  if (!post) {
    return (
      <Card className="min-h-60 flex-1 items-center justify-center">
        <p className="text-13 text-ink-muted">{loading ? 'Loading…' : 'Select an item from the queue to review it.'}</p>
      </Card>
    )
  }

  const reason = post.reason ? REASON[post.reason] : null
  const urgent = post.reason === 'self_harm'
  const open = post.mod_status === 'open' || post.mod_status === 'appealed'
  const sources = [post.reports > 0 ? `${post.reports} user${post.reports === 1 ? '' : 's'}` : null, post.ai_score != null ? `AI (${post.ai_score.toFixed(2)})` : null].filter(Boolean)
  const months = post.account_months
  const age = months == null ? '—' : months >= 12 ? `${Math.floor(months / 12)} y ${months % 12} m` : `${months} m`

  return (
    <Card className={loading ? 'flex-1 gap-4 opacity-60' : 'flex-1 gap-4'}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {reason && <Badge tone={reason.tone}>{reason.label}{urgent ? ' · urgent' : ''}</Badge>}
          <span className="text-12 text-ink-muted">Reported by {sources.join(' + ') || 'moderators'}</span>
        </div>
        <Tooltip placement="bottom" align="end" content={<TooltipBody title="Deep link to the post is coming soon" />}>
          <Button variant="outline" disabled leadingIcon={<ArrowSquareOut size={15} />}>Open in app</Button>
        </Tooltip>
      </header>

      <div className="flex flex-col gap-2.5 rounded-xl border border-border p-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary-soft text-14 font-extrabold text-primary">{post.author.charAt(0).toUpperCase()}</span>
          <div className="flex flex-col">
            <span className="text-13 font-bold">{post.author}</span>
            <span className="text-11 text-ink-muted">{post.group} · posted {shortAge(post.created_at)} ago · {atFormat.format(new Date(post.created_at))}</span>
          </div>
        </div>
        <p className="text-14 leading-relaxed">{post.body}</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 min-[900px]:grid-cols-4">
        <Fact label="Account age" value={age} />
        <Fact label="Mode" value={post.mode ?? '—'} />
        <Fact label="Prior reports" value={String(post.prior_reports)} />
        <Fact label="Last check-in" value={post.last_checkin ?? '—'} />
      </div>

      {urgent && (
        <div className="flex gap-3 rounded-xl bg-error-soft p-3.5 text-error">
          <HeartStraight size={20} weight="fill" className="mt-0.5 flex-none" />
          <div className="flex flex-col gap-1">
            <span className="text-13 font-extrabold">Wellbeing protocol</span>
            <span className="text-12 leading-normal font-medium">{PROTOCOL}</span>
          </div>
        </div>
      )}

      {open ? (
        <div className="flex flex-wrap gap-2.5">
          {urgent ? (
            <>
              <Button disabled={busy} onClick={() => onResolve('hide_support', note)}>Hide + send support</Button>
              <Button variant="outline" disabled={busy} onClick={() => onResolve('escalate', note)}>Escalate to counsellor</Button>
            </>
          ) : (
            <>
              <Button disabled={busy} onClick={() => onResolve('hide', note)}>Hide post</Button>
              <Button variant="danger" disabled={busy} onClick={() => onResolve('remove', note)}>Remove</Button>
              <Button variant="outline" disabled={busy} onClick={() => onResolve('escalate', note)}>Escalate</Button>
            </>
          )}
          <Button variant="outline" disabled={busy} onClick={() => onResolve('approve', note)}>Approve</Button>
        </div>
      ) : (
        <p className="rounded-xl bg-surface-alt px-3.5 py-2.5 text-12 font-semibold text-ink-muted">Already handled: {post.mod_status.replace('_', ' ')}.</p>
      )}

      <div className="flex flex-col gap-2 border-t border-border pt-3.5">
        {post.notes.map((n, i) => (
          <p key={i} className="text-12 leading-snug"><span className="font-bold">{n.by}</span> <span className="text-ink-faint">· {atFormat.format(new Date(n.at))}</span><br />{n.note}</p>
        ))}
        <TextAreaField className="min-h-16" placeholder="Add internal note (visible to moderators only)…" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button
          variant="outline"
          className="self-start"
          disabled={busy || note.trim().length === 0}
          onClick={() => onAddNote(note.trim()).then(() => setNote(''))}
        >
          Save note
        </Button>
      </div>
    </Card>
  )
}
