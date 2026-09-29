# Data dummy & kredensial uji

Backend belum ada. Semua layar berjalan dengan **data dummy** lokal. Perilaku dummy dirancang mengikuti kontrak API, jadi mengganti ke backend asli tidak mengubah UI.

## Kredensial uji

Didefinisikan di `src/features/auth/dummy-credentials.ts`.

| Alur | Yang dimasukkan |
|---|---|
| **Log in** | Email `amara.putri@gmail.com`, password `Srikandi123!` |
| **Sign up** | Email apa saja (format valid), password ≥ 8 karakter, centang kedua persetujuan |
| **Verifikasi email (OTP)** | Kode `123456` (berlaku untuk email apa pun) |

Email/password yang salah di Log in menampilkan "Incorrect email or password"; kode OTP salah menampilkan "That code isn't right...". Untuk mematikan validasi dummy, set `DUMMY_AUTH.enabled = false`.

## Di mana data dummy berada

| Fitur | Sumber data dummy |
|---|---|
| Onboarding (form, loading, result) | `features/onboarding/data/onboarding-steps.json` |
| Home | `features/home/data/home-dashboard.json` |
| Log sheets & New note | `features/logging/data/logging-data.json` |
| Notifications | `features/notifications/api/dummy-notifications.json` |
| Specialists | `features/specialists/api/dummy-specialists.json` |
| Articles | `features/articles/api/dummy-articles.json` |
| Community | `features/community/api/dummy-community.json` |
| Settings (FAQ & privacy policy) | `features/settings/api/dummy-settings-content.json` |
| Calendar, Insights, Check-in, Tracking mode, Treatment, Partner, Doctor report, Connected devices, Privacy & security | Ditulis langsung di `api/dummy-*-api.ts` masing-masing |

## Sifat data dummy

- **Disimpan di memori.** Perubahan (toggle, centang, hug, dll.) bertahan selama app hidup dan **hilang saat app di-restart**.
- **Relatif terhadap hari ini.** Tanggal di Calendar, notifikasi, appointment, dan minggu check-in dihitung dari tanggal sekarang, sehingga demo selalu terlihat "hidup".
- **Saling terhubung** (meniru backend yang menghitung nilai tersebut):
  - Baris Settings (mis. "PCOS", "IUI · Day 5", "2 active", "App lock on") membaca dummy halaman tujuannya.
  - Kartu check-in di Home membaca status check-in dummy.
  - Log today, New note, dan sheet Mood/Symptom/Temperature berbagi satu state di `LoggingProvider`.
- **Prediksi Calendar** memakai siklus 28 hari yang berulang dari "hari ini = cycle day 14".

## Yang belum berfungsi sungguhan

Butuh backend atau modul native tambahan:

- Kamera & upload foto (foto profil, foto tes LH / kehamilan)
- Login sosial Google / Apple
- Biometrik / PIN app lock, ganti ikon app
- Notifikasi push & pengingat harian
- Peta nyata (peta di Find a specialist adalah ilustrasi)
- Fase "Two-week wait" dan layar terkait (ditunda sampai backend siap)

Daftar lengkap TODO: [known-limitations-and-todos.md](../09-conventions/known-limitations-and-todos.md).
