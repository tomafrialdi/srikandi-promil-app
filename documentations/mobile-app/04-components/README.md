# Katalog komponen global

Semua ada di `src/components`. Komponen yang hanya dipakai satu fitur tetap berada di `features/<nama>/components`. Sebuah komponen dipindah ke sini begitu dipakai oleh lebih dari satu fitur.

Impor dengan alias:

```tsx
import { ButtonPrimary } from "@/components/button-primary";
import { TextField } from "@/components/form/text-field";
```

Semua komponen memakai token dari `@/constants/theme` ([03-design-system](../03-design-system/overview.md)). `Icon` adalah tipe dari `phosphor-react-native`; `Tone` dari `@/constants/theme`.

## Daftar isi

- [Layout](#layout)
- [Tombol](#tombol)
- [Form](#form)
- [Pemilih & sheet](#pemilih--sheet)
- [List](#list)
- [Tampilan data](#tampilan-data)
- [Navigasi](#navigasi)
- [Lain-lain](#lain-lain)

## Layout

### `StickyScreen` — `sticky-screen.tsx`
Layout layar dengan header yang disematkan. Hanya `children` yang ter-scroll. Garis tipis muncul di bawah header setelah konten bergeser.

| Prop | Tipe | Default | Keterangan |
|---|---|---|---|
| `header` | `ReactNode` | wajib | Back button, judul, search, filter |
| `children` | `ReactNode` | wajib | Isi yang ter-scroll |
| `footer` | `ReactNode` | – | Disematkan di bawah (mis. bar tombol) |
| `edges` | `Edge[]` | `["top","bottom"]` | Sisi safe area. Layar tab: `["top"]` |
| `bottomPadding` | `number` | `32` | Ruang di akhir konten |
| `headerGap` | `number` | `14` | Jarak antar bagian header |
| `contentStyle` | `StyleProp<ViewStyle>` | – | Digabung ke gaya konten (mis. `paddingHorizontal: 0`) |
| `keyboardAvoiding` | `boolean` | – | Naikkan layar di atas keyboard (form) |

```tsx
<StickyScreen header={<ScreenHeader title="Articles" />} bottomPadding={useTabBarClearance()} edges={["top"]}>
  ...
</StickyScreen>
```

`StickyBleed` (diekspor dari file yang sama) membiarkan satu bagian melebar penuh, melewati padding samping konten.

### `ScreenHeader` — `screen-header.tsx`
`title: string`, `right?: ReactNode` (biasanya `IconButton`). Tanpa `right`, judul tetap di tengah.

### `SectionHeader` — `section-header.tsx`
`title`, `subtitle?`, `actionLabel?`, `onActionPress?`, `actionArrow?` (panah kecil setelah label aksi).

### `DividerLabel` — `divider-label.tsx`
`label: string`. Garis pemisah dengan teks di tengah (mis. "or sign up with email").

### `ComingSoonScreen` — `coming-soon-screen.tsx`
`title: string`. Layar placeholder untuk halaman yang belum dibuat.

## Tombol

| Komponen | File | Props |
|---|---|---|
| `ButtonPrimary` | `button-primary.tsx` | `label`, `onPress?`, `disabled?`, `backgroundColor?`, `labelColor?`, `style?` |
| `ButtonOutline` | `button-outline.tsx` | `label`, `onPress?`, `disabled?`, `compact?` (padding kecil untuk di dalam kartu), `tone?: "default" \| "danger"`, `icon?`, `style?` |
| `LinkButton` | `link-button.tsx` | `label`, `onPress?` |
| `IconButton` | `icon-button.tsx` | `icon`, `label` (aksesibilitas), `onPress?`, `filled?`, `variant?: "default" \| "overlay"` |
| `BackButton` | `back-button.tsx` | `onPress?` (default `router.back()`), `variant?: "default" \| "overlay"` |
| `SocialButtons` | `social-buttons.tsx` | `onPress(provider: SocialProvider)`: tombol Google / Apple |

`variant="overlay"` adalah lingkaran putih transparan untuk di atas gambar.

## Form

Semua field dibungkus `FieldShell` (label + pesan galat) sehingga tampilannya seragam.

| Komponen | File | Props penting |
|---|---|---|
| `TextField` | `form/text-field.tsx` | `label`, `value`, `onChange(text)`, `icon?`, `error?`, `secure?` (tombol show/hide), `suffix?`, plus `placeholder`, `keyboardType`, `autoCapitalize`, `autoComplete`, `textContentType`, `returnKeyType`, `onSubmitEditing` |
| `SelectField` | `form/select-field.tsx` | `label`, `value` (teks), `placeholder?`, `icon?`, `suffix?`, `error?`, `active?`, `onPress` (membuka sheet pemilih) |
| `SearchField` | `form/search-field.tsx` | `value`, `onChange`, `placeholder?` |
| `ChoiceChips` | `form/choice-chips.tsx` | `options`, `value?`, `onChange(value)`, `columns?` (default 3) |
| `Checkbox` | `form/checkbox.tsx` | `checked`, `onChange`, `size?` (default 20), `children?` (teks di samping; ikut menjadi area tap) |
| `FieldShell` | `form/field-shell.tsx` | `label`, `error?`, `children`. Juga mengekspor `REQUIRED_MESSAGE = "Required"` |

`form/field-styles.ts` berisi gaya bersama antar field (`fieldStyles`).

```tsx
<TextField label="Email" value={email} onChange={setEmail} keyboardType="email-address" error={errors.email} />
```

## Pemilih & sheet

### `BottomSheet` — `bottom-sheet.tsx`
Panel dari bawah; dasar semua sheet di app.

| Prop | Tipe | Keterangan |
|---|---|---|
| `visible` | `boolean` | wajib |
| `onClose` | `() => void` | wajib |
| `title`, `subtitle` | `string` | Blok judul di header |
| `headerLeft` | `ReactNode` | Menggantikan blok judul (mis. kotak ikon). Tombol tutup tetap ada |
| `gap` | `number` | Jarak header ↔ isi. Default 20 |
| `scrollable` | `boolean` | Isi bisa di-scroll (form panjang) |
| `children` | `ReactNode` | wajib |

### Sheet pemilih siap pakai

| Komponen | File | Props |
|---|---|---|
| `OptionPickerSheet` | `option-picker-sheet.tsx` | `visible`, `onClose`, `title`, `options: {id,label}[]`, `value`, `onSelect(id)` (sheet menutup sendiri) |
| `NumberPickerSheet` | `number-picker-sheet.tsx` | `visible`, `onClose`, `onConfirm(n)`, `title`, `min`, `max`, `step?`, `value?`, `initialValue?`, `unit?`, `confirmLabel?` |
| `DatePickerSheet` | `date-picker-sheet.tsx` | `visible`, `onClose`, `onConfirm(date)`, `value?`, `title?`, `confirmLabel?`, `minDate?`, `maxDate?`, `blockedAfter?` + `blockedMessage?` (tanggal setelahnya tampil tetapi tidak bisa dipilih; menampilkan peringatan) |
| `WheelPicker` | `wheel-picker.tsx` | `values: number[]`, `value`, `onChange`, `unit?` (dipakai `NumberPickerSheet`) |

Pasangan umum: `SelectField` (memicu) + sheet pemilih (memilih):

```tsx
const [open, setOpen] = useState(false);
<SelectField label="Height" value={height ? String(height) : ""} suffix="cm" active={open} onPress={() => setOpen(true)} />
<NumberPickerSheet visible={open} onClose={() => setOpen(false)} onConfirm={setHeight} title="Height" min={120} max={220} unit="cm" />
```

## List

| Komponen | File | Props |
|---|---|---|
| `ListRow` | `list/list-row.tsx` | `label`, `icon`, `iconTone?`, `value?`, `valueHighlighted?`, `onPress?`. Baris tap dengan chevron |
| `ToggleRow` | `list/toggle-row.tsx` | `label`, `description?`, `value`, `onValueChange` |
| `InsetToggleItem` | `list/inset-toggle-item.tsx` | `label`, `value`, `onValueChange`, `icon?` |
| `ListCard` | `list/list-card.tsx` | `children`. Kartu putih membulat yang menumpuk baris dengan garis pemisah |
| `InsetList` | `list/inset-list.tsx` | `children`. Kartu putih dengan padding samping 16 px; tiap anak satu baris, dipisah garis tipis |
| `ListSection` | `list/list-section.tsx` | `title`, `children`. Judul abu-abu di atas `ListCard` |
| `Switch` | `switch.tsx` | `value`, `onValueChange`, `accessibilityLabel?` |

```tsx
<ListSection title="Account">
  <ListRow label="Personal information" icon={User} value="Amara" onPress={openProfile} />
  <ToggleRow label="Daily reminder" value={on} onValueChange={setOn} />
</ListSection>
```

## Tampilan data

| Komponen | File | Props |
|---|---|---|
| `Chip` | `chip.tsx` | `label`, `tone?` (default `primary`), `size?: "sm" \| "md"`, `icon?` |
| `IconCircle` | `icon-circle.tsx` | `icon`, `tone?` (default `neutral`), `size?` (default 36), `solid?` |
| `Avatar` | `avatar.tsx` | `name`, `imageUrl?`, `size?` (default 44). Tanpa foto: inisial di lingkaran pink |
| `InsightCard` | `insight-card.tsx` | `icon`, `text`, `tone?` (default `info`) |
| `OptionPill` | `option-pill.tsx` | `label`, `selected`, `onPress`, `fill?` (default true: berbagi lebar baris) |
| `BarChart` | `charts/bar-chart.tsx` | `items: BarChartItem[]` (`{key, label, value, highlighted?}`), `axisMax`, `height?` (default 130) |
| `ProgressBar` | `charts/progress-bar.tsx` | `value` (0..1), `color?` |
| `ProgressRing` | `progress-ring.tsx` | `progress: SharedValue<number>` (0..1), `size?`, `strokeWidth?`, `color?`, `trackColor?`, `children?` di tengah cincin |

## Navigasi

| Komponen | File | Keterangan |
|---|---|---|
| `FilterChips<T>` | `filter-chips.tsx` | Baris chip yang bisa di-scroll horizontal. `options: {id,label}[]`, `value`, `onChange`, `sidePadding?`, `size?: "sm" \| "md"` |
| `SegmentedControl<T>` | `segmented-control.tsx` | `options: {value,label}[]`, `value`, `onChange` |
| `AppTabBar` | `tab-bar/app-tab-bar.tsx` | Menghubungkan tab bar ke state Expo Router. `TAB_CONFIG` = daftar tab (label, ikon, `action`) |
| `TabBar` | `tab-bar/tab-bar.tsx` | Tab bar presentasional. Mengekspor `TAB_BAR_HEIGHT` (56) dan hook `useTabBarClearance()` |

`useTabBarClearance()` mengembalikan tinggi yang harus disisakan di bawah konten layar tab agar tidak tertutup tab bar melayang.

## Lain-lain

- Fungsi `initials(name)` ada di `src/utils/initials.ts` ("Dr. Amelia Wong" → "AW"), dipakai `Avatar`.
- Jangan membuat komponen baru bila yang ada cukup dengan sedikit prop tambahan. Tambahkan prop opsional dengan default yang mempertahankan perilaku lama, lalu dokumentasikan di sini.
