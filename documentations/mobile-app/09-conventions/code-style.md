# Gaya kode

Ringkasan kebiasaan yang sudah dipakai di seluruh `src/`. Saat menambah kode, tiru file di sekitarnya.

## Bahasa

- **Kode, komentar, nama, dan teks UI: bahasa Inggris.** Teks UI dikumpulkan di `content.ts` bila banyak (`AUTH_COPY`, `LOG_COPY`).
- **Dokumentasi (`documentations/`): bahasa Indonesia.**

## TypeScript

- `strict: true`. Hindari `any`; tipe data yang melintasi batas (API, JSON dummy) ada di `types.ts`.
- Impor lintas folder dengan alias `@/` (→ `src/`); impor dalam satu fitur boleh relatif (`../types`).
- JSON dummy yang tipenya tidak bisa disimpulkan di-*cast* eksplisit (`localConfig as OnboardingConfig`).
- Union string untuk key dan id yang dikirim ke backend (`ShareKey`, `LogKind`, `Tone`).

## Penamaan dan berkas

| Hal | Aturan | Contoh |
|---|---|---|
| Berkas & folder | `kebab-case` | `notification-item.tsx`, `use-partner.ts` |
| Komponen | `PascalCase`, **named export** | `export function ListRow` |
| Route (`src/app`) | **default export**, nama berakhiran `Route` | `export default function InsightsRoute` |
| Hook | `useXxx` di `hooks/use-xxx.ts` | `useNotifications` |
| API | `xxxApi`, `dummyXxxApi`, `httpXxxApi` | `articlesApi` |
| Flag | `USE_DUMMY_XXX` | `USE_DUMMY_ARTICLES` |
| Tipe props | `interface XxxProps` di atas komponen | `interface ListRowProps` |
| Konstanta modul | `UPPER_SNAKE` | `TAB_CONFIG`, `SETTINGS_SECTIONS` |

Satu komponen utama per berkas; komponen pembantu kecil boleh di berkas yang sama bila tidak dipakai di tempat lain.

## Komponen dan gaya

- Fungsi komponen, bukan class. Props lewat parameter yang di-destructure dengan default di tempat.
- Gaya dengan `StyleSheet.create` di **bagian bawah** berkas; gaya bergantung state digabung lewat array (`[styles.a, cond && styles.b]`).
- **Token, bukan angka mentah:** warna `colors.*`, font `fonts.*`, radius `radius.*`, pasangan tone `tones.*` ([03-design-system](../03-design-system/overview.md)).
- **Font lewat `fontFamily`**, tidak dengan `fontWeight`.
- Jarak antar anak pakai `gap`.
- Ikon dari `phosphor-react-native`; komponen menerima ikon sebagai prop bertipe `Icon`.
- Elemen interaktif: `Pressable` dengan `accessibilityRole` (dan `accessibilityLabel` bila tanpa teks).
- Komponen yang dipakai lebih dari satu fitur dipindah ke `src/components`; sisanya tetap di fiturnya.

## Komentar

- Komentar menjelaskan **kenapa**, bukan apa. Komponen dan prop publik diberi JSDoc satu baris (`/** ... */`), seperti di `src/components`.
- Pekerjaan yang tertunda ditandai:
  - `TODO(backend): ...` untuk hal yang menunggu backend.
  - `TODO: ...` untuk fitur / desain / modul native yang belum ada.
  Semuanya dirangkum di [known-limitations-and-todos.md](./known-limitations-and-todos.md); perbarui daftar itu bila menambah atau menyelesaikan TODO.

## React Compiler

`experiments.reactCompiler` aktif, sehingga:

- Jangan menulis `useMemo` / `useCallback` hanya demi performa; compiler memoize otomatis. `useCallback` masih dipakai untuk fungsi yang menjadi dependensi efek.
- **Jangan panggil `setState` sinkron di dalam `useEffect`.** Untuk mereset state saat prop berubah, pakai pola "sesuaikan state saat render" ([state-management.md](../02-architecture/state-management.md#6-pola-state-saat-render-bukan-efek)).
- Shared value Reanimated: `.get()` / `.set()`, bukan `.value` ([state-management.md](../02-architecture/state-management.md#7-shared-value-reanimated)).
- Jangan mengubah objek/array state secara langsung; selalu buat salinan baru.

## Data dan efek

- Layar tidak memanggil `fetch` atau membaca JSON dummy langsung; hanya lewat hook → `xxxApi`.
- Efek pemuatan data memakai flag `cancelled` agar tidak mengubah state setelah layar dilepas.
- Perubahan toggle: optimistic update + rollback.
- Pencarian ter-*debounce* 250 ms dan difilter di server.

## Perintah git dan commit

- Pesan commit singkat dalam bahasa Inggris, bentuk perintah (`update stickyscreen`, `add partner screen`).
- Jangan meng-commit `ios/`, `android/`, `.env*` (sudah di-ignore), maupun kunci penandatanganan (`*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision`).
