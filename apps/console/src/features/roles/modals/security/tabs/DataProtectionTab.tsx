import { CheckCircle, UserGear } from '@phosphor-icons/react'
import { ModalSection, SelectField, Field, ToggleRow } from '../../../../../shared/ui'
import { ATTACHMENT_DAYS, PURGE_DAYS, UNMASK_RULES } from '../../../config/security-options'
import type { SectionProps } from '../security-draft'
import { InfoBox, Locked, SelectGrid, SelectSetting } from './parts'

export function DataProtectionTab({ value, onChange }: SectionProps<'data'>) {
  return (
    <>
      <ModalSection label="Health-data masking">
        <ToggleRow label="Mask health data by default" title={<Locked>Mask health data by default</Locked>} description="Cycle logs, test photos, notes & mood are hidden in every screen" checked disabled onChange={() => undefined} />
        <InfoBox tone="surface">
          <p className="m-0 mb-1 text-12 font-bold">To unmask, a member must:</p>
          {UNMASK_RULES.map((r) => (
            <div key={r.need} className="grid items-center gap-x-4 py-0.5 min-[701px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <span className="flex items-center gap-2 text-12 font-bold">
                <CheckCircle size={14} className="flex-none text-success" />
                {r.need}
              </span>
              <span className="text-12 text-ink-muted">{r.detail}</span>
            </div>
          ))}
        </InfoBox>
      </ModalSection>

      <ModalSection label="Exports & downloads">
        <ToggleRow label="Pseudonymise user IDs in exports" title="Pseudonymise user IDs in exports" description="Replaces usr_ IDs with per-export hashes" checked={value.pseudonymise_exports} onChange={(pseudonymise_exports) => onChange({ pseudonymise_exports })} />
        <ToggleRow label="Watermark exported files" title="Watermark exported files" description="Name + timestamp on every page / sheet" checked={value.watermark_exports} onChange={(watermark_exports) => onChange({ watermark_exports })} />
        <ToggleRow label="Require approval for large exports" title={`Require approval for exports > ${value.export_approval_rows.toLocaleString('en-US')} rows`} description="Second Admin must approve" checked={value.export_approval} onChange={(export_approval) => onChange({ export_approval })} />
      </ModalSection>

      <ModalSection label="Retention">
        <SelectGrid>
          <SelectSetting label="Deleted accounts purged after" value={value.deleted_purge_days} options={PURGE_DAYS} onChange={(deleted_purge_days) => onChange({ deleted_purge_days })} />
          <Field label="Audit log kept">
            <SelectField aria-label="Audit log kept" value="5" options={[{ value: '5', label: '5 years (UU PDP)' }]} disabled onChange={() => undefined} />
          </Field>
          <SelectSetting label="Support attachments" value={value.attachments_days} options={ATTACHMENT_DAYS} onChange={(attachments_days) => onChange({ attachments_days })} />
        </SelectGrid>
        <InfoBox>
          <span className="flex items-center gap-2.5">
            <UserGear size={18} className="flex-none" />
            <span className="flex flex-col">
              <span className="text-12 font-bold">Data Protection Officer · {value.dpo_name}</span>
              <span className="text-12">Receives weekly unmask report &amp; approves policy changes in this tab</span>
            </span>
          </span>
        </InfoBox>
      </ModalSection>
    </>
  )
}
