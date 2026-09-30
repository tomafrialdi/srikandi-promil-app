import type { ReactNode } from 'react'

/** Numbered section card ("1 Campaign", "2 Audience"…). */
export function StepCard({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-card border border-border bg-card p-5">
      <header className="flex items-center gap-2.5">
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary-soft text-12 font-extrabold text-primary">{n}</span>
        <h2 className="text-15 font-bold">{title}</h2>
      </header>
      {children}
    </section>
  )
}
