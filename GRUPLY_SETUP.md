# GRUPLY Ã‚Â· Setup rÃƒÂ¡pido (Windows + Supabase + Vercel)

## 1) Preparar variables de entorno
1. Copia `.env.example` Ã¢â€ â€™ `.env.local`.
2. Rellena:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (en local: `http://localhost:3005`)

> **Importante**: no subas `.env.local` a GitHub.

---

## 2) Arrancar en local (PowerShell)
En la carpeta del proyecto:

```powershell
npm install
npm run dev
```

Luego abre:
- `http://localhost:3005`

---

## 3) Supabase: SQL (tornos + chat)
En Supabase Ã¢â€ â€™ **SQL Editor** ejecuta, en este orden:

1) Torneos (columna `tiebreak_order` + defaults):
- `supabase/sql/SUPABASE_SQL_06_FIX_TOURNAMENT_TIEBREAK.sql`

2) Chat de grupo (tabla `group_messages` + RLS + Realtime):
- `supabase/sql/SUPABASE_SQL_07_GROUP_CHAT.sql`

> Si no ejecutas el SQL del chat, la app **no se rompe**: la pantalla de chat te mostrarÃƒÂ¡ un aviso de Ã¢â‚¬Å“chat no configuradoÃ¢â‚¬Â.

---

## 4) Deploy gratis en Vercel
1. Sube el proyecto a GitHub.
2. En Vercel: **New Project** Ã¢â€ â€™ importa el repo.
3. En **Environment Variables** aÃƒÂ±ade:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://TU-PROYECTO.vercel.app`
4. Deploy.

---

## 5) Checklist final
- Ã¢Å“â€¦ Crear grupo
- Ã¢Å“â€¦ Abrir un grupo Ã¢â€ â€™ pestaÃƒÂ±as funcionan
- Ã¢Å“â€¦ BotÃƒÂ³n Ã¢Å¡â„¢Ã¯Â¸Â en cabecera del grupo abre Ajustes
- Ã¢Å“â€¦ El chat solo se abre con el **icono flotante**
- Ã¢Å“â€¦ Crear evento + RSVP
- Ã¢Å“â€¦ Crear gasto + deudas
- Ã¢Å“â€¦ Torneos: lista y crea sin error de `tiebreak_order`

