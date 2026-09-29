# Autentikasi

Saat ini autentikasi **belum nyata**: tidak ada sesi, token, maupun penyimpanan kredensial. Dokumen ini menjelaskan keadaan sekarang dan titik-titik yang harus diganti.

## Keadaan sekarang

`features/auth/services/auth-api.ts`:

| Fungsi | Sekarang | Dipanggil dari |
|---|---|---|
| `signUp({email, password})` | Hanya `console.log` | `sign-up-screen.tsx` |
| `signIn({email, password, remember})` | Cocokkan dengan `DUMMY_AUTH`; salah → `AuthError` | `login-screen.tsx` |
| `signInWithProvider(provider)` | Hanya `console.log` | Tombol Google / Apple di Log in & Sign up |
| `verifyEmailCode({email, code})` | Cocokkan OTP dengan `DUMMY_AUTH.otp` | `verify-email-screen.tsx` |
| `resendVerificationCode(email)` | Hanya `console.log` | `verify-email-screen.tsx` |
| `signOut()` | Hanya `console.log` | Log out di `settings-screen.tsx` dan `privacy-screen.tsx` |

Kredensial uji ada di `dummy-credentials.ts` (`DUMMY_AUTH.enabled`). Nilainya: [dummy-data-and-credentials.md](../01-getting-started/dummy-data-and-credentials.md).

Perilaku UI yang perlu diketahui:

- `AuthError` membawa pesan yang siap ditampilkan (teks dari `features/auth/content.ts`). Layar menangkapnya dan menampilkan sebagai galat form; galat lain dilempar ulang.
- Sukses masuk memanggil `goToHome()` (`router.replace("/home")`). Log out memakai `router.dismissTo("/")`.
- **Tidak ada route guard.** Semua route bisa dibuka langsung; layar awal `/` selalu menampilkan splash, tidak ada login otomatis dari sesi tersimpan.
- Checkbox "remember me" dikirim sebagai `remember`, tetapi belum memengaruhi apa pun.
- Kartu "Continue as …" (Face ID) di Log in menerima prop `biometricUser` yang belum disuplai (`TODO` di `login-screen.tsx`).

## Rencana: Supabase Auth

`@supabase/supabase-js` sudah terpasang tetapi belum dipakai. Rancangan yang cocok dengan kode sekarang:

| Fungsi | Padanan Supabase |
|---|---|
| `signUp` | `supabase.auth.signUp({ email, password })` |
| `signIn` | `supabase.auth.signInWithPassword({ email, password })` |
| `verifyEmailCode` | `supabase.auth.verifyOtp({ email, token: code, type: "signup" })` |
| `resendVerificationCode` | `supabase.auth.resend({ type: "signup", email })` |
| `signInWithProvider` | `supabase.auth.signInWithOAuth` / `signInWithIdToken` (Google, Apple); butuh modul native, sehingga dev build harus di-rebuild |
| `signOut` | `supabase.auth.signOut()` |

Mapping galat: tangkap error Supabase dan lempar `AuthError` dengan pesan dari `AUTH_COPY.errors`, supaya layar tidak perlu diubah.

Repo sudah punya folder `supabase/` di root (konfigurasi lokal dan satu migrasi `foundation` yang masih kosong). Skema database belum dirancang.

## Langkah implementasi

1. **Klien Supabase.** Buat `src/lib/supabase.ts` dengan `createClient(url, anonKey, { auth: { storage, autoRefreshToken: true, persistSession: true } })`. URL dan anon key lewat `EXPO_PUBLIC_*` (anon key memang aman berada di klien; **jangan** memasukkan service-role key).
2. **Penyimpanan sesi.** React Native tidak punya `localStorage`. Pakai adapter penyimpanan aman (mis. `expo-secure-store`, paket native baru → rebuild dev build).
3. **Ganti `auth-api.ts`** sesuai tabel di atas, dan hapus cek `DUMMY_AUTH`.
4. **Token ke `request()`.** Di `src/utils/http.ts`, ambil `session.access_token` dan pasang header `Authorization` ([switching-to-real-backend.md](./switching-to-real-backend.md#2-base-url-dan-token)).
5. **Sesi saat startup.** Di `app/index.tsx` (atau root layout), bila sesi masih valid arahkan langsung ke `/home`. Setelah itu bisa dipasang guard: `Stack.Protected` di Expo Router untuk grup `(app)`.
6. **Log out.** `signOut()` lalu `router.dismissTo("/")`, sekaligus kosongkan state yang menyimpan data pengguna (provider log, dll.).
7. **Biometrik.** `expo-local-authentication` + menyimpan nama pengguna untuk kartu "Continue as …" dan pengaturan "App lock" di Privacy & security.
8. **Onboarding.** Hasil onboarding disimpan setelah akun dibuat (alur: Result → Sign up → Verify email). Putuskan apakah jawaban dikirim sebelum atau sesudah verifikasi; saat ini `submitOnboarding` dipanggil dari `OnboardingProvider.submit()`.

## Catatan keamanan

- Jangan menyimpan password atau token di `AsyncStorage` biasa / log.
- Hapus semua `console.log` di `auth-api.ts` (saat ini mencetak email dan kode OTP).
- Bila memakai Row Level Security (RLS) Supabase, aktifkan pada setiap tabel data pengguna sebelum klien dapat mengaksesnya langsung.
