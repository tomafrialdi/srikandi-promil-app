import { CaretDown, Globe, Lifebuoy } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { BrandPanel } from './BrandPanel'
import styles from './AuthLayout.module.css'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <BrandPanel />
      <main className={styles.formPanel}>
        <div className={styles.topBar}>
          <span className={styles.topLink}>
            <Globe size={14} />
            English
            <CaretDown size={13} />
          </span>
          <span className={styles.topLink}>
            <Lifebuoy size={14} />
            Help
          </span>
        </div>

        <div className={styles.formWrap}>
          <div className={styles.form}>{children}</div>
        </div>

        <footer className={styles.footer}>
          <span>Privacy policy</span>
          <span>Security</span>
          <span className={styles.status}>
            <span className={styles.statusDot} />
            Status: all systems normal
          </span>
        </footer>
      </main>
    </div>
  )
}
