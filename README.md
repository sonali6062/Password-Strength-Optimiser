# Password Strength Optimizer — Run locally

This project contains a small backend API and a frontend SPA. The backend now serves the frontend static files, so you can run everything from one process.

Prerequisites
- Node.js (16+ recommended) and npm installed

Quick start (recommended)
1. From the project root run:

```powershell
npm run install-all
npm start
```

2. Open http://localhost:3000 in your browser. The frontend and API are served on the same origin.

Alternative — run backend directly
1. Install dependencies and start backend:

```powershell
cd backend
npm install
npm start
```

Advanced — run frontend separately (not required)
If you'd rather run the frontend using a static server (for example during development):

```powershell
cd frontend
npx serve .
```

Notes
- The backend start command runs `node server.js` (see `backend/package.json`). The server listens on port 3000 and serves both API endpoints (under `/api`) and the frontend files.
- Frontend fetches the API via a relative path (`/api/checkPassword`) so both running on the same origin works correctly.
"# Password-Strength-Optimiser" 
