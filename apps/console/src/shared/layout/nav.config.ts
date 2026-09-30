import {
  Pulse,
  BellRinging,
  ChartLine,
  ChatsCircle,
  CreditCard,
  FileText,
  Hospital,
  Lifebuoy,
  Pill,
  Scroll,
  ShieldCheck,
  SquaresFour,
  Stethoscope,
  UserGear,
  Users,
  type Icon,
} from '@phosphor-icons/react'

export interface NavItem {
  label: string
  path: string
  icon: Icon
}

export interface NavSection {
  label: string
  items: NavItem[]
}

/** Single source of truth for the sidebar AND the router's placeholder pages. */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', path: '/', icon: SquaresFour },
      { label: 'Analytics', path: '/analytics', icon: ChartLine },
      { label: 'Users', path: '/users', icon: Users },
      { label: 'Subscriptions', path: '/subscriptions', icon: CreditCard },
    ],
  },
  {
    label: 'CONTENT',
    items: [
      { label: 'Articles', path: '/articles', icon: FileText },
      { label: 'Notifications', path: '/notifications', icon: BellRinging },
      { label: 'Community', path: '/community', icon: ChatsCircle },
    ],
  },
  {
    label: 'HEALTH',
    items: [
      { label: 'Fertility engine', path: '/fertility-engine', icon: Pulse },
      { label: 'Medications', path: '/medications', icon: Pill },
      { label: 'Doctors', path: '/doctors', icon: Stethoscope },
      { label: 'Clinics', path: '/clinics', icon: Hospital },
    ],
  },
  {
    label: 'SUPPORT',
    items: [{ label: 'Support tickets', path: '/support-tickets', icon: Lifebuoy }],
  },
  {
    label: 'SYSTEM',
    items: [
      { label: 'Roles & access', path: '/roles', icon: ShieldCheck },
      { label: 'Audit log', path: '/audit-log', icon: Scroll },
      { label: 'Account settings', path: '/account-settings', icon: UserGear },
    ],
  },
]

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items)
