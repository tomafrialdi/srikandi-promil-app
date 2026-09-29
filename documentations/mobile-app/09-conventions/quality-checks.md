# Pengecekan kualitas

Belum ada test otomatis (`npm test` di root hanya placeholder). Pengecekan yang tersedia: TypeScript, ESLint, dan diagnosa Expo. Jalankan dari `apps/mobile`. Sebelum menganggap pekerjaan selesai, jalankan minimal dua yang pertama.

| Perintah | Fungsi | Kapan |
|---|---|---|
| `npx tsc --noEmit` | Typecheck (termasuk typed routes) | Setiap perubahan |
| `npx expo lint` | ESLint dengan `eslint-config-expo` (termasuk aturan React Compiler) | Setiap perubahan |
| `npx expo-doctor` | Diagnosa dependensi dan konfigurasi | Setelah mengubah paket / `app.json` |
| `npx expo install --check` | Daftar paket yang versinya tidak cocok SDK | Setelah mengubah paket |
| `npx expo install --fix` | Perbaiki versi yang tidak cocok | Bila yang di atas melapor |

## Status saat dokumen ini ditulis

- `npx expo lint`: lolos tanpa temuan.
- `npx tsc --noEmit`: **tidak ada error di `src/`**, tetapi perintah tetap melaporkan error dari folder `example/` (sisa template Expo yang di-ignore git; ia terbawa karena `tsconfig.json` memakai `include: ["**/*.ts", "**/*.tsx"]`).

Untuk melihat hanya error yang relevan:

```bash
npx tsc --noEmit | grep -v '^example/'
```

Menyingkirkan noise itu secara permanen: hapus folder `example/` atau tambahkan `"exclude": ["example"]` di `tsconfig.json`. Sampai itu dilakukan, "tsc bersih" berarti "tidak ada baris di luar `example/`".

## Typed routes

Tipe route dibuat otomatis dari isi `src/app` ke `.expo/types` (folder ini di-ignore git, dan ikut di `include` pada `tsconfig.json`). Bila `tsc` mengeluh route tidak dikenal padahal filenya ada, jalankan `npx expo start` sebentar agar tipenya dibuat ulang, lalu ulangi `tsc`.

## Aturan lint yang sering menegur

| Pesan / gejala | Penyebab | Perbaikan |
|---|---|---|
| Aturan React Compiler soal `setState` di effect | `setState` sinkron di dalam `useEffect` | Pola "state saat render" ([state-management.md](../02-architecture/state-management.md#6-pola-state-saat-render-bukan-efek)) |
| Aturan React Compiler soal mutasi / `.value` | Mengubah shared value atau objek langsung | `.get()` / `.set()`; salin objek |
| `react-hooks/exhaustive-deps` | Dependensi efek tidak lengkap | Lengkapi dependensi atau bungkus dengan `useCallback` |

## Uji manual sebelum merge

Tidak ada test otomatis, jadi jalankan app dan lewati alur yang tersentuh:

1. Alur utama: Splash → Onboarding (3 langkah) → Loading → Result → Sign up → OTP `123456` → Home.
2. Log in dengan kredensial uji ([dummy-data-and-credentials.md](../01-getting-started/dummy-data-and-credentials.md)); Log out kembali ke splash.
3. Semua tab; tombol **+** membuka New note; sheet log dari Home.
4. Layar yang diubah, termasuk keadaan kosong / memuat / pencarian tanpa hasil.
5. iOS dan Android bila perubahan menyentuh layout, keyboard, safe area, atau modul native.

## Ide peningkatan

- Tambahkan skrip `typecheck` dan `lint` di `apps/mobile/package.json` (saat ini hanya `lint`).
- Uji unit untuk fungsi murni yang punya logika: `calculateResult` (onboarding), `group-notifications`, `relative-time`, `units`, `validation`.
- CI (GitHub Actions) menjalankan `tsc` dan `lint` pada setiap PR.
