# Beralih ke backend asli

Panduan ini untuk saat backend (rencananya Supabase) siap. Prinsipnya: **UI tidak diubah**; yang berubah hanya lapisan `api/`.

## Ringkasan langkah

1. Satukan helper `request`.
2. Isi `EXPO_PUBLIC_API_URL` dan pasang token.
3. Nyalakan backend per fitur (flip flag).
4. Migrasikan Home, Onboarding, dan Auth ke pola `api/`.
5. Bersihkan kode dummy.

## 1. Satukan helper `request`

Saat ini ada tiga gaya HTTP (lihat [overview.md](./overview.md#implementasi-http)). Jadikan `src/utils/http.ts` satu-satunya:

```ts
// features/articles/api/http-articles-api.ts
import { request } from "@/utils/http";

export const httpArticlesApi: ArticlesApi = {
  list: ({ query = "", category = "all" } = {}) =>
    request<ArticleListResponse>(`/articles?${new URLSearchParams({ q: query, category })}`),
  // ...
};
```

Hapus `BASE_URL` dan `request` lokal di `http-articles-api.ts`, `http-community-api.ts`, `http-logging-api.ts`, `http-notifications-api.ts`, `http-settings-api.ts`, `http-specialists-api.ts`. Ubah `http-calendar-api.ts` dan `http-insights-api.ts` (yang memakai `fetch` inline) agar memanggil `request<T>()`.

## 2. Base URL dan token

Di `src/utils/http.ts`:

- `BASE_URL` sudah membaca `process.env.EXPO_PUBLIC_API_URL`. Isi di `.env` (lokal) atau di profil build EAS (lihat [eas-build.md](../07-build-and-release/eas-build.md)).
- Ambil access token dan tambahkan header `Authorization: Bearer <token>` (tempatnya sudah ditandai `TODO(backend)`). Cara mendapatkan token: [auth.md](./auth.md).
- Pertimbangkan penanganan `401`: coba refresh token sekali, bila gagal arahkan ke Log in.

`EXPO_PUBLIC_*` ikut ter-bundle ke aplikasi; jangan menaruh rahasia di sana.

## 3. Nyalakan per fitur

Ubah flag menjadi `false`. Urutan yang disarankan: dari yang paling sederhana dan tidak bergantung fitur lain.

| Urutan | Flag | Catatan |
|---|---|---|
| 1 | `USE_DUMMY_NOTIFICATIONS` | Sudah punya mapper DTO → UI |
| 2 | `USE_DUMMY_ARTICLES`, `USE_DUMMY_SPECIALISTS`, `USE_DUMMY_COMMUNITY` | Read-mostly + toggle sederhana |
| 3 | `USE_DUMMY_LOGGING`, `USE_DUMMY_CALENDAR`, `USE_DUMMY_INSIGHTS` | Sebaiknya dinyalakan bersamaan: ketiganya berbicara soal data siklus yang sama |
| 4 | `USE_DUMMY_SETTINGS` | Baris menu Settings membaca nilai dari fitur lain (lihat di bawah) |
| 5 | `USE_DUMMY_API` (`src/config/api.ts`) | Mengalihkan 7 fitur sekaligus. Bila perlu bertahap, pecah menjadi flag per fitur seperti yang lain |

Untuk tiap fitur:

1. Baca komentar endpoint di `xxx-api.ts` dan tipe di `types.ts`; cocokkan dengan backend.
2. Lengkapi `http-xxx-api.ts` bila ada yang belum sesuai.
3. Set flag ke `false`, jalankan app, uji layar terkait (termasuk kondisi gagal: matikan jaringan).

## 4. Migrasikan Home, Onboarding, Auth

Ketiganya belum memakai pola `api/` ([overview.md](./overview.md#pengecualian)). Untuk masing-masing:

1. Buat `features/<nama>/api/<nama>-api.ts` (interface + saklar), `dummy-…`, `http-…`, `config.ts`.
2. Pindahkan isi `services/` yang sekarang menjadi implementasi dummy. Data JSON tetap dipakai.
3. Ganti pemanggil (`use-home-dashboard.ts`, layout onboarding, layar auth) agar memakai objek `xxxApi`.
4. Hapus folder `services/`.

Auth ditangani terpisah karena menyangkut sesi: lihat [auth.md](./auth.md).

## 5. Ketergantungan antar layar yang harus dijaga backend

Dummy meniru hubungan berikut. Backend harus mengembalikan data yang konsisten:

| Yang dibaca | Dari |
|---|---|
| Nilai di baris Settings ("PCOS", "IUI · Day 5", "2 active", "App lock on") | `GET /settings/summary`, dihitung dari data Tracking mode, Treatment, Partner, Privacy |
| Kartu check-in Home (`selectedMoodId`, `streakDays`) | Sama dengan `GET /check-in/today` |
| Status "sudah dicatat" di Log today, isi awal sheet Mood/Symptom/Temperature, dan New note | `GET /logs/today` |
| Kalender dan Insights (ringkasan catatan) | `GET /calendar`, `GET /insights`; sebaiknya diturunkan dari catatan yang dikirim lewat `POST /logs` |

Layar Home dan Settings memuat ulang data saat kembali fokus (`useFocusEffect`), jadi perubahan dari layar lain terlihat tanpa aksi tambahan.

## 6. Pembersihan setelah semua fitur hidup

- Hapus `dummy-*-api.ts`, `dummy-*.json`, dan data JSON konten yang tidak lagi dipakai.
- Hapus flag `USE_DUMMY_*` dan `config.ts` terkait; sederhanakan `xxx-api.ts` menjadi `export const xxxApi: XxxApi = httpXxxApi`.
- Hapus `src/features/auth/dummy-credentials.ts` dan referensinya.
- Perbarui [dummy-data-and-credentials.md](../01-getting-started/dummy-data-and-credentials.md) dan [known-limitations-and-todos.md](../09-conventions/known-limitations-and-todos.md).

## Checklist

- [ ] `EXPO_PUBLIC_API_URL` diisi untuk development, preview, production
- [ ] Token terpasang di `request()`; `401` ditangani
- [ ] Setiap flag `USE_DUMMY_*` bernilai `false` dan layar diuji
- [ ] Kondisi gagal (offline, 500) menampilkan pesan yang jelas, bukan layar kosong
- [ ] Home, Onboarding, Auth dimigrasikan
- [ ] Kode dan data dummy dihapus
