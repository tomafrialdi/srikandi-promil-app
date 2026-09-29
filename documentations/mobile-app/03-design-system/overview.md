# Design system

Semua nilai visual berasal dari satu file: `src/constants/theme.ts`. Jangan menulis hex, nama font, atau radius mentah di komponen; import tokennya.

```ts
import { colors, fonts, radius, tones, type Tone } from "@/constants/theme";
```

## Warna (`colors`)

| Kelompok | Token | Nilai | Dipakai untuk |
|---|---|---|---|
| Brand | `primary` | `#C13D68` | Tombol utama, ikon aktif, link, splash |
| | `primarySoft` | `#F6DEE6` | Latar lembut untuk chip / ikon berwarna primary |
| | `primaryTint` / `primaryTintStrong` | `#C13D68` alpha 10% / 20% | Sorotan tipis di atas latar terang |
| Permukaan | `surface` | `#FAF9F6` | Latar layar |
| | `surfaceAlt` | `#F1EFE9` | Latar alternatif (segmented control, input, tone neutral) |
| | `card` | `#FFFFFF` | Kartu |
| Teks | `ink` | `#1A1A18` | Teks utama |
| | `inkMuted` | `#6F6D66` | Teks sekunder |
| | `inkFaint` | `#A6A49B` | Placeholder, chevron, hint |
| Garis | `border` | `#E7E4DC` | Garis pemisah & border kartu |
| Status | `success` / `successSoft` | `#3F9950` / `#E1F1E3` | Berhasil, terhubung |
| | `info` / `infoSoft` | `#2574C4` / `#DCEAF9` | Informasi |
| | `warning` / `warningSoft` / `warningInk` | `#E0A030` / `#FBEFD9` / `#9A6A12` | Peringatan (`warningInk` untuk teks di atas `warningSoft`) |
| | `error` / `errorSoft` | `#D64545` / `#FAE1E1` | Galat, aksi destruktif |
| Overlay | `overlay` | `#14140F` alpha ~54% | Latar gelap di belakang bottom sheet |
| | `white`, `whiteSoft`, `whiteStrong`, `whiteGlass` | putih dengan berbagai alpha | Elemen di atas gambar / latar berwarna |
| Lain | `shadow` | `#1A1A18` | Warna bayangan |
| | `mint` | `#8FD19B` | Aksen hijau muda (kartu hero) |

Aplikasi hanya punya tema terang. `userInterfaceStyle` di `app.json` bernilai `automatic`, tetapi belum ada token tema gelap.

## Tipografi (`fonts`)

Satu keluarga: **Plus Jakarta Sans**, dimuat di `src/app/_layout.tsx` (splash native ditahan sampai font siap).

| Token | Weight | Penggunaan umum |
|---|---|---|
| `fonts.medium` | 500 | Teks isi, keterangan kecil |
| `fonts.semibold` | 600 | Label, teks baris list |
| `fonts.bold` | 700 | Judul kartu, label tombol |
| `fonts.extrabold` | 800 | Judul layar, angka besar |

React Native tidak mengubah weight dari `fontWeight` untuk font kustom, jadi **selalu pilih lewat `fontFamily`**, bukan `fontWeight`:

```tsx
text: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink }
```

Ukuran font tidak punya token; nilai yang umum: 10–11 (chip), 12 (keterangan), 14 (isi/baris list), 15 (tombol), lebih besar untuk judul.

## Radius (`radius`)

| Token | px | Untuk |
|---|---|---|
| `sm` | 12 | Input kecil, kotak ikon |
| `md` | 14 | Kartu kecil, item list |
| `lg` | 24 | Kartu besar, bottom sheet |
| `pill` | 100 | Tombol, chip, pill |

## Tone (`tones`)

Pasangan latar lembut + warna kuat yang dipakai berulang oleh ikon, chip, dan badge.

```ts
tones.primary  // { bg: primarySoft,  fg: primary }
tones.info     // { bg: infoSoft,     fg: info }
tones.warning  // { bg: warningSoft,  fg: warning }
tones.success  // { bg: successSoft,  fg: success }
tones.error    // { bg: errorSoft,    fg: error }
tones.neutral  // { bg: surfaceAlt,   fg: inkMuted }
```

