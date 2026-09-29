# Menambah layar

Aturan dasarnya: file di `src/app` hanya "kulit tipis" berisi route; isi layar ada di `features/<nama>/components`. Untuk fitur baru yang punya data sendiri, ikuti [add-a-feature-module.md](./add-a-feature-module.md). Panduan ini untuk menambah **satu layar** ke fitur yang sudah ada atau layar sederhana.

## 1. Buat komponen layar

`src/features/<fitur>/components/<nama>-screen.tsx`. Gunakan `StickyScreen` agar header tersemat dan gaya konsisten.

```tsx
import { BackButton } from "@/components/back-button";
import { ScreenHeader } from "@/components/screen-header";
import { StickyScreen } from "@/components/sticky-screen";
import { usePartner } from "../hooks/use-partner";

export function PartnerScreen() {
  const { data, setSharing } = usePartner();

  return (
    <StickyScreen
      header={
        <>
          <BackButton />
          <ScreenHeader title="Partner" />
        </>
      }
    >
      {data ? /* ...isi... */ null : null}
    </StickyScreen>
  );
}
```

Panduan tata letak:

| Situasi | Yang dipakai |
|---|---|
| Layar turunan (di-`push`) | `edges` default (`["top","bottom"]`), `BackButton` di header |
| Layar tab | `edges={["top"]}` dan `bottomPadding={useTabBarClearance()}` |
| Form dengan keyboard | `keyboardAvoiding` |
| Tombol simpan menempel di bawah | `footer={...}` |
| Bagian yang harus melebar penuh (baris chip) | `StickyBleed` di dalam `header` |

Ambil warna, font, dan radius dari `@/constants/theme`, dan komponen dari [04-components](../04-components/README.md) sebelum membuat yang baru.

## 2. Buat route

File di `src/app/` (path file = URL). Isinya hanya memasang layar:

```tsx
// src/app/settings/partner.tsx  →  /settings/partner
import { PartnerScreen } from "@/features/partner/components/partner-screen";

export default function PartnerRoute() {
  return <PartnerScreen />;
}
```

Route dinamis dan parameter:

```tsx
// src/app/specialists/[id].tsx  →  /specialists/123
import { useLocalSearchParams } from "expo-router";

export default function SpecialistDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SpecialistDetailScreen id={id} />;
}
```

Parameter query (`/check-in?mood=…`) dibaca dengan `useLocalSearchParams` juga.

## 3. Tempatkan di hierarki yang benar

| Kebutuhan | Letakkan di |
|---|---|
| Layar area login yang butuh sheet log / `LoggingProvider` | Di bawah `src/app/(app)/` (lihat catatan di bawah) atau tetap di root bila tak butuh |
| Layar Settings turunan | `src/app/settings/` |
| Modal | Daftarkan `<Stack.Screen name="…" options={{ presentation: "modal" }} />` di layout terdekat (contoh: `new-note` di `(app)/_layout.tsx`) |
| Layar yang tak boleh di-swipe kembali | `options={{ gestureEnabled: false }}` |

Catatan: sebagian route (`/notifications`, `/check-in`, `/articles`, dst.) saat ini berada di root `src/app`, bukan di dalam `(app)`. Bila layar baru perlu memanggil `useLogging()` (mis. membuka sheet log), letakkan di dalam `(app)` supaya `LoggingProvider` tersedia.

## 4. Sambungkan navigasi

Typed routes membuat path yang salah gagal saat `tsc`. Tipe route diperbarui otomatis ketika Metro berjalan.

```tsx
import { router } from "expo-router";
router.push("/settings/partner");
router.push({ pathname: "/specialists/[id]", params: { id: "123" } });
```

Menambah baris di menu Settings: tambahkan objek di `src/features/settings/menu.ts` dengan `href`:

```ts
{ id: "partner", label: "Partner", icon: UsersThree, iconTone: "primary", valueKey: "partner", href: "/settings/partner" }
```

Baris tanpa `href` tidak menavigasi ke mana pun (dipakai untuk baris yang membuka sheet).

## 5. Data layar

Layar tidak memanggil `fetch`. Gunakan hook fitur yang memanggil `xxxApi` ([add-an-endpoint.md](./add-an-endpoint.md)). Pola hook (load, `cancelled`, optimistic): [state-management.md](../02-architecture/state-management.md).

## Checklist

- [ ] Layar memakai `StickyScreen` dan token tema
- [ ] Route hanya memasang layar
- [ ] Ada jalan masuk (tombol / baris menu) dan tombol kembali
- [ ] Data lewat hook + `xxxApi`, bukan `fetch` / JSON langsung
- [ ] Kondisi memuat (data `null`) tidak membuat layar crash
- [ ] `npx tsc --noEmit` dan `npx expo lint` lolos ([quality-checks.md](../09-conventions/quality-checks.md))
- [ ] Peta route di [routing-and-navigation.md](../02-architecture/routing-and-navigation.md) diperbarui
