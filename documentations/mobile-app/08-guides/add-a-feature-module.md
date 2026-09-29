# Menambah fitur baru

Fitur baru = satu folder di `src/features/<nama>` mengikuti pola di [feature-module-anatomy.md](../02-architecture/feature-module-anatomy.md). Contoh di bawah membuat fitur **`journal`** dengan satu layar dan dua endpoint. Ganti nama sesuai kebutuhan.

## 1. Rancang tipe dulu: `types.ts`

Tipe adalah kontrak dengan backend. Tulis bentuk respons yang diinginkan layar:

```ts
// features/journal/types.ts
export interface JournalEntry {
  id: string;
  date: string;          // ISO "YYYY-MM-DD"
  text: string;
}

export interface JournalData {
  entries: JournalEntry[];
}

export interface JournalInput {
  text: string;
}
```

Bila bentuk backend berbeda dari kebutuhan UI (snake_case, tanggal ISO → `Date`), pisahkan DTO dan model UI seperti di `features/notifications` (`types.ts` + `api/mappers.ts`).

## 2. Lapisan API: `api/`

```
features/journal/api/
├─ journal-api.ts
├─ dummy-journal-api.ts
├─ http-journal-api.ts
```

**`journal-api.ts`** — interface + saklar. Tulis endpoint di komentar sebagai spesifikasi:

```ts
import { USE_DUMMY_API } from "@/config/api";
import type { JournalData, JournalInput } from "../types";
import { dummyJournalApi } from "./dummy-journal-api";
import { httpJournalApi } from "./http-journal-api";

/**
 * What the Journal screen needs from the backend.
 *
 *   GET  /journal -> JournalData
 *   POST /journal body: JournalInput -> 204
 */
export interface JournalApi {
  get(): Promise<JournalData>;
  add(input: JournalInput): Promise<void>;
}

export const journalApi: JournalApi = USE_DUMMY_API ? dummyJournalApi : httpJournalApi;
```

Saklar: fitur baru cukup memakai `USE_DUMMY_API` dari `src/config/api.ts`. Bila ingin bisa dinyalakan terpisah, buat `api/config.ts` dengan `export const USE_DUMMY_JOURNAL = true` seperti Articles/Calendar.

**`dummy-journal-api.ts`** — simpan di memori, tiru latensi, dan tiru perilaku server:

```ts
import { delay } from "@/utils/http";
import type { JournalApi } from "./journal-api";
import type { JournalData } from "../types";

let data: JournalData = { entries: [] };

export const dummyJournalApi: JournalApi = {
  async get() {
    await delay(300);
    return data;
  },
  async add({ text }) {
    await delay(200);
    const date = new Date().toISOString().slice(0, 10);
    data = { entries: [{ id: String(Date.now()), date, text }, ...data.entries] };
  },
};
```

Data statis yang besar taruh di `dummy-journal.json`. Tanggal dibuat relatif terhadap hari ini agar demo selalu terlihat "hidup".

**`http-journal-api.ts`** — pakai helper bersama:

```ts
import { request } from "@/utils/http";
import type { JournalData } from "../types";
import type { JournalApi } from "./journal-api";

export const httpJournalApi: JournalApi = {
  get: () => request<JournalData>("/journal"),
  add: (input) => request<void>("/journal", { method: "POST", body: JSON.stringify(input) }),
};
```

Detail lebih lanjut: [add-an-endpoint.md](./add-an-endpoint.md).

## 3. Hook: `hooks/use-journal.ts`

Memuat data, menyimpan state, menyediakan aksi. Gunakan flag `cancelled` dan, untuk toggle, optimistic update dengan rollback ([state-management.md](../02-architecture/state-management.md)).

```ts
export function useJournal() {
  const [data, setData] = useState<JournalData | null>(null);

  const load = useCallback(async () => setData(await journalApi.get()), []);
  useEffect(() => {
    let cancelled = false;
    journalApi.get().then((d) => { if (!cancelled) setData(d); });
    return () => { cancelled = true; };
  }, []);

  const add = useCallback(async (text: string) => {
    await journalApi.add({ text });
    await load();
  }, [load]);

  return { data, add };
}
```

Bila datanya bisa berubah dari layar lain, muat ulang dengan `useFocusEffect` (contoh: `use-home-dashboard.ts`).

## 4. Komponen: `components/`

- `journal-screen.tsx`: layar ([add-a-screen.md](./add-a-screen.md)). Menyambungkan hook ke komponen kecil; tidak memanggil `fetch`.
- Komponen kecil (`entry-card.tsx`, …): hanya menampilkan lewat props, tidak mengambil data.
- Sub-folder bila perlu: `sheets/`, `detail/`, `fields/`.

## 5. Konten dan ikon

- Teks statis yang banyak → `content.ts`.
- Ikon yang namanya datang dari data → `icons.ts` (`Record<NamaIkon, Icon>`), dengan fallback untuk nama tak dikenal.
- Fungsi murni (format, hitung, pengelompokan) → `utils/`.

## 6. Route

```tsx
// src/app/journal.tsx
import { JournalScreen } from "@/features/journal/components/journal-screen";

export default function JournalRoute() {
  return <JournalScreen />;
}
```

Lalu hubungkan dari layar lain (`router.push("/journal")`) atau baris menu Settings ([add-a-screen.md](./add-a-screen.md#4-sambungkan-navigasi)).

## 7. Dokumentasi

- Tambah endpoint ke [05-api/endpoints.md](../05-api/endpoints.md) dan flag ke [05-api/overview.md](../05-api/overview.md#saklar-dummy--backend).
- Tambah ringkasan ke [06-features/README.md](../06-features/README.md).
- Bila ada data dummy baru, catat di [dummy-data-and-credentials.md](../01-getting-started/dummy-data-and-credentials.md).

## Checklist

- [ ] `types.ts` menjadi kontrak; tidak ada `any`
- [ ] Tiga file API: interface + saklar, dummy, http; semuanya mengikuti interface yang sama
- [ ] Hook memakai `journalApi`, bukan `dummy…` / `http…`
- [ ] Route hanya memasang layar
- [ ] Warna/font/radius dari `theme.ts`; komponen global dipakai ulang
- [ ] `npx tsc --noEmit` dan `npx expo lint` lolos
- [ ] Dokumentasi diperbarui
