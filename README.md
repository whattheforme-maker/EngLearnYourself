# English Learn Yourself

Ingliz tili so'zlarini yodlash uchun shaxsiy lug'at va mini-o'yinlar (LinDuo English uslubida):
vizual kartochkalar, brauzer TTS orqali talaffuz va 4 xil o'yin rejimi.

## Texnologiyalar

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript**, **Tailwind CSS 4**
- **PostgreSQL** + **Drizzle ORM**
- ESLint 9 (flat config)

## O'yin rejimlari

| Rejim | Tavsif |
| --- | --- |
| `quiz` | To'rt variantli test (inglizcha → o'zbekcha) |
| `listening` | Eshitib tanlash (brauzer TTS talaffuzi) |
| `spelling` | So'zni yozib kiritish (imlo) |
| `truefalse` | To'g'ri / noto'g'ri tarjimani aniqlash |

## Ishga tushirish

```bash
npm install

# 1) PostgreSQL'da bo'sh baza yarating, so'ng .env faylini to'ldiring
copy .env.example .env

# 2) Jadvallarni yaratish (words, app_stats)
npm run db:push

# 3) Dev serverni ishga tushirish
npm run dev
```

Brauzerda: <http://localhost:3000>

## Skriptlar

| Buyruq | Vazifasi |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Production serverni ishga tushirish |
| `npm run lint` | ESLint tekshiruvi |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:push` | Drizzle sxemasini bazaga qo'llash |

## API

| Yo'l | Vazifasi |
| --- | --- |
| `GET /api/health` | Baza bilan aloqani tekshirish |
| `GET /api/game?mode=quiz&count=10&weak=1` | O'yin savollarini yaratish |
| `GET /api/words`, `POST /api/words` | Lug'at ro'yxati / yangi so'z qo'shish |
| `PATCH /api/words/:id`, `DELETE /api/words/:id` | So'zni tahrirlash / o'chirish |
| `GET /api/stats` | Statistika snapshot'i |
| `POST /api/session` | O'yin natijasini saqlash |

## Tuzilma

```
src/
  app/         # sahifalar va API marshrutlari (App Router)
  components/  # UI komponentlari
  db/          # Drizzle sxemasi va PostgreSQL ulanishi
  lib/         # o'yin logikasi, statistika, TTS, seed, yordamchilar
```

Birinchi ochilishda `src/lib/seed.ts` demo lug'atni (16 ta so'z) avtomatik yuklaydi.