Tipenya `Tone`. Komponen yang menerima `tone` / `iconTone`: `Chip`, `IconCircle`, `InsightCard`, `ListRow`. Data dari backend cukup mengirim nama tone (mis. `"warning"`), lalu UI mencari warnanya.

## Ikon

Semua ikon dari **`phosphor-react-native`**. Tipe komponennya `Icon`.

```tsx
import { Thermometer, type Icon } from "phosphor-react-native";
<Thermometer size={16} color={colors.primary} weight="fill" />
```

- Komponen menerima ikon **sebagai prop komponen** (`icon: Icon`), bukan string, sehingga ukuran/warna diatur di tempat pakai.
- Ikon yang namanya datang dari JSON/backend (string) dipetakan lewat registry `icons.ts` per fitur, mis. `HOME_ICONS`, `notification-types.ts`. Nama tak dikenal harus punya fallback agar layar tidak rusak.
- Ukuran umum: 16 (di dalam baris list), 20–24 (tombol ikon, tab bar).

## Pola layout

| Pola | Aturan |
|---|---|
| Padding samping layar | 20 px (`StickyScreen`) |
| Jarak antar bagian | `gap` pada `View`, bukan margin per anak |
| Header layar | Disematkan (sticky) lewat `StickyScreen`; garis tipis muncul setelah konten ter-scroll di bawahnya |
| Bottom bar tombol | Lewat prop `footer` `StickyScreen` (sudah menangani inset bawah) |
| Layar tab | `edges={["top"]}` dan `bottomPadding={useTabBarClearance()}` agar tidak tertutup tab bar melayang |
| Input di bottom sheet / form | `BottomSheet` dengan `scrollable` |
| Overlay di atas gambar | Varian `"overlay"` pada `BackButton` / `IconButton` |

## Pola interaksi

- **Animasi:** `react-native-reanimated` 4. Karena React Compiler aktif, baca/tulis shared value dengan `.get()` / `.set()` (lihat [state-management.md](../02-architecture/state-management.md#7-shared-value-reanimated)).
- **Pressable:** beri `accessibilityRole` dan efek tekan lewat `opacity` (`pressed ? 0.85 : 1`).
- **Sheet pemilih:** pilihan tunggal → `OptionPickerSheet`; angka → `NumberPickerSheet` (`WheelPicker`); tanggal → `DatePickerSheet`. Field yang membukanya: `SelectField`.
- **Optimistic update:** toggle langsung berubah, lalu rollback bila request gagal.

## Peta desain ↔ kode

Layar dirancang di Pencil lalu di-slicing. Elemen desain yang berulang sudah menjadi komponen global:

| Elemen desain | Komponen |
|---|---|
| Tombol pink penuh (pill) | `ButtonPrimary` |
| Tombol outline / destruktif | `ButtonOutline` (`tone="danger"`) |
| Teks link | `LinkButton` |
| Tombol lingkaran ikon | `IconButton`, `BackButton` |
| Judul layar + aksi kanan | `ScreenHeader` |
| Judul bagian + "View all" | `SectionHeader` |
| Baris pengaturan (ikon, nilai, chevron) | `ListRow` di dalam `ListCard` / `ListSection` |
| Baris dengan saklar | `ToggleRow`, `InsetToggleItem` |
| Field teks / pilihan | `TextField`, `SelectField`, `SearchField` |
| Kelompok pill pilihan | `ChoiceChips`, `OptionPill`, `FilterChips`, `SegmentedControl` |
| Label kecil berwarna | `Chip` |
| Lingkaran ikon berwarna | `IconCircle` |
| Kartu tips / insight | `InsightCard` |
| Grafik batang / progres | `BarChart`, `ProgressBar`, `ProgressRing` |
| Tab bar melayang + tombol "+" | `AppTabBar` / `TabBar` |
| Panel dari bawah | `BottomSheet` |

Katalog lengkap beserta props: [04-components](../04-components/README.md).
