import { ProhibitInset } from '@phosphor-icons/react'
import { useParams } from 'react-router-dom'
import { Button, PageState, ReasonDialog, useDisclosure, useToast } from '../../../shared/ui'
import { ActivityCard } from '../components/detail/ActivityCard'
import { ClinicsCard } from '../components/detail/ClinicsCard'
import { DailyLogsCard } from '../components/detail/DailyLogsCard'
import { DetailHeader } from '../components/detail/DetailHeader'
import { DevicesCard } from '../components/detail/DevicesCard'
import { DoctorsCard } from '../components/detail/DoctorsCard'
import { EngineStatusCard } from '../components/detail/EngineStatusCard'
import { MedicationsCard } from '../components/detail/MedicationsCard'
import { PrivacyCard } from '../components/detail/PrivacyCard'
import { ProfileCard } from '../components/detail/ProfileCard'
import { SubscriptionCard } from '../components/detail/SubscriptionCard'
import { TrackingSummaryCard } from '../components/detail/TrackingSummaryCard'
import { useModalData } from '../hooks/useModalData'
import { useUnmaskGate } from '../hooks/useUnmaskGate'
import { useUserDetail } from '../hooks/useUsersData'
import { ChangePlanModal } from '../modals/change-plan/ChangePlanModal'
import { ClinicJourneyModal } from '../modals/ClinicJourneyModal'
import { DailyLogsModal } from '../modals/DailyLogsModal'
import { DoctorCareModal } from '../modals/DoctorCareModal'
import { EngineLogModal } from '../modals/EngineLogModal'
import { MedicationModal } from '../modals/MedicationModal'
import { fetchClinicJourney, fetchDoctorCare, fetchEngineLog, fetchMedication, fetchUserLogs, setUsersStatus } from '../services/users.service'

export function UserDetailPage() {
  const { userId = '' } = useParams()
  const toast = useToast()
  const { data, error, loading, reload } = useUserDetail(userId)
  const changePlan = useDisclosure()
  const status = useDisclosure()

  const engine = useUnmaskGate((_arg: string, reason: string) => fetchEngineLog(userId, reason))
  const logs = useUnmaskGate((_arg: string, reason: string) => fetchUserLogs(userId, reason))
  const medication = useUnmaskGate((id: string, reason: string) => fetchMedication(id, reason))
  const doctor = useModalData(fetchDoctorCare)
  const clinics = useModalData(fetchClinicJourney)

  if (error && !data) {
    return (
      <PageState
        title="Couldn't load this user"
        description={error}
        action={<Button onClick={reload}>Try again</Button>}
      />
    )
  }
  if (!data) return <PageState title={loading ? 'Loading…' : 'User not found'} />

  const suspended = data.profile.status === 'suspended'

  return (
    <>
      <DetailHeader profile={data.profile} onChangePlan={changePlan.onOpen} onToggleSuspend={status.onOpen} />
      <ProfileCard profile={data.profile} />

      <div className="flex flex-col items-start gap-4 min-[1201px]:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          <TrackingSummaryCard data={data.tracking} />
          {data.engine && <EngineStatusCard engine={data.engine} cycles={data.cycles} onViewLog={() => engine.ask(userId)} />}
          <DailyLogsCard onOpen={() => logs.ask(userId)} />
          <MedicationsCard data={data.medications} onOpen={medication.ask} />
          <DoctorsCard data={data.doctors} onOpen={doctor.openWith} />
          <ActivityCard data={data.activity} />
        </div>
        <div className="flex w-full flex-none flex-col gap-4 min-[1201px]:w-95">
          <SubscriptionCard data={data.subscription} />
          <ClinicsCard data={data.clinics} onOpen={() => clinics.openWith(userId)} />
          <DevicesCard data={data.devices} />
          <PrivacyCard data={data.privacy} onUnmask={() => engine.ask(userId)} />
        </div>
      </div>

      <ReasonDialog
        {...engine.dialog}
        icon={<ProhibitInset size={20} />}
        title="Unmask health data"
        description="Health data is masked by default. Opening it is logged with your name and this reason, and reviewed weekly."
        confirmLabel="Unmask & open"
      />
      <ReasonDialog
        {...logs.dialog}
        icon={<ProhibitInset size={20} />}
        title="Unmask daily logs"
        description="Daily logs are health data. Opening them is logged with your name and this reason, and reviewed weekly."
        confirmLabel="Unmask & open"
      />
      <ReasonDialog
        {...medication.dialog}
        icon={<ProhibitInset size={20} />}
        title="Unmask medication details"
        description="Medication data is health data. Opening it is logged with your name and this reason."
        confirmLabel="Unmask & open"
      />
      <EngineLogModal data={engine.data} onClose={engine.closeModal} />
      <DailyLogsModal data={logs.data} onClose={logs.closeModal} />
      <MedicationModal data={medication.data} onClose={medication.closeModal} />
      <DoctorCareModal data={doctor.data} loading={doctor.loading} error={doctor.error} onClose={doctor.close} />
      <ClinicJourneyModal data={clinics.data} loading={clinics.loading} error={clinics.error} onClose={clinics.close} />
      <ChangePlanModal
        open={changePlan.open}
        onClose={changePlan.onClose}
        userId={userId}
        userName={data.profile.name}
        userRef={data.profile.ref}
        onChanged={() => {
          toast({ title: 'Plan updated', description: 'The change was logged and the user will be notified.' })
          reload()
        }}
      />
      <ReasonDialog
        open={status.open}
        onClose={status.onClose}
        icon={<ProhibitInset size={20} />}
        title={suspended ? `Reactivate ${data.profile.name}` : `Suspend ${data.profile.name}`}
        description={suspended ? 'The user can sign in to the app again.' : 'The user will not be able to sign in to the app.'}
        confirmLabel={suspended ? 'Reactivate' : 'Suspend'}
        tone={suspended ? 'primary' : 'danger'}
        onConfirm={async (reason) => {
          await setUsersStatus([userId], suspended ? 'active' : 'suspended', reason)
          toast({ title: suspended ? 'User reactivated' : 'User suspended' })
          reload()
        }}
      />
    </>
  )
}
