# Setup lingkungan development

## Prasyarat

| Kebutuhan | Keterangan |
|---|---|
| Node.js (LTS) + npm | Repo memakai **npm workspaces** (`apps/*`, `packages/*`) |
| Xcode + CocoaPods | Untuk build iOS (simulator atau device). Hanya macOS |
| Akun Expo (`gridlova`) | Untuk EAS Build. Login: `npx eas-cli login` |
| Android Studio | **Opsional.** Build APK dilakukan di cloud EAS, jadi tidak wajib |
| Git | Repo: `tomafrialdi/srikandi-promil-app` |

## Instalasi

```bash
git clone https://github.com/tomafrialdi/srikandi-promil-app.git
cd srikandi-promil-app
npm install            # dijalankan dari root (workspace)
cd apps/mobile
```

`node_modules` utama berada di root repo (hoisted). Jangan menjalankan `npm install` terpisah di `apps/mobile` kecuali untuk menambah paket (lihat di bawah).

## Menambah dependensi

Selalu pakai `expo install` supaya versinya cocok dengan SDK:

```bash
cd apps/mobile
npx expo install <nama-paket>
```

Jangan pakai `npm install <paket>` langsung untuk paket Expo / React Native.

> Jika paket yang ditambah berisi **kode native**, development build harus di-rebuild. Lihat [running-the-app.md](./running-the-app.md#setelah-menambah-paket-native).

## Variabel lingkungan

| Variabel | Fungsi | Status |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL backend untuk semua `http-*-api.ts` | Belum dipakai selama flag dummy aktif |

Variabel berawalan `EXPO_PUBLIC_` ikut ter-bundle ke app, jadi **jangan menaruh rahasia** di sana.

## Perintah yang sering dipakai

| Perintah (dari `apps/mobile`) | Fungsi |
|---|---|
| `npx expo start --dev-client` | Jalankan Metro untuk development build |
| `npx expo start --dev-client --clear` | Sama, dengan cache Metro dibersihkan |
| `npx expo run:ios` / `npx expo run:ios --device` | Build & jalankan di simulator / iPhone |
| `npx expo run:android` | Build & jalankan di Android (butuh Android SDK) |
| `npx tsc --noEmit` | Cek tipe |
| `npx expo lint` | Lint |
| `npx expo-doctor` | Diagnosa dependensi & konfigurasi |

Lihat juga [quality-checks.md](../09-conventions/quality-checks.md).
