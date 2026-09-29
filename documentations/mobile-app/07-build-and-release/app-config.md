# Konfigurasi app (`app.json`)

File: `apps/mobile/app.json`. Folder `ios/` dan `android/` di-generate dari file ini (*Continuous Native Generation*), di-ignore git, dan **tidak boleh diedit manual**.

## Identitas

| Kunci | Nilai | Catatan |
|---|---|---|
| `name` / `slug` | `srikandi-promil` | Nama tampil di ponsel bisa diubah tanpa mengganti `slug` |
| `version` | `1.0.0` | Versi tampil ke pengguna. Nomor build dikelola EAS (`appVersionSource: remote`) |
| `scheme` | `srikandipromil` | Skema deep link (`srikandipromil://...`) |
| `owner` | `gridlova` | Akun Expo |
| `ios.bundleIdentifier` | `com.gridlova.srikandi-promil` | Harus sama dengan app yang terpasang di dev build |
| `android.package` | `com.gridlova.srikandipromil` | Tanpa tanda hubung (tidak diizinkan pada package Android) |

**Jangan mengubah bundle ID / package setelah rilis.** Mengubah keduanya membuat app baru di toko dan dev build lama tidak lagi terhubung.

## Tampilan

| Kunci | Nilai |
|---|---|
| `orientation` | `portrait` |
| `userInterfaceStyle` | `automatic` (UI hanya punya tema terang, lihat [03-design-system](../03-design-system/overview.md)) |
| `icon` | `./assets/images/icon.png` |
| `ios.icon` | `./assets/expo.icon` (format ikon iOS baru) |
| `android.adaptiveIcon` | Foreground, background, dan monochrome di `assets/images/`; `backgroundColor` `#E6F4FE` |
| `android.predictiveBackGestureEnabled` | `false` |
| `web.output` / `favicon` | `static` / `assets/images/favicon.png` |

Ikon dan splash masih memakai aset bawaan template Expo. Ganti dengan ikon Srikandi Promil sebelum rilis ([release-checklist.md](./release-checklist.md)).

## Plugin

| Plugin | Fungsi |
|---|---|
| `expo-router` | Routing berbasis file |
| `expo-splash-screen` | Splash native: latar `#C13D68` (warna `primary`), gambar `splash-icon.png` lebar 200 |
| `expo-build-properties` | `android.buildArchs: ["arm64-v8a"]` (hanya ARM 64-bit; lihat [eas-build.md](./eas-build.md#arsitektur-cpu-android)) |

Splash native ditahan sampai font selesai dimuat (`SplashScreen.preventAutoHideAsync()` di `src/app/_layout.tsx`).

## Eksperimen

| Kunci | Efek |
|---|---|
| `experiments.typedRoutes` | Tipe route dibuat otomatis; `router.push("/salah")` gagal saat `tsc` |
| `experiments.reactCompiler` | React Compiler aktif: memoization otomatis, tetapi aturan lint lebih ketat ([code-style.md](../09-conventions/code-style.md)) |

## Kapan perlu build ulang?

| Perubahan | Perlu |
|---|---|
| Kode TS/JS, JSON dummy | Tidak. Fast Refresh / reload Metro |
| Menambah paket berisi kode native | Ya: `npx expo prebuild --platform ios --clean` lalu `npx expo run:ios`, atau build EAS baru |
| Mengubah `plugins`, ikon, splash, bundle ID, `scheme` | Ya |
| Mengubah `experiments` | Restart Metro dengan `--clear` |

## Menambah dependensi

Selalu `npx expo install <paket>` dari `apps/mobile` agar versi cocok dengan SDK 57 ([setup.md](../01-getting-started/setup.md#menambah-dependensi)). Setelah itu commit `package.json` dan `package-lock.json` (root).
