# Anatomi sebuah feature module

Contoh nyata: `features/notifications`. Fitur lain mengikuti pola yang sama.

```
features/notifications/
├─ types.ts                     Tipe: NotificationDto (bentuk backend), AppNotification (bentuk UI)
├─ notification-types.ts        Registry: `type` dari backend → ikon & warna
├─ icons.ts                     Nama ikon → komponen Phosphor
├─ api/
│  ├─ notifications-api.ts      interface NotificationsApi + saklar dummy/real
│  ├─ config.ts                 export const USE_DUMMY_NOTIFICATIONS = true
│  ├─ dummy-notifications-api.ts   Implementasi dummy (memori)
│  ├─ dummy-notifications.json     Data dummy
│  ├─ http-notifications-api.ts    Implementasi backend asli (fetch)
│  └─ mappers.ts                DTO → model UI
├─ hooks/use-notifications.ts   Memuat data, filter, optimistic markRead
├─ utils/group-notifications.ts Pengelompokan Today / Yesterday / Earlier
└─ components/
   ├─ notifications-screen.tsx  Layar (dipasang oleh app/notifications.tsx)
   ├─ notification-group.tsx    Bagian kecil
   ├─ notification-item.tsx
   └─ discreet-banner.tsx
```

Route-nya hanya:

```tsx
// src/app/notifications.tsx
import { NotificationsScreen } from "@/features/notifications/components/notifications-screen";
export default function NotificationsRoute() {
  return <NotificationsScreen />;
}
```

## Peran tiap bagian

| Bagian | Tanggung jawab | Tidak boleh |
|---|---|---|
| **Screen** | Menyusun layout & menyambungkan hook ke komponen | Memanggil `fetch` langsung |
| **Hook** | Memuat data dari `xxxApi`, menyimpan state, menyediakan aksi | Mengetahui detail visual |
| **API** | Kontrak endpoint; dummy & http mengikuti interface yang sama | Menyentuh UI |
| **types.ts** | Bentuk data; menjadi kontrak dengan backend | Berisi logika |
| **Komponen kecil** | Menampilkan satu bagian berdasarkan props | Mengambil data sendiri |

## Pola pemisahan DTO ↔ model UI

Bila bentuk data backend berbeda dari kebutuhan UI (snake_case, tanggal ISO, dll.), pakai **mapper** (contoh: Notifications):

```
Backend JSON (NotificationDto) ──mapNotification()──► AppNotification (Date, boolean read, ...)
```

Fitur lain memakai bentuk yang sama di kedua sisi (`types.ts` tunggal) karena bentuknya sudah sesuai UI.

## Yang menentukan tampilan dari data

- **Ikon & warna berdasarkan `type`:** backend hanya mengirim `type` (mis. `fertile_window_open`); registry di app menentukan ikon dan tone. Tipe tak dikenal memakai gaya `FALLBACK_TYPE_STYLE` sehingga tidak merusak layar.
- **Daftar opsi dari data:** opsi mood, gejala, tipe cairan, hasil LH, produk suplemen, dsb. datang dari `LoggingData`.
- **Nama ikon di JSON:** string seperti `"thermometer"` dipetakan ke komponen lewat `icons.ts`.

## Checklist membuat fitur baru

Lihat [add-a-feature-module.md](../08-guides/add-a-feature-module.md).
