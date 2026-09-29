# EAS Build

Build cloud memakai **EAS Build** sehingga Android Studio tidak wajib. Konfigurasi ada di `apps/mobile/eas.json`.

| Hal | Nilai |
|---|---|
| Akun / owner | `gridlova` (`owner` di `app.json`) |
| Project ID | `0cc14b7c-8e22-425a-a540-32ad785300f9` (`extra.eas.projectId`) |
| Versi EAS CLI | `>= 16.0.0` |
| `appVersionSource` | `remote` (versi build disimpan di server EAS, bukan di `app.json`) |

## Login

```bash
npx eas-cli login
npx eas-cli whoami     # harus menampilkan akun yang memiliki project
```

## Profil build

```json
{
  "development": { "developmentClient": true, "distribution": "internal" },
  "preview":     { "distribution": "internal", "android": { "buildType": "apk" } },
  "production":  { "autoIncrement": true }
}
```

| Profil | Untuk | Hasil |
|---|---|---|
| `development` | Development build (dev client) yang terhubung ke Metro | Build internal berisi dev client. iOS butuh device terdaftar di akun Apple Developer |
| `preview` | Uji internal tanpa Metro | Android: **APK** yang bisa langsung dipasang |
| `production` | Rilis toko (Play Store / App Store) | Android: AAB. Nomor build naik otomatis (`autoIncrement`) |

## Build APK Android (uji internal)

```bash
cd apps/mobile
npx eas-cli build --platform android --profile preview
```

Setelah selesai, EAS menampilkan tautan dan kode QR untuk mengunduh APK. Buka di ponsel Android dan pasang (izinkan "install from unknown sources").

Pertama kali, EAS menawarkan membuat **keystore** Android; terima agar EAS menyimpannya. Jangan menghapus atau mengganti keystore setelah rilis: pembaruan app akan ditolak Play Store.

## Development build di cloud

```bash
npx eas-cli build --platform android --profile development
```

Pasang hasilnya, lalu jalankan `npx expo start --dev-client` di komputer. Untuk iOS lokal, lihat [running-the-app.md](../01-getting-started/running-the-app.md).

## Arsitektur CPU Android

`app.json` memakai `expo-build-properties` dengan `android.buildArchs: ["arm64-v8a"]`. Artinya APK hanya berisi arsitektur 64-bit ARM (hampir semua ponsel modern) sehingga build lebih kecil dan cepat. **Emulator Android berbasis x86 tidak akan bisa menjalankan build ini.** Bila perlu mendukung emulator x86 atau ponsel 32-bit lama, tambahkan `x86_64` / `armeabi-v7a` ke daftar.

Mengubah plugin di `app.json` mengubah kode native, jadi butuh build baru (bukan sekadar reload Metro).

## Variabel lingkungan untuk build

`EXPO_PUBLIC_API_URL` harus ada **saat build**, karena nilainya ditanam ke bundle. Tambahkan per profil di `eas.json`:

```json
"preview": {
  "distribution": "internal",
  "android": { "buildType": "apk" },
  "env": { "EXPO_PUBLIC_API_URL": "https://api-staging.example.com" }
}
```

Belum ada backend, jadi saat ini tidak diperlukan. Jangan menaruh rahasia di `EXPO_PUBLIC_*`.

## Masalah umum

| Gejala | Penyebab / solusi |
|---|---|
| `Project ... does not exist` / bukan pemilik | Login ke akun yang benar (`eas whoami`) atau minta akses ke org `gridlova` |
| Build gagal di tahap dependency | Jalankan `npm install` dari **root** repo dan commit `package-lock.json`; repo memakai npm workspaces |
| Pesan versi paket tidak cocok SDK | `npx expo install --check` lalu perbaiki dengan `npx expo install --fix` |
| App terpasang tetapi layar putih / "No script URL" | Itu development build; jalankan Metro dengan `--dev-client`, atau pakai profil `preview` |
| Build `preview` terlalu besar | Pastikan `buildArchs` tetap `arm64-v8a` |

Lihat juga [app-config.md](./app-config.md) dan [release-checklist.md](./release-checklist.md).
