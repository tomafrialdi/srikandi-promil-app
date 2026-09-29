# Daftar endpoint

Sumber kebenaran adalah komentar di atas interface pada `features/<fitur>/api/<fitur>-api.ts`. Tipe request/respons ada di `features/<fitur>/types.ts`. Dokumen ini hanya ringkasan; bila berbeda, kodenya yang benar.

Semua path relatif terhadap `EXPO_PUBLIC_API_URL`. `204` berarti tanpa isi.

## Articles — `articlesApi`

| Method & path | Body / query | Respons |
|---|---|---|
| `GET /articles` | `q`, `category` (`id` atau `all`) | `ArticleListResponse` |
| `GET /articles/:id` | – | `ArticleDetail` |
| `PUT /articles/:id/bookmark` | – | `204` |
| `DELETE /articles/:id/bookmark` | – | `204` |

## Calendar — `calendarApi`

| Method & path | Query | Respons |
|---|---|---|
| `GET /calendar` | `month=YYYY-MM` | `CalendarMonth` (prediksi + ringkasan catatan bulan itu) |

## Check-in — `checkInApi`

| Method & path | Body | Respons |
|---|---|---|
| `GET /check-in/today` | – | `CheckInData` |
| `POST /check-in` | `CheckInInput` | `204` (simpan/perbarui check-in hari ini) |

Kartu check-in di Home membaca `checkIn.selectedMoodId` dan `streakDays` dari `GET /home`.

## Community — `communityApi`

| Method & path | Query | Respons |
|---|---|---|
| `GET /community/feed` | `group` (opsional; kosong = grup pertama pengguna) | `CommunityFeed` |
| `PUT /community/posts/:id/hug` | – | `204` |
| `DELETE /community/posts/:id/hug` | – | `204` |

## Connected devices — `devicesApi`

| Method & path | Body | Respons |
|---|---|---|
| `GET /devices` | – | `DevicesData` |
| `POST /devices/:id/connect` | – | `204` (pairing / OAuth ditangani backend atau OS) |
| `PATCH /devices/preferences` | `{ key, enabled }` | `204` |

## Doctor report — `reportApi`

| Method & path | Body / query | Respons |
|---|---|---|
| `GET /report` | `range` = `last-3` \| `last-6` \| `all` | `ReportData` |
| `POST /report/export` | `ReportRequest` | `{ url }` (tautan unduhan PDF) |
| `POST /report/send` | `ReportRequest` | `204` (kirim email ke klinik pengguna) |

## Insights — `insightsApi`

| Method & path | Query | Respons |
|---|---|---|
| `GET /insights` | `months=6` | `InsightsData` |

## Logging — `loggingApi`

| Method & path | Body | Respons |
|---|---|---|
| `GET /logs/today` | – | `LoggingData` (opsi, status hari ini, obat, waktu, dst.) |
| `POST /logs` | `SaveLogInput` (dibedakan oleh field `kind`) | `204` |

## Notifications — `notificationsApi`

| Method & path | Respons |
|---|---|
| `GET /notifications` | `{ data: NotificationDto[] }`, terbaru dulu |
| `POST /notifications/:id/read` | `204` |
| `POST /notifications/read-all` | `204` |
| `GET /notification-settings` | `NotificationSettingsDto` |

DTO diubah ke model UI lewat `api/mappers.ts`.

## Partner — `partnerApi`

| Method & path | Body | Respons |
|---|---|---|
| `GET /partner` | – | `PartnerData` |
| `PATCH /partner/sharing` | `{ key, enabled }` | `204` |
| `POST /partner/tips` | – | `204` (kirim tips ke pasangan) |

## Privacy & security — `privacyApi`

| Method & path | Body | Respons |
|---|---|---|
| `GET /privacy` | – | `PrivacySettings` |
| `PATCH /privacy` | `{ key, enabled }` | `204` |
| `POST /account/data-export` | – | `204` (tautan unduhan dikirim lewat email) |
| `DELETE /account/data` | – | `204` (menghapus permanen data akun) |

## Settings — `settingsApi`

| Method & path | Body / query | Respons |
|---|---|---|
| `GET /settings/summary` | – | `SettingsSummary` (nilai di sisi kanan baris menu) |
| `PATCH /settings/notifications` | `{ key, enabled }` | `204` |
| `PATCH /profile` | `Profile` | `204` |
| `PATCH /settings/cycle` | `CyclePreferences` | `204` |
| `PATCH /settings/units` | `UnitPreferences` | `204` |
| `GET /help/faqs` | `q` | `{ data: Faq[] }` |
| `GET /legal/privacy-policy` | – | `PrivacyPolicy` |
| `POST /feedback` | `FeedbackInput` | `204` |

## Specialists — `specialistsApi`

| Method & path | Query | Respons |
|---|---|---|
| `GET /specialists` | `q`, `filter` = `all` \| `ob-gyn` \| `fertility-clinic` \| `open-now` | `{ data: SpecialistSummary[] }`, terdekat dulu (server tahu lokasi pengguna) |
| `GET /specialists/:id` | – | `SpecialistDetail` |

## Tracking mode — `trackingModeApi`

| Method & path | Body | Respons |
|---|---|---|
| `GET /tracking-mode` | – | `TrackingModeData` |
| `PUT /tracking-mode` | `{ modeId }` | `204` |

## Treatment — `treatmentApi`

| Method & path | Body | Respons |
|---|---|---|
| `GET /treatment` | – | `TreatmentData` |
| `PATCH /treatment/schedule/:id` | `{ done }` | `204` |

## Fitur yang belum memakai pola API

Belum ada interface `xxxApi`; fungsi di `services/` masih dummy. Endpoint di bawah adalah **usulan** berdasarkan kebutuhan layar, bukan kontrak yang sudah ada di kode.

| Fitur | Fungsi saat ini | Usulan |
|---|---|---|
| Home | `fetchHomeDashboard()` | `GET /home` → `HomeDashboard` (`features/home/types.ts`) |
| Onboarding | `fetchOnboardingConfig()` | `GET /onboarding-config` → `OnboardingConfig` |
| Onboarding | `submitOnboarding(payload)` | `POST /onboarding` dengan `OnboardingPayload`; sebaiknya mengembalikan prediksi dari server (`TODO(backend)` di `onboarding-context.tsx`) |
| Auth | `signUp`, `signIn`, `signInWithProvider`, `verifyEmailCode`, `resendVerificationCode`, `signOut` | Lihat [auth.md](./auth.md) |

## Catatan untuk tim backend

- Endpoint `GET` yang mengembalikan data layar (`/home`, `/settings/summary`, `/tracking-mode`, …) sengaja **menggabungkan** banyak nilai agar layar cukup satu request.
- Nama `key` pada toggle adalah union string di `types.ts` masing-masing (mis. `PrivacyToggleKey`, `ShareKey`, `DevicePreferenceKey`, `NotificationToggleKey`). Nilainya harus sama persis.
- Ikon dan warna dikirim sebagai **nama** (mis. `"thermometer"`, tone `"warning"`); app yang memetakan ke komponen. Nama yang tidak dikenal memakai fallback, sehingga menambah nilai baru di backend tidak merusak app lama.
