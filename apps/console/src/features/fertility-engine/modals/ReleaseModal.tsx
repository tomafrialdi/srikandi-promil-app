import { RocketLaunch, Trash, Warning } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { cn } from '../../../shared/lib/cn'
import { Button, ConfirmDialog, Field, Modal, ModalFooter, ModalSection, Notice, TextAreaField, TextField, useToast } from '../../../shared/ui'
import { ApprovalsList } from '../components/ApprovalsList'
import { runSuite, suiteSummary } from '../engine/golden'
import { useGoldenCases } from '../hooks/useEngineData'
import { discardDraft, decideVersion, releaseVersion, submitDraft, withdrawReview } from '../services/engine.service'
import type { EngineState } from '../types'
import { versionChip } from '../lib'

interface ReleaseModalProps {
  open: boolean
  onClose: () => void
  state: EngineState
  onDone: () => void
}

/** One modal for the whole release path: submit a draft, review it, start the canary, expand or roll back. */
export function ReleaseModal({ open, onClose, state, onDone }: ReleaseModalProps) {
  const toast = useToast()
  const golden = useGoldenCases()
  const subject = state.subject!
  const live = state.live
  const [summary, setSummary] = useState(subject.summary ?? '')
  const [notes, setNotes] = useState(subject.notes ?? '')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<'discard' | 'rollback' | 'withdraw' | null>(null)

  const results = useMemo(() => (golden.data && live ? runSuite(golden.data, live.config, subject.config) : []), [golden.data, live, subject.config])
  const suite = suiteSummary(results)
  const approved = state.approvals.filter((a) => a.decision === 'approved').length
  const mine = state.approvals.find((a) => a.mine && a.decision === 'pending')
  const canary = state.versions.find((v) => v.status === 'canary')

  const act = async (task: () => Promise<void>, done: string) => {
    setBusy(true)
    setError(null)
    try {
      await task()
      toast({ title: done })
      onDone()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const tile = (label: string, value: string, tone: string) => (
    <div className={cn('flex flex-col gap-0.5 rounded-xl px-3.5 py-3', tone)}>
      <span className="text-11 font-bold">{label}</span>
      <span className="text-16 font-extrabold text-ink">{value}</span>
    </div>
  )

  const footer =
    subject.status === 'draft' ? (
      <ModalFooter
        info={
          <button type="button" className="inline-flex items-center gap-1.5 text-12 font-bold text-error" onClick={() => setConfirm('discard')}>
            <Trash size={14} /> Discard draft
          </button>
        }
      >
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button disabled={busy || !state.me.can_release || suite.failed > 0 || summary.trim().length < 3 || !golden.data} onClick={() => act(() => submitDraft(summary.trim(), notes, { pass: suite.pass, total: suite.total, failed: suite.failed }), 'Submitted for medical review')}>
          {busy ? 'Submitting…' : 'Submit for review'}
        </Button>
      </ModalFooter>
    ) : subject.status === 'in_review' ? (
      <ModalFooter info={approved < 1 ? 'A canary needs at least one medical approval' : `${approved} of ${state.approvals.length} approvals`}>
        {state.me.can_release && <Button variant="outline" disabled={busy} onClick={() => setConfirm('withdraw')}>Withdraw</Button>}
        {mine && <Button variant="danger" disabled={busy} onClick={() => act(() => decideVersion(subject.id, false, note), 'Version rejected')}>Reject</Button>}
        {mine && <Button disabled={busy} onClick={() => act(() => decideVersion(subject.id, true, note), 'Approval recorded')}>Approve</Button>}
        {state.me.can_release && <Button disabled={busy || approved < 1} onClick={() => act(() => releaseVersion(subject.id, 'canary'), 'Canary started at 5%')} leadingIcon={<RocketLaunch size={16} color="#fff" />}>Start 5% canary</Button>}
      </ModalFooter>
    ) : (
      <ModalFooter info={approved < state.approvals.length ? 'Every medical reviewer has to approve before 100%' : 'All medical approvals are in'}>
        {mine && <Button variant="outline" disabled={busy} onClick={() => act(() => decideVersion(subject.id, true, note), 'Approval recorded')}>Approve</Button>}
        {state.me.can_release && <Button variant="danger" disabled={busy} onClick={() => setConfirm('rollback')}>Roll back</Button>}
        {state.me.can_release && subject.rollout_pct === 5 && <Button variant="outline" disabled={busy || approved < 1} onClick={() => act(() => releaseVersion(subject.id, 'expand_25'), 'Expanded to 25%')}>Expand to 25%</Button>}
        {state.me.can_release && <Button disabled={busy || approved < state.approvals.length || state.approvals.length === 0} onClick={() => act(() => releaseVersion(subject.id, 'expand_100'), `${subject.version} is live`)}>Promote to 100%</Button>}
      </ModalFooter>
    )

  return (
    <>
      <Modal open={open} onClose={() => !busy && onClose()} size="md" icon={<RocketLaunch size={20} />} title={versionChip(subject)} subtitle={subject.summary ?? 'Release path: 2 medical approvals → 5% canary → 25% → 100%'} footer={footer}>
        {error && <Notice tone="error" icon={<Warning size={16} />}>{error}</Notice>}

        {subject.status === 'draft' && (
          <>
            <div className="grid grid-cols-2 gap-3 min-[701px]:grid-cols-3">
              {tile('Golden tests', golden.data ? `${suite.pass} / ${suite.total} pass` : '…', 'bg-success-soft text-success')}
              {tile('Regressions', String(suite.failed), suite.failed ? 'bg-error-soft text-error' : 'bg-success-soft text-success')}
              {tile('Compared with', live?.version ?? '—', 'bg-secondary-soft text-secondary')}
            </div>
            {suite.failed > 0 ? (
              <Notice tone="error" icon={<Warning size={16} />}>
                {suite.failed} case{suite.failed === 1 ? '' : 's'} got worse than {live?.version}: {suite.blocking.map((b) => b.case.key).join(', ')}. Adjust the rules (Fertility engine → Mode overrides) and try again.
              </Notice>
            ) : (
              <Notice icon={<Warning size={16} />}>No regressions against {live?.version}. Submitting freezes the draft while medical reviewers sign it off.</Notice>
            )}
            <ModalSection label="What changed">
              <Field label="Summary" htmlFor="rel-summary" required hint="shown in the version banner">
                <TextField id="rel-summary" label="" hideLabel maxLength={120} placeholder="e.g. PCOS double-LH rule" value={summary} onChange={(e) => setSummary(e.target.value)} />
              </Field>
              <Field label="Notes for reviewers" htmlFor="rel-notes">
                <TextAreaField id="rel-notes" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
            </ModalSection>
          </>
        )}

        {subject.status !== 'draft' && (
          <>
            <ModalSection label="Approvals">
              <ApprovalsList approvals={state.approvals} author={subject.author} />
            </ModalSection>
            {mine && (
              <Field label="Your note (optional)" htmlFor="rel-note">
                <TextAreaField id="rel-note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
            )}
            {subject.golden && <Notice icon={<RocketLaunch size={16} />}>Golden tests at submission: {subject.golden.pass} / {subject.golden.total} pass.</Notice>}
            {subject.status === 'in_review' && canary && <Notice tone="warning" icon={<Warning size={16} />}>{canary.version} is still running as a canary. Promote or roll it back before starting another one.</Notice>}
          </>
        )}
      </Modal>
      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        tone="danger"
        title={confirm === 'discard' ? `Discard draft ${subject.version}?` : confirm === 'rollback' ? `Roll back ${subject.version}?` : `Withdraw ${subject.version} from review?`}
        description={
          confirm === 'discard'
            ? 'All unreleased changes in this draft are deleted. The live version is not affected.'
            : confirm === 'rollback'
              ? 'Canary users go back to the live rules immediately. The version is kept in the history.'
              : 'Approvals collected so far are cleared and the version becomes an editable draft again.'
        }
        confirmLabel={confirm === 'discard' ? 'Discard draft' : confirm === 'rollback' ? 'Roll back' : 'Withdraw'}
        onConfirm={async () => {
          if (confirm === 'discard') await discardDraft()
          else if (confirm === 'rollback') await releaseVersion(subject.id, 'rollback')
          else await withdrawReview()
          toast({ title: confirm === 'discard' ? 'Draft discarded' : confirm === 'rollback' ? `${subject.version} rolled back` : 'Withdrawn from review' })
          onDone()
          onClose()
        }}
      />
    </>
  )
}
