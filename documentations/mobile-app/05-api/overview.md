# Lapisan API

Backend belum ada, tetapi semua fitur sudah dipisahkan dari sumber datanya. UI tidak pernah memanggil `fetch` atau membaca JSON dummy secara langsung; ia hanya memanggil objek `xxxApi`.

## Tiga file per fitur

```
features/articles/api/
├─ articles-api.ts        Interface ArticlesApi + saklar
├─ dummy-articles-api.ts  Implementasi dummy (memori / JSON)
├─ http-articles-api.ts   Implementasi backend asli (fetch)
└─ config.ts              export const USE_DUMMY_ARTICLES = true
```

`articles-api.ts` mendefinisikan kontrak sekaligus memilih implementasinya:

```ts
export interface ArticlesApi {
  list(query?: ArticleQuery): Promise<ArticleListResponse>;
  getDetail(id: string): Promise<ArticleDetail>;
  setBookmarked(id: string, bookmarked: boolean): Promise<void>;
}

export const articlesApi: ArticlesApi = USE_DUMMY_ARTICLES ? dummyArticlesApi : httpArticlesApi;
```

Komentar di atas interface mencatat endpoint HTTP yang dimaksud, jadi file ini sekaligus menjadi spesifikasi untuk tim backend. Ringkasan semua endpoint: [endpoints.md](./endpoints.md).

Hook fitur (`hooks/use-xxx.ts`) memanggil `articlesApi.*`, tidak pernah `dummy…` atau `http…` secara langsung. Itu sebabnya mengganti backend tidak mengubah UI.

## Saklar dummy ↔ backend

| Flag | File | Mengatur |
|---|---|---|
| `USE_DUMMY_API` | `src/config/api.ts` | Check-in, Connected devices, Doctor report, Partner, Privacy & security, Tracking mode, Treatment |
| `USE_DUMMY_ARTICLES` | `features/articles/api/config.ts` | Articles |
| `USE_DUMMY_CALENDAR` | `features/calendar/api/config.ts` | Calendar |
| `USE_DUMMY_COMMUNITY` | `features/community/api/config.ts` | Community |
| `USE_DUMMY_INSIGHTS` | `features/insights/api/config.ts` | Insights |
| `USE_DUMMY_LOGGING` | `features/logging/api/config.ts` | Log sheets & New note |
| `USE_DUMMY_NOTIFICATIONS` | `features/notifications/api/config.ts` | Notifications |
| `USE_DUMMY_SETTINGS` | `features/settings/api/config.ts` | Settings (profil, siklus, satuan, FAQ, kebijakan privasi, feedback) |
| `USE_DUMMY_SPECIALISTS` | `features/specialists/api/config.ts` | Find a specialist |

Semuanya bernilai `true`. Flag terpisah per fitur memungkinkan backend dinyalakan **bertahap**, satu fitur per satu.

## Implementasi dummy

- Menyimpan perubahan di memori (hilang saat app restart).
- Menambahkan `delay(ms)` dari `src/utils/http.ts` untuk meniru latensi jaringan.
- Meniru perilaku server: pencarian dan filter dijalankan di dalam dummy (bukan di UI), tanggal dihitung relatif terhadap hari ini.
- Data statis besar disimpan sebagai JSON (`dummy-*.json`, `data/*.json`). Sisanya ditulis langsung di `dummy-*-api.ts`.

Daftar lengkap lokasi data dummy: [dummy-data-and-credentials.md](../01-getting-started/dummy-data-and-credentials.md).

## Implementasi HTTP

`http-*-api.ts` sudah lengkap secara bentuk (method, path, query, body) dan memakai helper `request<T>()`:

```ts
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status} ${path}`);
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}
```

Aturan yang berlaku untuk semua endpoint:

| Aspek | Aturan |
|---|---|
| Format | JSON (`Content-Type: application/json`) |
| Base URL | `EXPO_PUBLIC_API_URL` |
| Sukses tanpa isi | `204 No Content` → helper mengembalikan `undefined` |
| Gagal | Status non-2xx → `Error("Request failed: <status> <path>")` |
| Daftar | Dibungkus `{ data: [...] }` bila hanya berisi array (specialists, faqs, notifications) |
| Toggle | `PATCH` dengan `{ key, enabled }`, atau `PUT` / `DELETE` bila resource-nya sendiri (bookmark, hug) |
| Autentikasi | Belum ada. Lihat [auth.md](./auth.md) |

Helper HTTP belum seragam:

| Cara | Fitur |
|---|---|
| Memakai `request()` bersama dari `@/utils/http` | Check-in, Connected devices, Doctor report, Partner, Privacy & security, Tracking mode, Treatment |
| Salinan `request()` lokal di file `http-*-api.ts` | Articles, Community, Logging, Notifications, Settings, Specialists |
| `fetch` langsung dengan `BASE_URL` sendiri | Calendar, Insights |

Saat backend disambungkan, samakan semuanya ke `@/utils/http` agar Base URL dan token cukup diatur di satu tempat ([switching-to-real-backend.md](./switching-to-real-backend.md#1-satukan-helper-request)).

## Pengecualian

Tiga fitur dibuat sebelum pola ini ada dan memakai `services/`, bukan `api/`:

| Fitur | File | Status |
|---|---|---|
| Home | `features/home/services/home-api.ts` | `fetchHomeDashboard()` membaca JSON lokal. Belum ada interface / saklar |
| Onboarding | `features/onboarding/services/onboarding-api.ts` | `fetchOnboardingConfig()` dan `submitOnboarding()` (hanya log) |
| Auth | `features/auth/services/auth-api.ts` | `signUp`, `signIn`, `verifyEmailCode`, dll. (hanya log + validasi dummy) |

Ketiganya perlu dimigrasikan ke pola tiga file saat backend datang. Endpoint yang diharapkan tercantum di [endpoints.md](./endpoints.md#fitur-yang-belum-memakai-pola-api).

## Pemetaan DTO → model UI

Bila bentuk respons backend berbeda dari kebutuhan UI (snake_case, tanggal ISO string), pakai mapper. Contoh: `features/notifications/api/mappers.ts` mengubah `NotificationDto` menjadi `AppNotification`. Fitur lain memakai satu `types.ts` yang sama di kedua sisi. Lihat [feature-module-anatomy.md](../02-architecture/feature-module-anatomy.md#pola-pemisahan-dto--model-ui).
