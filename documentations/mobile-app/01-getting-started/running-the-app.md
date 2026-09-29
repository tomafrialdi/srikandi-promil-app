# Menjalankan aplikasi

## Aplikasi ini memakai *development build*, bukan Expo Go

`expo-dev-client` terpasang dan app memakai modul native di luar Expo Go (mis. `react-native-svg`, `expo-glass-effect`). Karena itu app harus di-*build* dulu ke simulator / device, lalu terhubung ke Metro.

## Simulator iOS

```bash
cd apps/mobile
npx expo run:ios          # build pertama kali lama (beberapa menit), berikutnya cepat
```

Setelah app terpasang, cukup jalankan Metro:

```bash
npx expo start --dev-client   # lalu tekan "i" untuk membuka di simulator
```

## iPhone fisik

```bash
npx expo run:ios --device
npx expo start --dev-client
```

Syarat: iPhone dan Mac di **jaringan Wi-Fi yang sama**, dan izin **Local Network** untuk app diaktifkan (Settings → Privacy & Security → Local Network). Jika jaringan bermasalah, pakai `npx expo start --dev-client --tunnel`.

## Android

- **Tanpa Android Studio:** build APK di cloud. Lihat [`07-build-and-release`](../07-build-and-release/eas-build.md).
- **Dengan Android SDK lokal:** `npx expo run:android`.

## Setelah menambah paket native

Folder `ios/` dan `android/` adalah hasil generate (*Continuous Native Generation*) dan **di-ignore git**. Jangan diedit manual.

Jika menambah paket native atau mengubah plugin di `app.json`:

```bash
npx expo prebuild --platform ios --clean   # regenerate + pod install
npx expo run:ios                            # build ulang dev build
```

Perubahan JavaScript/TypeScript saja **tidak** membutuhkan build ulang (Fast Refresh / reload Metro cukup).

## Masalah umum

| Gejala | Penyebab | Solusi |
|---|---|---|
| `Unable to resolve module ...` | Cache Metro lama / paket baru belum dikenali | `npx expo start --dev-client --clear` |
| `No script URL provided` di iPhone | Dev build tanpa launcher, atau Metro belum jalan / tidak terjangkau | Pastikan `expo-dev-client` terpasang & build ulang; jalankan Metro dulu; cek izin Local Network |
| `No development build (...) is installed` | Bundle ID di `app.json` tidak sama dengan app yang terpasang | Build ulang dengan `npx expo run:ios` |
| `ENOENT ... codesigning ... rename` | Dua proses Expo menulis cache bersamaan (mis. Expo Go + Orbit) | Muat ulang app; jika berulang hapus `~/.expo/codesigning/<project-id>` lalu restart Metro |
| Layar biru bawaan Expo saat app dibuka | Splash native lama | Build ulang dev build (splash dikonfigurasi di `app.json`) |
| Fitur baru tidak muncul setelah banyak file ditambah | Fast Refresh tidak memuat ulang semua | Tutup app lalu buka lagi, atau tekan `r` di terminal Metro |

## Peringatan build yang aman diabaikan

`Script has ambiguous dependencies ... [Expo Dev Launcher] Strip Local Network Keys for Release` — peringatan Xcode dari template `expo-dev-client`. Tidak memengaruhi app dan tidak perlu diedit (folder `ios/` di-generate ulang).
