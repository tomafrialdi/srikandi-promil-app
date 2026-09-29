# Menambah, mengubah, atau menghapus tab

Tab bar adalah komponen kustom (`AppTabBar`) yang membaca daftar tab dari satu tempat. Tab saat ini: **Home, Calendar, Add, Insights, Account**. Tab **Add** bukan layar melainkan aksi (membuka modal New note).

Tiga tempat yang harus konsisten:

| File | Peran |
|---|---|
| `src/app/(app)/(tabs)/<nama>.tsx` | Route tab |
| `src/app/(app)/(tabs)/_layout.tsx` | Mendaftarkan `<Tabs.Screen name="<nama>" />` (urutan = urutan tab) |
| `src/components/tab-bar/app-tab-bar.tsx` | `TAB_CONFIG`: label, ikon, apakah tab aksi |

Hanya route yang **ada di `TAB_CONFIG`** yang tampil di bar; route lain di folder `(tabs)` disembunyikan.

## Menambah tab layar

Contoh: tab "Learn".

1. **Route:** `src/app/(app)/(tabs)/learn.tsx`

   ```tsx
   import { LearnScreen } from "@/features/learn/components/learn-screen";
   export default function LearnRoute() {
     return <LearnScreen />;
   }
   ```

2. **Daftarkan** di `(tabs)/_layout.tsx`, di posisi yang diinginkan:

   ```tsx
   <Tabs.Screen name="learn" />
   ```

3. **Konfigurasi** di `TAB_CONFIG` (kunci = nama route). Urutan objek tidak menentukan urutan tab; urutannya mengikuti `Tabs.Screen`.

   ```ts
   import { GraduationCap } from "phosphor-react-native";
   learn: { label: "Learn", icon: GraduationCap },
   ```

4. **Layar tab:** gunakan `StickyScreen` dengan `edges={["top"]}` dan `bottomPadding={useTabBarClearance()}` supaya isi tidak tertutup bar melayang ([add-a-screen.md](./add-a-screen.md#1-buat-komponen-layar)).

## Menambah tab aksi

Tab aksi tidak berpindah layar. Set `action: true` di `TAB_CONFIG`:

```ts
add: { label: "Add", icon: Plus, action: true },
```

Yang dijalankan saat ditekan adalah `onAddPress` yang dilewatkan `(tabs)/_layout.tsx` ke `AppTabBar` (`router.push("/new-note")`). Route untuk tab aksi (`add.tsx`) hanyalah placeholder agar Expo Router punya entri; layarnya tidak pernah ditampilkan. Bila menambah tab aksi kedua, buat prop handler tersendiri, karena `AppTabBar` saat ini hanya mengenal satu (`onAddPress`).

## Mengubah urutan atau menghapus tab

- **Urutan:** pindahkan baris `<Tabs.Screen>` di `_layout.tsx`.
- **Hapus:** hapus `<Tabs.Screen>`, entri `TAB_CONFIG`, dan file route-nya. Cari tautan ke route itu (`router.push("/…")`) agar tidak ada yang menggantung; typed routes akan menandainya saat `tsc`.
- Root layout mengatur `gestureEnabled: false` untuk `(app)` dan `(tabs)` agar tidak ada swipe kembali ke splash. Jangan dihapus.
- Tombol back Android di `(tabs)/_layout.tsx` memanggil `BackHandler.exitApp()` pada semua tab.

## Catatan visual

`TabBar` melayang (translucent) dengan tinggi `TAB_BAR_HEIGHT` = 56 dan margin samping 16. Karena itu semua layar tab harus memakai `useTabBarClearance()`. Lima tab adalah batas nyaman untuk lebar layar ponsel.
