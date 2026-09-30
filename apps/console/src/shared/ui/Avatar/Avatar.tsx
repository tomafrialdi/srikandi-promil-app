import styles from './Avatar.module.css'

interface AvatarProps {
  label: string
  size?: number
  tone?: 'primary' | 'secondary'
}

export function Avatar({ label, size = 32, tone = 'secondary' }: AvatarProps) {
  return (
    <span
      className={`${styles.avatar} ${styles[tone]}`}
      style={{ width: size, height: size, fontSize: size >= 34 ? 13 : 12 }}
      aria-hidden="true"
    >
      {label}
    </span>
  )
}
