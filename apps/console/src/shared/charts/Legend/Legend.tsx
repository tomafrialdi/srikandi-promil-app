export interface LegendEntry {
  label: string
  color: string
}

export function Legend({ items }: { items: LegendEntry[] }) {
  return (
    <ul className="m-0 flex list-none flex-wrap justify-end gap-x-3.5 gap-y-1.5 p-0">
      {items.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-1.5 text-11 font-semibold text-ink-muted">
          <span className="size-2.5 rounded-[3px]" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  )
}
