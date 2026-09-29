# Menambah endpoint ke fitur yang ada

Contoh: menambah aksi "arsipkan artikel" ke fitur Articles: `POST /articles/:id/archive` → `204`.

Empat tempat berubah, selalu dalam urutan ini. UI tidak menyentuh `fetch`.

## 1. Interface + komentar endpoint

`features/articles/api/articles-api.ts`

```ts
/**
 *   GET    /articles?q=<text>&category=<id|all> -> ArticleListResponse
 *   GET    /articles/:id                        -> ArticleDetail
 *   PUT    /articles/:id/bookmark               -> 204
 *   DELETE /articles/:id/bookmark               -> 204
 *   POST   /articles/:id/archive                -> 204
 */
export interface ArticlesApi {
  // ...
  archive(id: string): Promise<void>;
}
```

Komentar ini adalah spesifikasi untuk tim backend, jadi selalu ikut diperbarui.

## 2. Tipe

Tambahkan tipe request/respons di `features/articles/types.ts` bila ada. Untuk `204` tidak perlu tipe respons.

## 3. Implementasi dummy dan HTTP

Keduanya **wajib** mengikuti interface (TypeScript akan menolak bila ada yang lupa).

```ts
// dummy-articles-api.ts
async archive(id) {
  await delay(200);
  archived.add(id);          // ubah state memori, meniru server
},

// http-articles-api.ts
archive: (id) => request<void>(`/articles/${id}/archive`, { method: "POST" }),
```

Perilaku dummy harus meniru server: bila server memfilter atau menghitung sesuatu, lakukan juga di dummy, bukan di UI.

## 4. Hook dan UI

```ts
// hooks/use-articles.ts
const archive = useCallback(async (id: string) => {
  await articlesApi.archive(id);
  // perbarui state lokal atau muat ulang
}, []);
```

Aksi yang mengubah toggle sebaiknya **optimistic** dengan rollback bila gagal:

```ts
const apply = (v: boolean) => setData((cur) => (cur ? { ...cur, [key]: v } : cur));
apply(next);
try { await api.set(key, next); } catch { apply(!next); }
```

Lalu sambungkan aksi ke komponen lewat props (komponen kecil tidak memanggil API sendiri).

## Konvensi endpoint

| Jenis aksi | Bentuk |
|---|---|
| Ambil data layar | `GET /<sumber>` mengembalikan satu objek yang cukup untuk layar itu |
| Ambil daftar | `GET /<sumber>?q=…&filter=…` → `{ data: [...] }`; pencarian/filter di server |
| Toggle atribut | `PATCH /<sumber>` dengan `{ key, enabled }` |
| Toggle relasi (bookmark, hug) | `PUT` untuk menyalakan, `DELETE` untuk mematikan |
| Aksi tanpa hasil | `POST /<sumber>/<aksi>` → `204` |
| Simpan | `POST` (baru) / `PATCH` (ubah) dengan body bertipe |

Key toggle adalah union string di `types.ts` (mis. `ShareKey`). Nilai yang sama harus dipakai backend.

## Setelah selesai

- Perbarui [05-api/endpoints.md](../05-api/endpoints.md).
- Bila perlu, perbarui data JSON dummy dan [dummy-data-and-credentials.md](../01-getting-started/dummy-data-and-credentials.md).
- `npx tsc --noEmit` dan `npx expo lint`.
