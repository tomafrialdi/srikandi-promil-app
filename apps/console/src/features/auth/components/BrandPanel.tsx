import { EyeSlash, FlowerLotus, Scroll, ShieldCheck } from '@phosphor-icons/react'
import { APP_NAME, APP_VERSION } from '../../../config/app'
import { env } from '../../../config/env'

const SECURITY_POINTS = [
  { icon: ShieldCheck, text: '2FA & SSO required for all team members' },
  { icon: EyeSlash, text: 'Health data masked by default' },
  { icon: Scroll, text: 'Immutable audit log · UU PDP compliant' },
]

export function BrandPanel() {
  return (
    <aside className="relative hidden w-155 flex-none flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#c93f6c_0%,#b23461_55%,#9c2b53_100%)] p-14 text-white min-[1001px]:flex">
      <span className="pointer-events-none absolute -top-30 -right-35 size-105 rounded-full bg-white opacity-[0.08]" />
      <span className="pointer-events-none absolute -bottom-50 -left-40 size-120 rounded-full bg-white opacity-[0.06]" />

      <div className="relative flex items-center gap-2.5">
        <span className="inline-flex size-10 items-center justify-center rounded-[11px] bg-white">
          <FlowerLotus size={22} weight="fill" color="var(--primary)" />
        </span>
        <span className="text-19 font-extrabold">{APP_NAME}</span>
        <span className="rounded-md bg-white/15 px-[7px] py-[3px] text-10 font-extrabold">ADMIN CONSOLE</span>
      </div>

      <div className="relative flex flex-col gap-5">
        <h2 className="text-38 leading-tight font-extrabold">Caring for every woman on her path to two lines.</h2>
        <p className="text-15 leading-relaxed text-white/80">
          Every action in this console touches sensitive health data. Access is restricted, masked by default and logged.
        </p>
        <ul className="m-0 flex list-none flex-col gap-3 p-0 pt-2">
          {SECURITY_POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-14 font-semibold">
              <span className="inline-flex size-8 items-center justify-center rounded-[9px] bg-white/15">
                <Icon size={16} color="#fff" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-12 font-bold">
          <span className="size-[7px] rounded-full bg-[#8fd19b]" />
          {env.isProduction ? 'Production' : 'Local development'}
        </span>
        <span className="text-12 font-semibold text-white/70">v{APP_VERSION}</span>
      </div>
    </aside>
  )
}
