# State management & pola data

Tidak ada library state global (Redux, Zustand, dll.). Pola yang dipakai:

| Kebutuhan | Solusi |
|---|---|
| Data satu layar | Hook `useXxx()` dengan `useState` + `useEffect` (atau `useFocusEffect`) |
| Data dibagi beberapa layar | React Context (`OnboardingProvider`, `LoggingProvider`) |
| Cache antar-layar | Tidak ada; layar memuat ulang saat perlu |

## 1. Memuat data

```ts
useEffect(() => {
  let cancelled = false;
  api.get().then((d) => { if (!cancelled) setData(d); });
  return () => { cancelled = true; };
}, []);
```

Selalu ada flag `cancelled` agar tidak mengubah state setelah layar lepas.

## 2. Memuat ulang saat layar aktif kembali

Untuk layar tab yang datanya bisa berubah dari layar lain, pakai `useFocusEffect` dari `expo-router`:

- **Home** (`use-home-dashboard.ts`): agar kartu check-in ikut berubah setelah check-in disimpan.
- **Settings** (`use-settings.ts`): agar nilai di kanan baris ("PCOS", "2 active") ikut berubah setelah kembali dari halaman turunan.

## 3. Optimistic update dengan rollback

UI langsung berubah, request menyusul; jika gagal, kembali ke nilai semula:

```ts
const apply = (v: boolean) => setData((cur) => ({ ...cur, [key]: v }));
apply(enabled);
try { await api.setToggle(key, enabled); } catch { apply(!enabled); }
```

Dipakai di: toggle Settings/Privacy/Partner/Devices, tandai notifikasi terbaca, hug di Community, bookmark artikel, centang obat di Treatment.

## 4. Pencarian ter-*debounce*

Pencarian (Articles, Specialists, Help center) menunggu 250 ms setelah pengetikan berhenti, lalu memanggil API dengan `q`. Filtering dilakukan **server-side** (dummy meniru perilaku server).

## 5. Context yang ada

**`OnboardingProvider`** — `context/onboarding-context.tsx`
Menyimpan jawaban, error validasi per field, dan hasil prediksi (`calculateResult`). Menyediakan `setAnswer`, `validate(stepIndex)`, `submit()`.

**`LoggingProvider`** — `features/logging/context/logging-context.tsx`
- `data`: `LoggingData` dari `GET /logs/today`
- `active`: sheet log yang sedang terbuka (`LogKind | null`)
- `logged`: daftar tracker yang sudah dicatat hari ini (centang di Log today)
- `entries`: nilai hari ini (mood, gejala, suhu) — dipakai untuk mengisi awal sheet dan New note
- `openLog`, `openFromHub` (setelah simpan, kembali ke hub Log today), `closeLog`, `save`, `saveNote`

Tanggal catatan New note yang bukan hari ini tidak mengubah `logged`/`entries`.

## 6. Pola *state saat render* (bukan efek)

Aturan lint React Compiler melarang `setState` sinkron di dalam `useEffect`. Untuk mereset state ketika sebuah prop berubah, dipakai pola "sesuaikan state saat render":

```ts
const [wasVisible, setWasVisible] = useState(visible);
if (visible !== wasVisible) {
  setWasVisible(visible);
  if (visible) setDraft(start);   // reset saat sheet dibuka
}
```

Contoh: `DatePickerSheet`, `NumberPickerSheet`, `BottomSheet`, `LogSheetHost`.

## 7. Shared value Reanimated

Karena React Compiler, akses shared value memakai `.get()` / `.set()` — bukan `.value`:

```ts
progress.set(withTiming(1));
const style = useAnimatedStyle(() => ({ opacity: progress.get() }));
```

## Kapan menambah Context baru?

Hanya bila **tiga atau lebih layar/komponen** yang tidak berdekatan membutuhkan state yang sama dan hook lokal tidak cukup. Jika tidak, tetap pakai hook per fitur.
