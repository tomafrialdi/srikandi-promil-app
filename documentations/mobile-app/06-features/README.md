# Fitur

Satu folder per fitur di `src/features/<nama>`. Struktur folder dijelaskan di [feature-module-anatomy.md](../02-architecture/feature-module-anatomy.md); peta route lengkap di [routing-and-navigation.md](../02-architecture/routing-and-navigation.md).

## Ringkasan

| Fitur | Route | Hook / state | API | Flag dummy |
|---|---|---|---|---|
| [Auth](#auth) | `/login`, `/onboarding/sign-up`, `/onboarding/verify-email` | state lokal | `services/auth-api.ts` | `DUMMY_AUTH.enabled` |
| [Onboarding](#onboarding) | `/onboarding`, `/loading`, `/result` | `OnboardingProvider` | `services/onboarding-api.ts` | – (JSON lokal) |
| [Home](#home) | `/home` | `useHomeDashboard` | `services/home-api.ts` | – (JSON lokal) |
| [Logging](#logging-log-today--new-note) | sheet + `/new-note` | `LoggingProvider` | `loggingApi` | `USE_DUMMY_LOGGING` |
| [Check-in](#check-in) | `/check-in` | `useCheckIn` | `checkInApi` | `USE_DUMMY_API` |
| [Calendar](#calendar) | `/calendar` | `useCalendar` | `calendarApi` | `USE_DUMMY_CALENDAR` |
| [Insights](#insights) | `/insights` | `useInsights` | `insightsApi` | `USE_DUMMY_INSIGHTS` |
| [Notifications](#notifications) | `/notifications` | `useNotifications` | `notificationsApi` | `USE_DUMMY_NOTIFICATIONS` |
| [Community](#community) | `/community` | `useCommunity` | `communityApi` | `USE_DUMMY_COMMUNITY` |
| [Articles](#articles) | `/articles`, `/articles/[id]` | `useArticles`, `useArticleDetail` | `articlesApi` | `USE_DUMMY_ARTICLES` |
| [Specialists](#specialists) | `/specialists`, `/specialists/[id]` | `useSpecialists`, `useSpecialistDetail` | `specialistsApi` | `USE_DUMMY_SPECIALISTS` |
| [Settings](#settings) | `/account` (tab) + sheet | `useSettings` | `settingsApi` | `USE_DUMMY_SETTINGS` |
| [Tracking mode](#pengaturan-turunan) | `/settings/tracking-mode` | `useTrackingMode` | `trackingModeApi` | `USE_DUMMY_API` |
| [Treatment](#pengaturan-turunan) | `/settings/treatment` | `useTreatment` | `treatmentApi` | `USE_DUMMY_API` |
| [Partner](#pengaturan-turunan) | `/settings/partner` | `usePartner` | `partnerApi` | `USE_DUMMY_API` |
| [Doctor report](#pengaturan-turunan) | `/settings/doctor-report` | `useReport` | `reportApi` | `USE_DUMMY_API` |
| [Connected devices](#pengaturan-turunan) | `/settings/connected-devices` | `useDevices` | `devicesApi` | `USE_DUMMY_API` |
| [Privacy & security](#pengaturan-turunan) | `/settings/privacy-security` | `usePrivacy` | `privacyApi` | `USE_DUMMY_API` |

Endpoint tiap `xxxApi`: [05-api/endpoints.md](../05-api/endpoints.md).

---

## Auth

`features/auth`

- **Layar:** `LoginScreen`, `SignUpScreen`, `VerifyEmailScreen`; kerangka bersama `AuthScreen`, `ScreenTitle`, `OtpInput`, `PasswordStrengthMeter`.
- **Teks:** semua kalimat UI di `content.ts` (`AUTH_COPY`).
- **Validasi:** `utils/validation.ts` (format email, kekuatan password). Sign up: email valid, password ≥ 8 karakter, dua persetujuan dicentang.
- **OTP:** `OtpInput` + `useCountdown` (hitung mundur sebelum "Resend").
- **Alur:** Log in → `goToHome()`. Sign up → Verify email → Home.
- **Status:** dummy. Detail dan rencana: [05-api/auth.md](../05-api/auth.md).

## Onboarding

`features/onboarding` — wizard 3 langkah yang **digerakkan JSON** (`data/onboarding-steps.json`, tipe `OnboardingConfig`).

| Langkah | `id` | Isi |
|---|---|---|
| 1 | `basics` | Nama, tanggal lahir, dst. |
| 2 | `cycle` | Tanggal haid terakhir, panjang siklus, pilihan |
| 3 | `journey` | Pilihan tunggal & ganda tentang perjalanan program hamil |

Selain `steps`, JSON berisi `version`, `loading` (daftar tugas analisis), dan `result` (teks layar hasil).

- **Field renderer:** `FieldRenderer` memilih komponen dari tipe field: `input-field`, `date-field`, `number-field`, `single-choice-field`, `multi-choice-field` (di `components/fields/`). Menambah pertanyaan cukup mengubah JSON.
- **State:** `OnboardingProvider` (dipasang di `app/onboarding/_layout.tsx` setelah `fetchOnboardingConfig()` selesai): jawaban, error per field, validasi per langkah, `submit()`.
- **Validasi:** `utils/validate.ts`. **Payload:** `utils/payload.ts` (`buildPayload`). **Tanggal:** `utils/date.ts` (input bertopeng).
- **Loading:** `useAnalysisProgress` menjalankan progres berbasis timer (`TODO(backend)`: ganti dengan status analisis sungguhan).
- **Hasil:** `calculateResult()` (`utils/result.ts`) memperkirakan lokal: ovulasi ≈ panjang siklus − 14 hari sejak haid terakhir; jendela subur = 5 hari sebelum sampai 1 hari sesudah ovulasi; siklus digulirkan maju bila haid terakhir sudah lama. `TODO(backend)`: ganti dengan prediksi server.
- **Navigasi:** loading & result tidak bisa di-swipe kembali.

## Home

`features/home` — layar tab pertama. Data satu objek `HomeDashboard` (`data/home-dashboard.json`; kunci: `user`, `hasUnreadNotifications`, `cycle`, `quickActions`, `checkIn`, `recommendations`, `tip`, `library`, `notes`, `community`).

| Bagian | Komponen |
|---|---|
| Sapaan + lonceng notifikasi | `GreetingHeader` (`utils/greeting.ts`) |
| Hero siklus | `CycleHeroCard` |
| Aksi cepat (Temp, Mood, Symptom, Meds, …) | `QuickActionsGrid` → membuka sheet log (`QUICK_ACTION_TO_KIND` di `logging/log-kinds.ts`) |
| Check-in harian | `DailyCheckinCard` → `/check-in?mood=` |
| Rekomendasi | `RecommendationsSection` (suplemen membuka sheet Supplement) |
| Tips harian | `DailyTipCard` |
| Pustaka konten | `ContentLibrarySection` → `/articles` |
| Catatan terbaru | `RecentNotesSection` |
| Komunitas | `CommunityCard` → `/community` |

`useHomeDashboard` memuat ulang saat layar fokus kembali (`useFocusEffect`) agar kartu check-in ikut berubah. Ikon dari JSON dipetakan lewat `icons.ts`. Kartu check-in mengambil statusnya dari fitur check-in.

## Logging (Log today & New note)

`features/logging` — pencatatan harian lewat **bottom sheet**. Provider dipasang di `app/(app)/_layout.tsx` bersama `LogSheetHost`, jadi sheet bisa dibuka dari layar mana pun di area login.

- **`LogKind`:** `log-today` (hub), delapan tracker (`temperature`, `mood`, `symptom`, `medications`, `cervical-fluid`, `lh-test`, `intimacy`, `pregnancy-test`), dua suplemen (`prenatal-vitamin`, `folic-acid`), dan `basal-temperature-guide`.
- **`LogSheetHost`:** memilih sheet berdasarkan `kind` (`components/sheets/*`). Konten bersama di `components/parts/` (`MoodPicker`, `SymptomPills`, `ValueStepper`, `LhStripPreview`, `SheetContent`).
- **Hub:** `log-today-sheet.tsx` menampilkan grid `TRACKER_TILES` (`log-kinds.ts`) dengan centang untuk yang sudah dicatat.
- **New note:** `/new-note` (modal, tombol **+** di tab bar) untuk menulis catatan dengan tanggal pilihan. Tanggal selain hari ini tidak mengubah `logged`/`entries`.
- **State:** `LoggingProvider` — `data`, `active`, `logged`, `entries`, `openLog`, `openFromHub`, `closeLog`, `save`, `saveNote` ([state-management.md](../02-architecture/state-management.md#5-context-yang-ada)).
- **Data & teks:** opsi dari `LoggingData` (`data/logging-data.json`); judul dan copy di `content.ts` (`LOG_COPY`).

## Check-in

`features/check-in` — `/check-in`. Pilih mood (`MoodScale`), pemicu stres, jurnal singkat; kartu `WeekMoodCard` menampilkan 7 hari terakhir; ada streak dan kartu konselor. Bisa dibuka dengan mood terpilih dari Home (`?mood=`). Menyimpan lewat `POST /check-in`.

## Calendar

`features/calendar` — tab Calendar. `MonthGrid` + `MonthNav` (pindah bulan), `CalendarLegend`, `DayDetailCard` untuk hari terpilih. Data per bulan (`getMonth("YYYY-MM")`): prediksi (haid, subur, ovulasi) dan ringkasan catatan. Helper tanggal: `utils/dates.ts` dan `src/utils/calendar.ts`. Dummy: siklus 28 hari berulang dengan hari ini = cycle day 14.

## Insights

`features/insights` — tab Insights. `CycleTrendCard` (memakai `BarChart`), `SymptomFrequencyCard`, `StatRow`, dan `InsightCard`. Rentang default 6 bulan.

## Notifications

`features/notifications` — `/notifications`. Daftar dikelompokkan Today / Yesterday / Earlier (`utils/group-notifications.ts`), bisa difilter (`FilterChips`), tandai terbaca satu atau semua (optimistic), `DiscreetBanner` (muncul bila mode diskret aktif; mengingatkan bahwa lock screen hanya menampilkan "Daily reminder").

- Ikon dan warna ditentukan `type` dari backend lewat `notification-types.ts`; tipe tak dikenal memakai `FALLBACK_TYPE_STYLE`.
- Contoh lengkap pola DTO → model UI (`api/mappers.ts`).
- `TODO`: membuka layar tujuan (`cta.route`), halaman pengaturan notifikasi.

## Community

`features/community` — `/community`. Umpan komunitas anonim: `AnonymousBanner`, `PostCard`, grup, dan aksi "hug" (`PUT`/`DELETE …/hug`, optimistic). Waktu relatif: `utils/relative-time.ts`.
`TODO`: cari posting/grup, buat posting baru, thread balasan, menu laporkan/sembunyikan.

## Articles

`features/articles` — `/articles` dan `/articles/[id]`. Daftar dengan `SearchField` ter-debounce (250 ms) dan filter kategori, `FeaturedArticleCard`, `ArticleRow`; detail memakai `ArticleBody` dan `ArticleByline`; bookmark optimistic. Pemformat: `utils/format.ts`.
`TODO`: layar artikel tersimpan; konfirmasi URL publik untuk fitur bagikan.

## Specialists

`features/specialists` — `/specialists` dan `/specialists/[id]`. Pencarian + filter (`all`, `ob-gyn`, `fertility-clinic`, `open-now`), `SpecialistCard`, dan `MapPreview` (**ilustrasi**, bukan peta nyata). Detail klinik: `DetailCover`, `DetailHeader`, `DoctorsList`, `CostList`, `BpjsCard` (info BPJS), `ReviewCard`.
`TODO`: peta nyata (`react-native-maps` / `expo-maps`), profil dokter, persistensi bookmark.

## Settings

`features/settings` — tab Account. Struktur menu di `menu.ts` (`SETTINGS_SECTIONS` dan `SETTINGS_SECTIONS_AFTER_NOTIFICATIONS`: ubah, urutkan, tambah baris di sana). `ProfileCard`, `MenuSection` (baris = `ListRow` dengan nilai dari `SettingsSummary`), toggle notifikasi, tombol Log out.

Sheet (bukan route), dikelola `settings-sheets.tsx`: **Personal information**, **Cycle preferences**, **Units** (`utils/units.ts` untuk konversi), **Help center** (FAQ ter-debounce), **Privacy policy**, **Rate the app**.
`TODO`: foto profil (`expo-image-picker`), chat dukungan, prompt ulasan store (`expo-store-review`).

## Pengaturan turunan

Halaman di bawah `/settings/*`, dibuka dari baris tab Account. Semuanya memakai `USE_DUMMY_API` dan pola optimistic untuk toggle.

| Fitur | Isi |
|---|---|
| **Tracking mode** | Memilih mode pelacakan (`PUT /tracking-mode`). Ikon di `icons.ts` |
| **Treatment** | Program dan jadwal pengobatan; centang item jadwal (`PATCH /treatment/schedule/:id`). Kartu `ProgramCard`. `TODO`: tambah protokol dan hasil lab |
| **Partner** | Kartu pasangan, toggle apa yang dibagikan, kirim tips. `TODO`: pengaturan partner (putuskan, undang ulang) |
| **Doctor report** | Pratinjau laporan (`ReportPreviewCard`, `BbtChart`), rentang 3/6 bulan atau semua, ekspor PDF, kirim ke klinik. `TODO`: buka/bagikan PDF, pilih klinik |
| **Connected devices** | Perangkat dan toggle preferensi sinkronisasi (`icons.ts`) |
| **Privacy & security** | `TrustCard`, `LockScreenPreview`, toggle privasi, ekspor & hapus data. `TODO`: biometrik, PIN, ganti ikon app |

## Fitur yang ditunda

- **Two-week wait** (fase menunggu hasil) dan layar terkait: menunggu backend.
- Daftar `TODO` lengkap dengan lokasi kode: [known-limitations-and-todos.md](../09-conventions/known-limitations-and-todos.md).
