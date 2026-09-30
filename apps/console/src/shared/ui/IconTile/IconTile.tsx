import type { CSSProperties, ReactNode } from 'react'
import styles from './IconTile.module.css'

interface IconTileProps {
  /** Background colour (CSS value or var()). */
  background: string
  size?: number
  round?: boolean
  children: ReactNode
}

export function IconTile({ background, size = 32, round = false, children }: IconTileProps) {
  const style: CSSProperties = {
    background,
    width: size,
    height: size,
    borderRadius: round ? '100%' : size <= 32 ? 9 : 10,
  }
  return (
    <span className={styles.tile} style={style}>
      {children}
    </span>
  )
}
