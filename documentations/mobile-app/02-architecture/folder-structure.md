# Struktur folder

Semua kode aplikasi ada di `apps/mobile/src`. Path alias `@/*` → `src/*` (lihat `tsconfig.json`).

```
apps/mobile
├─ app.json                 Konfigurasi Expo (nama, ikon, splash, plugin, package id)
├─ eas.json                 Profil build EAS (development / preview / production)
├─ assets/                  Gambar (ikon app, splash, dll.)
├─ ios/                     (di-generate, di-ignore git)  ← jangan diedit
└─ src/
   ├─ app/                  ROUTE (Expo Router)
   │  ├─ _layout.tsx        Root: load font, splash, Stack
   │  ├─ index.tsx          Splash / landing
   │  ├─ login.tsx
   │  ├─ onboarding/        Wizard onboarding + loading, result, sign-up, verify-email
   │  ├─ (app)/             Grup area setelah login (menyediakan LoggingProvider)
   │  │  ├─ _layout.tsx
   │  │  ├─ new-note.tsx    Modal "New note" (tombol Add)
   │  │  └─ (tabs)/         Tab: home, calendar, add, insights, account
   │  ├─ articles/ community/ specialists/ settings/ notifications.tsx check-in.tsx
   │
   ├─ components/           KOMPONEN GLOBAL (lihat 04-components)
   │  ├─ form/ list/ charts/ tab-bar/
   │
   ├─ config/api.ts         Flag USE_DUMMY_API (untuk fitur-fitur baru)
   ├─ constants/theme.ts    DESIGN TOKEN: colors, fonts, radius, tones
   ├─ utils/                calendar, http, initials, validation, navigation, external-links
   │
   └─ features/             FITUR (satu folder per fitur)
      ├─ onboarding/  auth/  home/  logging/  check-in/  notifications/
      ├─ calendar/  insights/  community/  specialists/  articles/
      └─ settings/  tracking-mode/  treatment/  partner/
         doctor-report/  connected-devices/  privacy-security/
```

## Isi tiap folder `features/<nama>`

| Sub-folder / file | Isi |
|---|---|
| `types.ts` | Tipe data yang dikirim/diterima backend + tipe UI |
| `api/` | `xxx-api.ts` (interface + saklar), `dummy-xxx-api.ts`, `http-xxx-api.ts`, opsional `config.ts` & data JSON dummy |
| `hooks/` | `use-xxx.ts`: memuat data, state, aksi (optimistic update, refetch) |
| `components/` | Layar (`xxx-screen.tsx`) dan bagian-bagiannya; sub-folder untuk grup (`sheets/`, `detail/`, `fields/`) |
| `utils/` | Fungsi murni khusus fitur (format, hitung, validasi) |
| `icons.ts` | Registry nama ikon (string di data) → komponen Phosphor |
| `data/*.json` | Konten dummy / konfigurasi (Home, Onboarding, Logging) |
| `content.ts` | Teks statis UI yang dikumpulkan di satu tempat (auth, logging) |

Tidak semua fitur punya semua sub-folder; buat hanya yang dibutuhkan. Fitur **home**, **onboarding**, dan **auth** memakai `services/` (bukan `api/`) karena lebih dulu dibuat: lihat [05-api/overview.md](../05-api/overview.md#pengecualian).

## Konvensi penamaan

| Jenis | Aturan | Contoh |
|---|---|---|
| File & folder | `kebab-case` | `cycle-hero-card.tsx`, `check-in/` |
| Komponen | `PascalCase`, named export | `export function CycleHeroCard` |
| Hook | `useXxx` di file `use-xxx.ts` | `use-notifications.ts` |
| Route | Sesuai URL; grup dalam kurung | `(tabs)`, `[id].tsx` |
| Tipe data backend | `PascalCase` di `types.ts` | `SpecialistDetail` |

Route memakai **default export** (syarat Expo Router); komponen lain memakai **named export**.
