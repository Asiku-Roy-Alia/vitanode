# MyHealth Uganda - Web Application

React-based web application for the MyHealth Uganda patient-centered digital records platform. Built with Vite and React Router, consuming the Django REST API.

## What You Get

The application supports three user types with tailored experiences.

**Patients** get a complete health wallet with their encounters, lab results, medications, and documents. They can upload new documents, generate QR codes to share records with providers, and export their full FHIR bundle for portability.

**Providers** can scan or paste a patient's QR token to gain scoped, time-limited access to their records. Every access is automatically logged in the immutable audit trail.

**Administrators** see platform-wide analytics including patient counts, encounter volumes, QR sharing metrics, and encounter breakdowns by type.

## Prerequisites

You need Node.js 18 or later and the MyHealth Uganda Django backend running on port 8000. See the backend README for Django setup instructions.

## Local Development Setup

Navigate into the frontend folder and install dependencies.

```bash
cd frontend
npm install
```

Copy the environment template. The default points to the Django backend on localhost port 8000, which matches the backend's default configuration.

```bash
cp .env.example .env
```

Start the development server. It runs on port 3000 with hot module reloading.

```bash
npm run dev
```

Open your browser to `http://localhost:3000`. You will be redirected to the login page.

## Running Both Servers Together

You need both the Django backend and the Vite frontend running simultaneously. Open two terminal windows.

In the first terminal, start Django from the project root.

```bash
cd myhealth
source venv/bin/activate  # if you're using a virtualenv
python manage.py runserver
```

In the second terminal, start Vite from the frontend folder.

```bash
cd myhealth/frontend
npm run dev
```

The frontend at `http://localhost:3000` will automatically proxy API calls to Django at `http://localhost:8000`. CORS is already configured on the Django side.

## Demo Credentials

Use these credentials for immediate access. All demo passwords are the same for simplicity during testing.

| Role | Username | Password | Use Case |
|---|---|---|---|
| System Admin | admin | admin1234 | Platform analytics, all data access |
| Provider | dr.mukasa | demo1234 | Scan QR codes, view patient records |
| Provider | dr.nambi | demo1234 | Obstetrics specialist view |
| Provider | dr.okot | demo1234 | Paediatrics specialist view |
| Nurse | nurse.apio | demo1234 | General nursing workflow |

For patient accounts, check the Django admin panel at `http://localhost:8000/admin/` to see all 25 seeded patients. Their usernames follow the pattern `patient.firstname.lastname.N` and all use `demo1234`.

## Page Reference

The application is organised around role-specific dashboards with shared navigation.

**Login page** provides a split-panel design with marketing content on the left and the sign-in form on the right. Demo credentials are displayed inline to speed up testing.

**Registration page** collects first name, last name, username, email, phone number, and password. New accounts are automatically given the patient role and a linked Patient profile.

**Dashboard** adapts to the user's role. Patients see their health summary with stat cards, the QR sharing call-to-action, recent encounters, active medications, and the latest lab results. Providers see a prominent QR verification card with guidance on their responsibilities. Administrators see analytics with patient counts and encounter breakdowns.

**Encounters page** lists all clinical visits with filtering by type. Each card shows the encounter type, diagnosis, facility, provider, and date. Clicking a card opens the detailed view.

**Encounter detail** displays all data associated with a single visit. Vitals appear in a responsive grid. Lab results show in a table with abnormal flags. Medications list with doses, frequencies, and prescriber notes. Diagnosis codes display as badges.

**Lab results page** groups results by test name and shows the latest value prominently. Historical values appear in a per-test table. A filter toggle lets users see only abnormal results.

**Medications page** lists all prescriptions with active status indicators. Each medication card shows dose, frequency, route, duration, and prescriber notes. A filter shows only currently active medications.

**Documents page** provides upload functionality and a grid view of all uploaded files. Users can upload PDFs and images, categorise them by type, add titles and descriptions, and delete their own uploads.

**Share QR page** is the core patient empowerment feature. Users pick which data categories to share and how long the token lasts. The generated QR code displays with a live countdown timer. Active consent grants appear in a table with revoke buttons.

**Verify QR page** is the provider-facing flip side. Providers paste the token or full URL from a patient's QR and receive scoped access with an expiry time. The accepted session shows the patient name, UUID, and authorized data categories.

**Profile page** lets users edit their account information, view read-only fields like UUID and role, and export their complete medical record as a FHIR bundle JSON file.

## Authentication Architecture

The frontend uses JWT tokens stored in localStorage, matching the Django SimpleJWT configuration on the backend.

Access tokens last 30 minutes and refresh tokens last 7 days with automatic rotation. An axios interceptor attaches the access token to every API request. When a 401 response comes back, a second interceptor attempts to refresh the token using the refresh token. If refresh succeeds, the original request retries automatically. If refresh fails, the user is redirected to the login page.

Concurrent 401 responses are deduplicated through a refresh queue so multiple failing requests do not trigger multiple refresh attempts.

## Styling Philosophy

The design uses a forest green and gold palette with cream backgrounds. Typography pairs Fraunces, a contemporary serif, for headings with Inter, a neutral sans-serif, for body text. No Tailwind, no component libraries, no heavy CSS frameworks. Just a single global stylesheet with CSS variables and utility classes for spacing, grids, and badges.

Colours are defined as CSS custom properties in the root selector, making theme adjustments trivial. The design system uses a consistent 8-pixel spacing scale, 12-pixel border radii, and a warm white surface colour for cards against the cream background.

## Production Build

Build the optimised production bundle with the following command.

```bash
npm run build
```

Output goes to the `dist/` folder. A typical build produces a 270 KB JavaScript bundle that gzips to about 83 KB, plus a 5 KB CSS bundle. Serve the dist folder through any static host or behind your Django application using the `whitenoise` middleware.

Preview the production build locally.

```bash
npm run preview
```

## Troubleshooting

**Login fails with network error** means your Django backend is not running. Check that `http://localhost:8000/health/` returns JSON in your browser.

**CORS errors in the console** mean your Django CORS configuration is out of sync. Check that your `.env` file for Django contains `CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000` and restart Django.

**401 errors on every request** usually means your access token has expired and the refresh token is also invalid. Clear localStorage in your browser devtools and log in again.

**Blank page with no errors** might mean the Vite dev server port is different from what's expected. Check the terminal output for the actual port and update your bookmarks.

**Upload fails silently** usually means the file exceeds the default Django upload size. Increase `DATA_UPLOAD_MAX_MEMORY_SIZE` in your Django settings if you need to handle larger files.

## Browser Support

The application targets modern evergreen browsers including Chrome, Edge, Firefox, and Safari from 2023 onwards. It uses modern JavaScript features including optional chaining, nullish coalescing, and ES modules. Internet Explorer is not supported.

## Next Steps

The next phase of frontend development should add the Progressive Web App manifest and service worker for offline functionality, camera-based QR scanning for providers using the WebRTC API, push notifications when patients share records with providers, and a responsive mobile layout optimised for the Android devices common in Uganda.
