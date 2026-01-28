# HardwareFlow

This repo contains the HardwareFlow internal MSP app inside the `hf/` folder.

## Quick start

```bash
cd hf
npm install
cp .env.example .env
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

See `hf/README.md` and `hf/ARCHITECTURE.md` for full details.
