# TSIS.ai v1 - Trading Journal

## Resumen de Implementacion

```sh
C:\TSIS_Data\v1\
├── README.md            # Documentation
├── demo_trades.csv      # 756 demo trades from Xaviervue
├── docker-compose.yml   # PostgreSQL + TimescaleDB
├── .env.example         # Environment template
├── sql/                 # Database init scripts
├── backend/             # FastAPI application
│   └── app/
│       ├── main.py
│       ├── api/v1/endpoints/ (auth, trades, dashboard, risk_settings)
│       ├── core/ (security, config)
│       ├── models/ (user, trade, tag, risk_settings)
│       └── schemas/
└── frontend/            # Next.js 16 + React 19
    └── src/
        ├── app/ (login, register, dashboard, trades, calendar)
        ├── components/ui/
        └── lib/ (api.ts, auth.ts)
```

### Backend (FastAPI)

**Modelos:**
- `User` - Autenticacion con email/password
- `Trade` - Registro de operaciones
- `Tag` - Etiquetas para clasificar trades
- `RiskSettings` - Configuracion de riesgo por usuario

**API Endpoints:**

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Crear cuenta |
| POST | /api/v1/auth/login | Login (OAuth2) |
| GET | /api/v1/auth/me | Info del usuario actual |
| GET | /api/v1/trades | Listar trades (con filtros) |
| POST | /api/v1/trades | Crear trade |
| POST | /api/v1/trades/import | Importar CSV/Excel |
| PUT | /api/v1/trades/{id} | Actualizar trade |
| DELETE | /api/v1/trades/{id} | Eliminar trade |
| GET | /api/v1/dashboard/metrics | Metricas generales |
| GET | /api/v1/dashboard/calendar/{y}/{m} | Calendario mensual |
| GET | /api/v1/dashboard/tickers | Top tickers |
| GET | /api/v1/dashboard/timing | Analisis por hora |
| GET | /api/v1/risk-settings | Config de riesgo |
| PUT | /api/v1/risk-settings | Actualizar config |
| GET | /api/v1/risk-settings/calculator | Calculadora de position |

### Frontend (Next.js 16 + React 19)

**Paginas:**
- `/` - Landing page
- `/login` - Inicio de sesion
- `/register` - Crear cuenta
- `/dashboard` - Dashboard con metricas
- `/trades` - Lista de trades + importacion
- `/calendar` - Calendario mensual de rendimiento

### Datos Demo

Archivo: `00_CTO/excels/demo_trades.csv`

- 756 trades exportados de Xaviervue
- Total P&L: $4,737.87
- 137 tickers
- Rango: Apr 2023 - Dec 2024
- 554 Long / 202 Short

---

## Como Ejecutar

```bash
# 1. Base de datos
docker-compose up -d

# 2. Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# 3. Frontend
cd frontend
npm install
npm run dev
```

**URLs:**
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

## Probar

1. Crear cuenta en `/register`
2. Importar `demo_trades.csv` en `/trades`
3. Ver metricas en `/dashboard`
4. Ver calendario en `/calendar`
