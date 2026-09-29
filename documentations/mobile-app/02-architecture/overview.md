# Arsitektur — gambaran umum

## Lapisan

```
┌─────────────────────────────────────────────────────────────┐
│ src/app/            Route (Expo Router). Tipis: hanya       │
│                     merender komponen layar dari sebuah     │
│                     feature.                                │
├─────────────────────────────────────────────────────────────┤
│ features/<x>/components/   Layar & bagian UI fitur          │
│ features/<x>/hooks/        Memuat data, state, aksi         │
│ features/<x>/api/          Kontrak API + dummy + http       │
│ features/<x>/types.ts      Bentuk data (kontrak dengan BE)  │
├─────────────────────────────────────────────────────────────┤
│ src/components/     Komponen UI global (dipakai banyak fitur)│
│ src/constants/      Design token (theme.ts)                 │
│ src/utils/          Util lintas fitur (http, kalender, dll.)│
└─────────────────────────────────────────────────────────────┘
```

Alur data pada satu layar:

```
Route ──► Screen component ──► useXxx() hook ──► xxxApi (dummy | http)
                 │                    │
                 └── komponen UI ◄────┘  (state, optimistic update, refetch)
```

## Keputusan desain penting

| Keputusan | Alasan |
|---|---|
| **Feature module mandiri** | Mudah dicari, dikerjakan paralel, dan dihapus tanpa efek samping |
| **Route tipis** | Logika ada di feature, route hanya menghubungkan URL ke komponen |
| **Lapisan API per fitur dengan interface** | UI tidak tahu sumber data; ganti dummy → HTTP dengan satu flag |
| **Data bertipe dari backend (`types.ts`)** | Kontrak eksplisit; backend tinggal mengikuti bentuk ini |
| **Konten digerakkan data (JSON)** | Teks/opsi bisa diubah backend tanpa rilis app (onboarding, opsi log, dll.) |
| **Design token terpusat** | Konsistensi visual dan perubahan tema di satu tempat |
| **Tanpa state manager global** | Cukup hook lokal + dua Context (Onboarding, Logging). Lihat [state-management.md](./state-management.md) |

## Dua Context di aplikasi

| Context | Dipasang di | Fungsi |
|---|---|---|
| `OnboardingProvider` | `app/onboarding/_layout.tsx` | Jawaban form, validasi, hasil prediksi, submit |
| `LoggingProvider` | `app/(app)/_layout.tsx` | Data log hari ini, sheet aktif, penanda tracker yang sudah dicatat |

`LoggingProvider` juga merender `LogSheetHost` (satu bottom sheet untuk semua log) sehingga sheet bisa dibuka dari Home, tab Add, maupun layar lain di dalam grup `(app)`.

## Aturan ketergantungan

- `features/*` boleh memakai `src/components`, `src/constants`, `src/utils`, dan `src/config`.
- `src/components` **tidak boleh** mengimpor dari `features/*`.
- Antar-fitur diminimalkan. Pengecualian yang ada saat ini (semua karena dummy saling terhubung atau berbagi util kecil):
  - Dummy Settings membaca dummy tracking-mode, treatment, connected-devices, privacy-security.
  - Dummy Home membaca dummy check-in.
  - Layar New note memakai util tanggal dari `features/calendar/utils/dates`.
  - Settings memakai `signOut` dari `features/auth`.

Detail struktur folder: [folder-structure.md](./folder-structure.md). Peta route: [routing-and-navigation.md](./routing-and-navigation.md).
