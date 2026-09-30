import { BookOpenText, FunnelSimple, Plus } from '@phosphor-icons/react'
import { Button } from '../../../shared/ui'

interface CommunityHeaderProps {
  onGuidelines: () => void
  onKeywords: () => void
  onNewGroup: () => void
}

export function CommunityHeader({ onGuidelines, onKeywords, onNewGroup }: CommunityHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-26 font-extrabold">Community</h1>
        <p className="text-14 text-ink-muted">Keep the space safe, kind and medically accurate.</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button variant="outline" onClick={onGuidelines} leadingIcon={<BookOpenText size={16} />}>Guidelines</Button>
        <Button variant="outline" onClick={onKeywords} leadingIcon={<FunnelSimple size={16} />}>Keyword rules</Button>
        <Button onClick={onNewGroup} leadingIcon={<Plus size={16} color="#fff" />}>New group</Button>
      </div>
    </div>
  )
}
