import { EyeSlash, FlowerLotus, Scroll, ShieldCheck } from '@phosphor-icons/react'
import { APP_NAME, APP_VERSION } from '../../../config/app'
import { env } from '../../../config/env'
import styles from './BrandPanel.module.css'

const SECURITY_POINTS = [
  { icon: ShieldCheck, text: '2FA & SSO required for all team members' },
  { icon: EyeSlash, text: 'Health data masked by default' },
  { icon: Scroll, text: 'Immutable audit log · UU PDP compliant' },
]

export function BrandPanel() {
  return (
    <aside className={styles.panel}>
      <span className={`${styles.glow} ${styles.glowOne}`} />
      <span className={`${styles.glow} ${styles.glowTwo}`} />

      <div className={styles.top}>
        <span className={styles.mark}>
          <FlowerLotus size={22} weight="fill" color="var(--primary)" />
        </span>
        <span className={styles.name}>{APP_NAME}</span>
        <span className={styles.tag}>ADMIN CONSOLE</span>
      </div>

      <div className={styles.middle}>
        <h2 className={styles.heading}>Caring for every woman on her path to two lines.</h2>
        <p className={styles.sub}>
          Every action in this console touches sensitive health data. Access is restricted, masked by default and
          logged.
        </p>
        <ul className={styles.points}>
          {SECURITY_POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className={styles.point}>
              <span className={styles.pointIcon}>
                <Icon size={16} color="#fff" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.bottom}>
        <span className={styles.env}>
          <span className={styles.dot} />
          {env.isProduction ? 'Production' : 'Local development'}
        </span>
        <span className={styles.version}>v{APP_VERSION}</span>
      </div>
    </aside>
  )
}
