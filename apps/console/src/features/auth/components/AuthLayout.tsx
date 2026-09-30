import { CaretDown, Globe, Lifebuoy } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { BrandPanel } from './BrandPanel'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <BrandPanel />
      <main className="flex min-w-0 flex-1 flex-col px-5 py-6 min-[601px]:px-12 min-[601px]:py-10">
        <div className="flex justify-end gap-4">
          <span className="inline-flex items-center gap-1.5 text-13 font-semibold text-ink-muted">
            <Globe size={14} />
            English
            <CaretDown size={13} />
          </span>
          <span className="inline-flex items-center gap-1.5 text-13 font-semibold text-ink-muted">
            <Lifebuoy size={14} />
            Help
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center py-6">
          <div className="flex w-105 max-w-full flex-col gap-5.5">{children}</div>
        </div>

        <footer className="flex justify-center gap-4.5 text-12 text-ink-faint">
          <span>Privacy policy</span>
          <span>Security</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-[7px] rounded-full bg-success" />
            Status: all systems normal
          </span>
        </footer>
      </main>
    </div>
  )
}
