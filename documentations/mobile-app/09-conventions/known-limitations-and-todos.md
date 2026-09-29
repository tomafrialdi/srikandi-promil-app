# Keterbatasan & TODO

Daftar ini dihimpun dari komentar `TODO` di kode (`grep -rn TODO src`) dan dari keadaan proyek. Perbarui saat menambah atau menyelesaikan TODO.

## Keterbatasan umum

| Area | Keadaan sekarang |
|---|---|
| Backend | Belum ada. Semua data dummy di memori, hilang saat app restart ([05-api](../05-api/overview.md)) |
| Autentikasi | Dummy; tidak ada sesi, token, route guard, atau login otomatis ([auth.md](../05-api/auth.md)) |
| Tema | Hanya terang; `userInterfaceStyle: automatic` belum punya token gelap |
| Test otomatis | Tidak ada ([quality-checks.md](./quality-checks.md)) |
| Penanganan galat | Hook yang diperiksa (mis. `usePartner`, `useTrackingMode`) memakai `data === null` sebagai keadaan memuat; kegagalan `get()` belum ditangani (tidak ada state galat / coba lagi). Hanya aksi toggle yang di-rollback |
| Aksesibilitas | `accessibilityRole` dan label ada di komponen global; belum diaudit (ukuran teks dinamis, kontras, screen reader per layar) |
| Bahasa | UI hanya bahasa Inggris; belum ada i18n |
| Android | Build hanya `arm64-v8a` (tidak jalan di emulator x86) |
| Ikon & splash | Masih aset template Expo |
| Folder `example/` | Sisa template; menghasilkan error di `tsc` ([quality-checks.md](./quality-checks.md#status-saat-dokumen-ini-ditulis)) |
| Helper HTTP | Tiga gaya berbeda (helper bersama, salinan lokal, `fetch` inline) ([overview.md](../05-api/overview.md#implementasi-http)) |
| Home / Onboarding / Auth | Belum memakai pola `api/` ([overview.md](../05-api/overview.md#pengecualian)) |
| `docs.md` kosong | `documentations/mobile-app/docs.md`, `console-app/docs.md`, `supabase/docs.md` masih placeholder |

## Butuh backend

| Lokasi | TODO |
|---|---|
| `src/config/api.ts`, `features/*/api/config.ts` | Ubah flag `USE_DUMMY_*` menjadi `false` |
| `src/utils/http.ts`, `features/*/api/http-*-api.ts` | Base URL dari env; pasang header `Authorization` |
| `features/auth/services/auth-api.ts` | Ganti dengan request nyata (mis. `supabase.auth.*`); revoke token saat `signOut` |
| `features/auth/dummy-credentials.ts` | `enabled: false` atau hapus berkas |
| `features/home/services/home-api.ts` | Ganti dengan request; respons cukup mengikuti `HomeDashboard` |
| `features/onboarding/services/onboarding-api.ts` | Muat konfigurasi dan kirim jawaban lewat request |
| `features/onboarding/context/onboarding-context.tsx` | Ganti estimasi lokal dengan prediksi server |
| `features/onboarding/hooks/use-analysis-progress.ts` | Progres dari status analisis nyata, bukan timer |
| `features/specialists/components/detail/detail-cover.tsx` | Simpan bookmark klinik ke server |

## Butuh modul native (dev build harus di-rebuild)

| Kemampuan | Paket yang disarankan | Lokasi TODO |
|---|---|---|
| Foto profil | `expo-image-picker` | `settings/components/personal-info-sheet.tsx` |
| Kamera tes LH (pembacaan AI) | `expo-camera` | `logging/components/sheets/lh-test-sheet.tsx` |
| Kamera tes kehamilan | `expo-camera` | `logging/components/sheets/pregnancy-test-sheet.tsx` |
| Pengingat suhu basal harian | `expo-notifications` | `logging/components/sheets/basal-guide-sheet.tsx` |
| Biometrik / kartu "Continue as …" | `expo-local-authentication` + penyimpanan aman | `auth/components/login-screen.tsx`, `privacy-security/components/privacy-screen.tsx` |
| PIN app lock | Layar buat PIN + penyimpanan aman | `privacy-security/components/privacy-screen.tsx` |
| Ganti ikon app | Modul alternate icon (native) | `privacy-security/components/privacy-screen.tsx` |
| Peta nyata | `react-native-maps` / `expo-maps` | `specialists/components/map-preview.tsx` |
| Prompt ulasan store (bintang 4–5) | `expo-store-review` | `settings/components/sheets/rate-app-sheet.tsx` |
| Login Google / Apple | Modul login sosial | `auth/services/auth-api.ts` (`signInWithProvider` hanya log) |
| Notifikasi push | `expo-notifications` | Belum ada kodenya |

Tambahkan lewat `npx expo install <paket>`, lalu rebuild ([running-the-app.md](../01-getting-started/running-the-app.md#setelah-menambah-paket-native)).

## Layar / alur yang belum ada (belum ada desain)

| Layar | Dibuka dari | Lokasi TODO |
|---|---|---|
| Lupa password | Log in | `auth/components/login-screen.tsx` |
| Riwayat check-in | Tombol riwayat di Check-in | `check-in/components/check-in-screen.tsx` |
| Booking / chat konselor | Kartu konselor di Check-in | `check-in/components/check-in-screen.tsx` |
| Notes (daftar catatan) | Home | `home/components/home-screen.tsx` |
| Pengaturan siklus dari Calendar | Ikon di header Calendar | `calendar/components/calendar-screen.tsx` |
| Artikel tersimpan | Header Articles | `articles/components/articles-screen.tsx` |
| Profil dokter | Daftar dokter di detail klinik / hasil pencarian | `specialists/components/specialist-detail-screen.tsx`, `specialists-screen.tsx` |
| Pencarian & posting baru, thread, menu laporkan/sembunyikan | Community | `community/components/community-screen.tsx` |
| Pengaturan notifikasi; navigasi ke `cta.route` | Notifications | `notifications/components/notifications-screen.tsx` |
| Pengaturan partner (putuskan, undang ulang) | Partner | `partner/components/partner-screen.tsx` |
| Tambah protokol & hasil lab | Treatment | `treatment/components/treatment-screen.tsx` |
| Pilih klinik tujuan; buka/bagikan PDF | Doctor report | `doctor-report/components/doctor-report-screen.tsx` |
| Riwayat suhu, mood, gejala | Sheet Temperature, Mood, Symptom | `logging/components/sheets/*.tsx` |
| Tambah & kelola obat | Sheet Medications | `logging/components/sheets/medications-sheet.tsx` |
| Perbandingan suplemen | Sheet Supplement | `logging/components/sheets/supplement-sheet.tsx` |
| Chat / WhatsApp dukungan | Help center | `settings/components/sheets/help-center-sheet.tsx` |
| Bagikan artikel: URL publik | Detail artikel | `articles/components/article-detail-screen.tsx` (konfirmasi URL dengan tim web) |
| Pusatkan ulang peta ke lokasi pengguna | Find a specialist | `specialists/components/map-preview.tsx` |

## Ditunda sampai backend siap

- Fase **Two-week wait** dan layar terkait.
- Perhitungan yang seharusnya di server: prediksi siklus, ringkasan Settings, ringkasan kalender/insight.

## Cara memperbarui daftar ini

1. `grep -rn "TODO" apps/mobile/src` dari root repo.
2. Pindahkan baris yang selesai keluar dari daftar; tambahkan yang baru ke tabel yang sesuai.
3. Gunakan `TODO(backend)` untuk yang menunggu backend, `TODO` untuk lainnya ([code-style.md](./code-style.md#komentar)).
