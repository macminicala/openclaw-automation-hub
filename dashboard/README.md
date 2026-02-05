# Automation Hub Dashboard

Dashboard moderno per la gestione delle automazioni, costruito con Next.js 14 + shadcn/ui.

## Struttura

```
dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main dashboard
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── header.tsx         # Header con stats
│   │   ├── automations-list.tsx  # Lista automazioni
│   │   └── builder/           # Step-by-step builder
│   │       ├── index.tsx
│   │       ├── step-indicator.tsx
│   │       ├── trigger-step.tsx
│   │       ├── action-step.tsx
│   │       └── review-step.tsx
│   └── lib/
│       └── utils.ts          # cn helper
```

## Comandi

```bash
# Avvia server di sviluppo
npm run dev

# Build per produzione
npm run build

# Avvia server di produzione
npm start
```

## API

Il frontend comunica con il backend esistente su `http://localhost:18799/api/`:

- `GET /api/automations` - Lista automazioni
- `POST /api/automations` - Crea automazione
- `PUT /api/automations/:id` - Modifica automazione
- `DELETE /api/automations/:id` - Elimina automazione
- `POST /api/automations/:id/toggle` - Attiva/Disattiva

## Trigger & Azioni

### Trigger (in italiano)
- Schedule → "Schedule"
- Webhook → "HTTP Request"
- File → "Monitora File"
- Email → "Email"
- Calendar → "Calendario"
- System → "Sistema"

### Azioni (in italiano)
- Shell → "Esegui Comando Terminale"
- AI Agent → "Assistente AI"
- Git → "Git (auto-commit)"
- Notify → "Notifica"
- Email → "Email"
