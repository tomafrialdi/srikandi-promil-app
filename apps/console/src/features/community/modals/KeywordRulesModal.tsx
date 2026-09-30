import { Trash } from '@phosphor-icons/react'
import { useCallback, useState } from 'react'
import { useAsyncData } from '../../../shared/hooks/useAsyncData'
import { Badge, Button, Modal, ModalFooter, ModalSection, SelectField, TextField, useToast } from '../../../shared/ui'
import { REASON, REASON_OPTIONS } from '../config/labels'
import { deleteKeywordRule, fetchKeywordRules, saveKeywordRule } from '../services/community.service'
import type { CommunityReason } from '../types'

export function KeywordRulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const fetcher = useCallback(() => (open ? fetchKeywordRules() : Promise.resolve(null)), [open])
  const rules = useAsyncData(`community-keywords-${open}`, fetcher)
  const [keyword, setKeyword] = useState('')
  const [action, setAction] = useState<'flag' | 'hide'>('flag')
  const [reason, setReason] = useState<CommunityReason>('spam')
  const [busy, setBusy] = useState(false)

  const run = async (task: () => Promise<void>, failure: string) => {
    setBusy(true)
    try {
      await task()
      rules.reload()
    } catch (err) {
      toast({ tone: 'error', title: failure, description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  const add = () =>
    run(async () => {
      await saveKeywordRule(keyword, action, reason)
      setKeyword('')
    }, 'Could not add the rule')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Keyword rules"
      subtitle="Posts containing a keyword are flagged for review, or hidden right away."
      size="md"
      footer={<ModalFooter info="Matching is case-insensitive. Changes are logged."><Button onClick={onClose}>Done</Button></ModalFooter>}
    >
      <ModalSection label="Add a rule">
        <div className="grid gap-2.5 min-[700px]:grid-cols-[1fr_120px_200px_auto] min-[700px]:items-end">
          <TextField id="kw" label="Keyword or phrase" hideLabel aria-label="Keyword or phrase" placeholder="e.g. herbal promil" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <SelectField aria-label="Action" value={action} options={[{ value: 'flag', label: 'Flag' }, { value: 'hide', label: 'Hide' }]} onChange={(v) => setAction(v as 'flag' | 'hide')} />
          <SelectField aria-label="Reason" value={reason} options={REASON_OPTIONS} onChange={(v) => setReason(v as CommunityReason)} />
          <Button onClick={add} disabled={busy || keyword.trim().length < 2} className="h-12">Add</Button>
        </div>
      </ModalSection>
      <ModalSection label={`Rules${rules.data ? ` · ${rules.data.length}` : ''}`}>
        {rules.data && rules.data.length === 0 && <p className="text-13 text-ink-muted">No keyword rules yet.</p>}
        <div className="flex flex-col">
          {(rules.data ?? []).map((rule) => (
            <div key={rule.id} className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0">
              <span className="min-w-0 flex-1 truncate font-mono text-13 font-semibold">{rule.keyword}</span>
              <Badge tone={rule.action === 'hide' ? 'error' : 'warning'}>{rule.action === 'hide' ? 'Hide' : 'Flag'}</Badge>
              <span className="w-40 flex-none truncate text-12 text-ink-muted">{REASON[rule.reason].label}</span>
              <button type="button" aria-label={`Delete ${rule.keyword}`} disabled={busy} className="inline-flex size-8 items-center justify-center text-ink-muted disabled:opacity-45" onClick={() => run(() => deleteKeywordRule(rule.id), 'Could not delete')}>
                <Trash size={15} />
              </button>
            </div>
          ))}
        </div>
      </ModalSection>
    </Modal>
  )
}
