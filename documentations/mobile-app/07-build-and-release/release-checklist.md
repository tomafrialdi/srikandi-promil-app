# Checklist rilis

Gunakan sebelum membagikan build ke penguji (`preview`) atau mengirim ke toko (`production`). Item bertanda ⚠ saat ini **belum terpenuhi**.

## Kualitas kode

- [ ] `npx tsc --noEmit` tanpa error di `src/` ([quality-checks.md](../09-conventions/quality-checks.md))
- [ ] `npx expo lint` bersih
- [ ] `npx expo install --check` tidak melaporkan paket yang tidak cocok
- [ ] Tidak ada `console.log` sisa (mis. di `features/auth/services/auth-api.ts`, `onboarding-api.ts`)
- [ ] Uji manual alur utama: Splash → Onboarding → Sign up → Home; Log in; catat log; buka semua tab

## Aset & identitas

- [ ] ⚠ Ikon app asli menggantikan aset template (`assets/images/icon.png`, `assets/expo.icon`, adaptive icon Android)
- [ ] ⚠ Splash sesuai desain (`splash-icon.png`)
- [ ] Nama tampil, `version`, bundle ID / package final ([app-config.md](./app-config.md))

## Data & backend

- [ ] ⚠ Semua flag `USE_DUMMY_*` bernilai `false` ([switching-to-real-backend.md](../05-api/switching-to-real-backend.md))
- [ ] ⚠ Autentikasi nyata; `DUMMY_AUTH` dihapus atau `enabled: false` ([auth.md](../05-api/auth.md))
- [ ] `EXPO_PUBLIC_API_URL` di profil build EAS mengarah ke lingkungan yang benar
- [ ] Tidak ada rahasia di `EXPO_PUBLIC_*` atau di repo

## Privasi & kepatuhan

Aplikasi memproses data kesehatan reproduksi dan tersedia untuk pengguna di Indonesia.

- [ ] ⚠ Kebijakan privasi dan syarat layanan mengarah ke dokumen final (sheet Privacy policy masih berisi teks dummy)
- [ ] Ekspor dan penghapusan data (`POST /account/data-export`, `DELETE /account/data`) berfungsi
- [ ] Data sensitif tidak tampil di layar kunci ketika mode diskret aktif (perilaku notifikasi)
- [ ] Pernyataan toko (Data safety Play Store / App Privacy App Store) sesuai data yang dikumpulkan

## Fitur yang bergantung modul native

Jika ikut dirilis, tambahkan paketnya dan build ulang ([known-limitations-and-todos.md](../09-conventions/known-limitations-and-todos.md)):

- [ ] Kamera & foto (`expo-camera`, `expo-image-picker`)
- [ ] Biometrik (`expo-local-authentication`) dan PIN
- [ ] Notifikasi push / pengingat (`expo-notifications`)
- [ ] Login Google / Apple
- [ ] Peta nyata

## Build & distribusi

- [ ] `eas.json` benar; `npx eas-cli build --platform android --profile preview` menghasilkan APK yang bisa dipasang dan berjalan tanpa Metro
- [ ] Diuji di minimal satu ponsel Android fisik (build hanya `arm64-v8a`) dan satu iPhone
- [ ] Untuk toko: `--profile production`, lalu `eas submit`
- [ ] Nomor versi dan catatan rilis dicatat; tag git dibuat
