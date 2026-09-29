# Routing & navigasi

Routing memakai **Expo Router** (file-based) dengan *typed routes* (`experiments.typedRoutes`). Tipe route dibuat otomatis, jadi `router.push("/nama-route")` yang salah akan gagal saat `tsc`.

## Hierarki layout

```
app/_layout.tsx                    Root: load font + tahan splash native; Stack
├─ index.tsx                       Splash / landing
├─ login.tsx
├─ onboarding/_layout.tsx          Memuat config onboarding, memasang OnboardingProvider; Stack
│  ├─ index.tsx                    Wizard 3 langkah (slide horizontal)
│  ├─ loading.tsx                  Analisis jawaban
│  ├─ result.tsx                   Hasil prediksi
│  ├─ sign-up.tsx
│  └─ verify-email.tsx
├─ (app)/_layout.tsx               LoggingProvider + LogSheetHost; Stack
│  ├─ (tabs)/_layout.tsx           Tab bar kustom
│  │  ├─ home.tsx  calendar.tsx  add.tsx (placeholder)  insights.tsx  account.tsx
│  └─ new-note.tsx                 Modal (presentation: "modal")
├─ notifications.tsx  check-in.tsx
├─ community/index.tsx
├─ articles/index.tsx  articles/[id].tsx
├─ specialists/index.tsx  specialists/[id].tsx
└─ settings/tracking-mode|treatment|partner|doctor-report|connected-devices|privacy-security.tsx
```

Nama dalam kurung `(app)` / `(tabs)` adalah **grup**: tidak muncul di URL. `/home` tetap `/home`.

## Peta route

| URL | Layar | Dibuka dari |
|---|---|---|
| `/` | Splash | Awal app; Log out |
| `/login` | Log in | Splash (link "Log in"), Sign up |
| `/onboarding` | Wizard onboarding | Splash ("Create account"), Log in ("Create account") |
| `/onboarding/loading` | Loading analisis | Submit langkah 3 |
| `/onboarding/result` | Hasil prediksi | Tombol "See my results" |
| `/onboarding/sign-up` | Sign up | Tombol "Save my results" |
| `/onboarding/verify-email?email=` | Verifikasi OTP | Sign up berhasil |
| `/home` | Home | Login / verifikasi berhasil |
| `/calendar`, `/insights`, `/account` | Tab | Tab bar |
| `/new-note` | Modal New note | Tombol **Add** di tab bar |
| `/check-in?mood=` | Daily check-in | Emoji di kartu check-in Home |
| `/notifications` | Notifikasi | Lonceng di header Home |
| `/community` | Komunitas | Kartu Community di Home |
| `/articles`, `/articles/[id]` | Daftar & detail artikel | "View all" / kartu artikel di Home |
| `/specialists`, `/specialists/[id]` | Cari dokter & detail klinik | Kartu "Consult an OB-GYN" di Home |
| `/settings/*` | Halaman turunan Settings | Baris di tab Account |

Sheet (bukan route): sheet Log (Temperature, Mood, dll.), Personal information, Cycle preferences, Units, Help center, Privacy policy, Rate the app.

## Alur utama

```
Splash ─► Onboarding (3 langkah) ─► Loading ─► Result ─► Sign up ─► Verify email ─► Home
   └────────────────────────────► Log in ──────────────────────────────────────────► Home
```

Log out: `router.dismissTo("/")` kembali ke splash.

## Helper & perilaku navigasi

| Hal | Implementasi |
|---|---|
| Masuk ke area login | `goToHome()` di `src/utils/navigation.ts` → `router.replace("/home")` |
| Cegah kembali ke splash dari Home | Root: `(app)` memakai `gestureEnabled: false`; di `(tabs)/_layout.tsx` tombol back Android memanggil `BackHandler.exitApp()` |
| Wizard onboarding | Satu route; perpindahan langkah adalah animasi internal (bukan route). Back di langkah 1 → `router.back()` ke splash |
| Loading & Result | `gestureEnabled: false` agar tidak bisa di-swipe kembali; back Android diblokir di Loading |
| Tab **Add** | Bukan navigasi tab: `AppTabBar` memanggil `router.push("/new-note")` (aksi) |
| Parameter | `useLocalSearchParams` (mis. `mood` untuk check-in, `id` untuk detail) |

## Menambah route baru

Lihat [add-a-screen.md](../08-guides/add-a-screen.md).
