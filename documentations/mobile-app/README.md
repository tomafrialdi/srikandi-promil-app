# Srikandi Promil — Dokumentasi Development (Mobile)

Dokumentasi untuk aplikasi mobile di `apps/mobile` (Expo / React Native). Aplikasi ini adalah pendamping program hamil (fertility & cycle tracking): onboarding, pencatatan harian, kalender siklus, insight, artikel, komunitas anonim, pencarian dokter, dan pengaturan.

> **Status saat ini:** seluruh UI dari desain Pencil sudah di-slicing. **Backend belum ada** — semua data berasal dari *dummy* yang bisa diganti backend asli tanpa mengubah UI (lihat [`05-api`](./05-api/overview.md)).

## Ringkasan teknis

| Hal | Nilai |
|---|---|
| Framework | Expo SDK 57, React Native 0.86, React 19.2 |
| Bahasa | TypeScript (strict) |
| Routing | Expo Router 57 (file-based, typed routes) |
| Animasi | `react-native-reanimated` 4 + `react-native-worklets` |
| Ikon | `phosphor-react-native` |
| Font | Plus Jakarta Sans (`@expo-google-fonts/plus-jakarta-sans`) |
| Optimasi | React Compiler aktif (`experiments.reactCompiler`) |
| Build | Development build (`expo-dev-client`), rilis lewat EAS Build |
| Backend (rencana) | Supabase (`@supabase/supabase-js` terpasang, belum dipakai) |

## Daftar isi

| Direktori | Isi | Mulai dari |
|---|---|---|
| [`01-getting-started`](./01-getting-started) | Setup, menjalankan app, data & kredensial dummy | [setup.md](./01-getting-started/setup.md) |
| [`02-architecture`](./02-architecture) | Arsitektur, struktur folder, routing, state | [overview.md](./02-architecture/overview.md) |
| [`03-design-system`](./03-design-system) | Token warna, tipografi, ikon, pola UI, peta desain ↔ kode | [overview.md](./03-design-system/overview.md) |
| [`04-components`](./04-components) | Katalog komponen global (props & contoh pakai) | [README.md](./04-components/README.md) |
| [`05-api`](./05-api) | Pola lapisan API, semua endpoint, integrasi backend, auth | [overview.md](./05-api/overview.md) |
| [`06-features`](./06-features) | Penjelasan tiap fitur (layar, data, alur) | [README.md](./06-features/README.md) |
| [`07-build-and-release`](./07-build-and-release) | EAS build, APK, konfigurasi app, checklist rilis | [eas-build.md](./07-build-and-release/eas-build.md) |
| [`08-guides`](./08-guides) | Panduan langkah demi langkah (tambah layar, endpoint, tab, dll.) | [add-a-screen.md](./08-guides/add-a-screen.md) |
| [`09-conventions`](./09-conventions) | Gaya kode, pengecekan kualitas, keterbatasan & TODO | [code-style.md](./09-conventions/code-style.md) |

## Prinsip utama proyek

1. **Modular per fitur.** Setiap fitur adalah folder mandiri di `src/features/<nama>` (layar, hook, API, tipe). Route di `src/app` hanya "kulit tipis".
2. **UI digerakkan data.** Isi layar (opsi, teks, daftar) datang dari objek/JSON bertipe, sehingga backend bisa mengaturnya.
3. **Satu saklar dummy ↔ backend.** Tiap fitur punya lapisan API dengan implementasi dummy dan HTTP; ganti dengan satu flag.
4. **Design token, bukan angka mentah.** Warna, font, dan radius diambil dari `src/constants/theme.ts`.
5. **Komponen dipakai ulang.** Komponen yang dipakai lebih dari satu fitur dipindah ke `src/components`.

## Cara membaca dokumentasi ini

- Baru bergabung? Baca `01-getting-started` → `02-architecture` → `06-features`.
- Mau menambah sesuatu? Langsung ke [`08-guides`](./08-guides).
- Mau menyambungkan backend? Baca [`05-api`](./05-api/overview.md), terutama [switching-to-real-backend.md](./05-api/switching-to-real-backend.md).
- Mau membuat UI baru? Mulai dari [`03-design-system`](./03-design-system/overview.md) lalu cek [`04-components`](./04-components/README.md) sebelum membuat komponen baru.

> Catatan: file kosong `docs.md` di direktori ini adalah sisa placeholder lama dan bisa dihapus.
