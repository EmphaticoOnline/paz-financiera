# Paz Financiera 💰

Aplicación para el control de compras a meses sin intereses y flujo mensual de pagos.

## 🚀 Configuración Inicial en PC (Windows)

### 1. Clonar el repositorio
```bash
cd c:/OpenSource
git clone https://github.com/EmphaticoOnline/paz-financiera.git
cd paz-financiera
```

### 2. Configurar el Backend
```bash
cd backend
copy .env.example .env
```

**Edita el archivo** `c:/OpenSource/paz-financiera/backend/.env` con tus credenciales:
```env
DB_HOST=148.113.192.7
DB_USER=postgres
DB_PASS=Avko7tp3
DB_NAME=paz_financiera
PORT=5432
```

### 3. Instalar dependencias del Backend
```bash
npm install
```

### 4. Instalar dependencias del Frontend
```bash
cd ../frontend
npm install
```

## 🏃 Ejecutar la Aplicación

### En Windows (PC)
**Terminal 1 - Backend:**
```bash
cd c:/OpenSource/paz-financiera/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd c:/OpenSource/paz-financiera/frontend
npm run dev
```

### En macOS (Mac)
**Terminal 1 - Backend:**
```bash
cd /Users/antoniodiaz/OpenSource/paz-financiera/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /Users/antoniodiaz/OpenSource/paz-financiera/frontend
npm run dev
```

## 🔄 Sincronización entre Mac y PC

### Antes de trabajar (SIEMPRE):
```bash
# En PC:
cd c:/OpenSource/paz-financiera
git pull origin main

# En Mac:
cd /Users/antoniodiaz/OpenSource/paz-financiera
git pull origin main
```

### Después de trabajar:
```bash
# En PC:
cd c:/OpenSource/paz-financiera
git add .
git commit -m "Descripción de los cambios"
git push origin main

# En Mac:
cd /Users/antoniodiaz/OpenSource/paz-financiera
git add .
git commit -m "Descripción de los cambios"
git push origin main
```

## ⚠️ Importante

- El archivo `.env` **NO se sube a GitHub** por seguridad
- Debes configurarlo manualmente en cada máquina
- **Siempre** ejecuta `git pull` antes de empezar a trabajar
- **Siempre** haz `git push` cuando termines para que los cambios estén disponibles en la otra máquina

## 📁 Estructura del Proyecto

```
paz-financiera/
├── backend/              # Servidor Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── index.ts      # Servidor principal
│   │   ├── db.ts         # Configuración de base de datos
│   │   └── routes/       # Rutas de la API
│   └── .env              # Credenciales (NO se sube a GitHub)
├── frontend/             # Aplicación React + TypeScript + Vite
│   └── src/
│       ├── pages/        # Páginas de la aplicación
│       └── components/   # Componentes reutilizables
└── README.md             # Este archivo
```

## 🌐 URLs de la Aplicación

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000
- **Repositorio GitHub:** https://github.com/EmphaticoOnline/paz-financiera.git

## 🚢 Deploy a producción

```bash
npm run deploy         # compila, respalda y publica (frontend + backend)
npm run deploy:check   # solo compila y verifica en local; no toca el servidor
```

`scripts/deploy.sh` ejecuta, deteniéndose en el primer error:

1. Verifica acceso SSH a `ubuntu@148.113.192.7`, `rsync` y `pm2` remoto.
2. Compila frontend (`tsc -b && vite build`) y backend (`tsc`).
3. Verifica que `.env.production` use `VITE_API_URL=/api` y que el bundle no contenga URLs de desarrollo.
4. Respalda `frontend/` y `backend/dist/` en `/var/www/paz-financiera/backups/<fecha>/`.
5. Publica con rsync `frontend/dist/` → `frontend/` y `backend/dist/` → `backend/dist/` (`--delete` solo en `frontend/assets/` y `backend/dist/`; la raíz de `frontend/` se sincroniza sin borrar, y nunca se toca `src`, `.git`, `.env` ni `node_modules`).
6. Si `backend/dist` cambió, reinicia solo `paz-financiera-api` con PM2.
7. Verifica `https://paz-financiera.emphasys.cloud/`, el bundle JS, `/api/tarjetas` y el proceso PM2; si falla, restaura el respaldo.

No instala dependencias del servidor: si `backend/package-lock.json` difiere del remoto, avisa.
