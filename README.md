# Bosoryn Backend

`NestJS` backend for the school vacancy board, now connected to `PostgreSQL`.

## What is implemented

- Admin CRUD for `regions`, `schools`, `subjects`, `vacancies`
- Public vacancy list for the main site
- Public application submission with `fullName` and `phone`
- Dashboard summary with counts and recent applications
- Admin analytics for applications by region, subject, graduation year, and school
- Excel export for applications
- Filled referral `.docx` export for a selected application
- Conditional attachment upload for pedagogical vacancies
- School model extended with both `email` and `phone`
- Email notification pipeline prepared through SMTP
- WhatsApp notification pipeline connected through `Baileys`
- `PostgreSQL` persistence through `TypeORM`
- Automatic schema sync and initial seed for an empty database

## Environment

Create `.env` from `.env.example` and adjust values if needed.

## Start

```bash
npm install
npm run start:dev
```

Server runs on `http://localhost:3000` by default.

## Production

Production deployment files are included:

- [ecosystem.config.cjs](/Users/utepovnauryzbek/Developer/bosoryn/bosoryn-backend/ecosystem.config.cjs)
- [DEPLOY.md](/Users/utepovnauryzbek/Developer/bosoryn/bosoryn-backend/DEPLOY.md)
- [deploy/nginx/bosoryn-backend.conf.example](/Users/utepovnauryzbek/Developer/bosoryn/bosoryn-backend/deploy/nginx/bosoryn-backend.conf.example)

## Database env

- `DATABASE_URL`
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`
- `DB_SYNCHRONIZE`
- `DB_SSL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRES_IN`
- `BASE_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `WHATSAPP_ENABLED`
- `WHATSAPP_AUTH_DIR`
- `WHATSAPP_PAIRING_PHONE_NUMBER`
- `WHATSAPP_PRINT_QR`
- `WHATSAPP_LOG_LEVEL`
- `APPLICATION_UPLOAD_DIR`

## API overview

### Public routes

- `GET /public/vacancies`
- `GET /public/vacancies/filters`
- `POST /public/applications`

### Admin routes

- `GET|POST|PATCH|DELETE /regions`
- `GET|POST|PATCH|DELETE /schools`
- `GET|POST|PATCH|DELETE /subjects`
- `GET|POST|PATCH|DELETE /vacancies`
- `GET|DELETE /applications`
- `GET /applications/export`
- `GET /applications/:id/referral-document`
- `GET /applications/:id/attachment`
- `GET /dashboard`
- `GET /dashboard/analytics`

## Public application payload

Use `multipart/form-data`:

- `vacancyId`
- `fullName`
- `phone`
- `attachment`

`attachment` is required only when `vacancy.isPedagogical === true`.

## Email behavior

When a public application is created:

1. the application is saved in PostgreSQL;
2. the linked school is resolved through the vacancy;
3. the vacancy is closed right after the application is accepted, so it disappears from the public list;
4. email is sent to the school's `email`;
5. WhatsApp text message is sent to the school's `phone` through `Baileys`, if the WhatsApp session is connected.

If SMTP or WhatsApp env is not configured yet, the application still gets saved and the notification status is marked accordingly.

## WhatsApp via Baileys

The backend uses a linked WhatsApp Web session and stores auth state on disk.

To activate it:

1. Set `WHATSAPP_ENABLED=true`
2. Start the backend
3. Call `POST /whatsapp/pairing-code`
4. Link your sender WhatsApp account using the returned pairing code
5. Keep the auth folder from `WHATSAPP_AUTH_DIR`

Admin endpoints:

- `GET /whatsapp/status`
- `POST /whatsapp/pairing-code`

Message body includes:

- school
- region
- subject
- teaching language
- graduation year
- candidate full name
- candidate phone

## Verification

- `npm run build`
- `npm test -- --runInBand`
- `npm run lint`
