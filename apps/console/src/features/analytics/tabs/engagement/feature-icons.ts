import { ChatsCircle, FileText, Hourglass, Shapes, Smiley, Syringe, TestTube, Thermometer, UsersThree, Waves, type Icon } from '@phosphor-icons/react'

/** Icon per feature in the `feature_catalog`; unknown features fall back to a generic shape. */
const FEATURE_ICON: Record<string, Icon> = {
  'LH test scan': TestTube,
  'Basal temperature': Thermometer,
  'Cervical fluid': Waves,
  'Two-week wait': Hourglass,
  'Daily check-in': Smiley,
  'Partner mode': UsersThree,
  Community: ChatsCircle,
  'Doctor report': FileText,
  'Treatment program': Syringe,
}

export const featureIcon = (feature: string): Icon => FEATURE_ICON[feature] ?? Shapes
