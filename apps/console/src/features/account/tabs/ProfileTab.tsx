import { useRef, useState } from 'react'
import { Badge, Button, Card, CardHeader, Notice, PageState, ReasonDialog, TextField, useDisclosure, useToast } from '../../../shared/ui'
import { Warning } from '@phosphor-icons/react'
import { initials } from '../../../shared/lib/format'
import { uploadImage, ikUrl } from '../../../shared/services/imagekit.service'
import { useAccount } from '../hooks/useAccountData'
import { formatDate } from '../lib'
import { requestDeactivation, updateProfile } from '../services/account.service'
import type { AccountData } from '../types'

interface ProfileForm {
  full_name: string
  display_name: string
  phone: string
  job_title: string
  department: string
  avatar_url: string
}

const toForm = (a: AccountData): ProfileForm => ({
  full_name: a.full_name,
  display_name: a.display_name ?? '',
  phone: a.phone ?? '',
  job_title: a.job_title ?? '',
  department: a.department ?? '',
  avatar_url: a.avatar_url ?? '',
})

export function ProfileTab() {
  const account = useAccount()
  if (account.error && !account.data) return <PageState title="Couldn't load your profile" description={account.error} action={<Button onClick={account.reload}>Try again</Button>} />
  if (!account.data) return <PageState title="Loading…" />
  return <ProfileContent key={account.data.full_name + account.data.avatar_url} data={account.data} onSaved={account.reload} />
}

function ProfileContent({ data, onSaved }: { data: AccountData; onSaved: () => void }) {
  const toast = useToast()
  const [form, setForm] = useState<ProfileForm>(() => toForm(data))
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const deactivate = useDisclosure()
  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(data))
  const patch = (change: Partial<ProfileForm>) => setForm((f) => ({ ...f, ...change }))

  const save = async () => {
    setBusy(true)
    try {
      await updateProfile({ ...form })
      toast({ title: 'Profile saved' })
      onSaved()
    } catch (err) {
      toast({ tone: 'error', title: 'Could not save', description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  const upload = async (file: File | undefined) => {
    if (!file) return
    if (!/^image\/(jpeg|png)$/.test(file.type)) return toast({ tone: 'error', title: 'Use a JPG or PNG image.' })
    if (file.size > 2 * 1024 * 1024) return toast({ tone: 'error', title: 'The photo must be 2 MB or smaller.' })
    setUploading(true)
    try {
      patch({ avatar_url: (await uploadImage(file, '/avatars')).url })
    } catch (err) {
      toast({ tone: 'error', title: 'Photo upload failed', description: err instanceof Error ? err.message : undefined })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <Card className="gap-5">
        <CardHeader title="Profile" subtitle="Visible to other team members and in the audit log." />
        <div className="flex items-center gap-4">
          <span className="inline-flex size-16 flex-none items-center justify-center overflow-hidden rounded-full bg-primary text-20 font-extrabold text-white">
            {form.avatar_url ? <img src={ikUrl(form.avatar_url, { w: 128, h: 128 })} alt="" className="size-full object-cover" /> : initials(form.full_name)}
          </span>
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <Button variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? 'Uploading…' : 'Upload photo'}</Button>
              {form.avatar_url && <Button variant="outline" onClick={() => patch({ avatar_url: '' })}>Remove</Button>}
            </div>
            <span className="text-11 text-ink-faint">JPG or PNG · square · max 2 MB</span>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png" hidden onChange={(e) => void upload(e.target.files?.[0])} />
        </div>

        <div className="grid gap-4 min-[700px]:grid-cols-2">
          <TextField id="full-name" label="Full name" maxLength={80} value={form.full_name} onChange={(e) => patch({ full_name: e.target.value })} />
          <TextField id="display-name" label="Display name" maxLength={60} value={form.display_name} onChange={(e) => patch({ display_name: e.target.value })} />
          <TextField id="work-email" label="Work email" value={data.email} disabled readOnly />
          <TextField id="phone" label="Phone (for security alerts)" maxLength={30} value={form.phone} onChange={(e) => patch({ phone: e.target.value })} />
          <TextField id="job-title" label="Job title" maxLength={80} value={form.job_title} onChange={(e) => patch({ job_title: e.target.value })} />
          <TextField id="department" label="Department" maxLength={80} value={form.department} onChange={(e) => patch({ department: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2.5">
          <Button variant="outline" disabled={!dirty || busy} onClick={() => setForm(toForm(data))}>Cancel</Button>
          <Button disabled={!dirty || busy || form.full_name.trim().length < 2} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </Card>

      <Card className="gap-4">
        <CardHeader title="Role & access" subtitle="Assigned by another Super admin. You can't change your own role." action={<Badge tone="primary">{data.role_label}</Badge>} />
        <dl className="grid grid-cols-2 gap-3 min-[900px]:grid-cols-4">
          {[
            ['Member since', formatDate(data.member_since)],
            ['Invited by', data.invited_by ?? '—'],
            ['Access', 'Permanent'],
            ['Last role change', '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5 rounded-xl bg-surface p-3">
              <dt className="text-11 font-medium text-ink-muted">{k}</dt>
              <dd className="text-13 font-bold">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-1.5">
          {data.permissions.map((p) => (
            <span key={p.area} className="rounded-full bg-success-soft px-2.5 py-1 text-11 font-bold text-success" title={p.level}>✓ {p.area}</span>
          ))}
        </div>
      </Card>

      <Card className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-15 font-bold">Leave the console</h2>
            <p className="max-w-150 text-12 text-ink-muted">Transfer ownership of your content & open tickets first. Your audit history stays for 5 years.</p>
          </div>
          <Button variant="danger" disabled={data.deactivation_requested_at !== null} onClick={deactivate.onOpen}>
            {data.deactivation_requested_at ? 'Deactivation requested' : 'Request deactivation'}
          </Button>
        </div>
        {data.deactivation_requested_at && <Notice tone="warning" icon={<Warning size={16} />}>A Super admin will review your request on {formatDate(data.deactivation_requested_at)}.</Notice>}
      </Card>

      <ReasonDialog
        open={deactivate.open}
        onClose={deactivate.onClose}
        tone="danger"
        title="Request deactivation?"
        description="A Super admin reviews the request. Your access stays active until then."
        confirmLabel="Send request"
        reasonLabel="Why are you leaving?"
        placeholder="e.g. Moving to another team"
        onConfirm={async (reason) => {
          await requestDeactivation(reason)
          toast({ title: 'Request sent' })
          onSaved()
        }}
      />
    </>
  )
}
