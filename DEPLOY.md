# Production Deploy

This backend is ready to run behind `Nginx` with `PM2`.

## What you need before SSL

SSL from Let's Encrypt needs a real domain or subdomain pointed to the server.

Recommended:

- frontend: `bosoryn.mydomain.kz`
- backend: `api.bosoryn.mydomain.kz`

If you only use a raw IP, we can still publish the backend, but a normal Let's Encrypt certificate will not be available for that IP.

## Required server info

- server SSH user, for example `root` or `ubuntu`
- domain or subdomain for the backend
- production PostgreSQL credentials

## Recommended runtime

- Ubuntu 22.04 or 24.04
- Node.js 22 LTS
- PostgreSQL 16+
- Nginx
- PM2

## Production env

Create `.env` on the server from `.env.example` and set:

- `HOST=127.0.0.1`
- `PORT=3000`
- `TRUST_PROXY=true`
- `CORS_ORIGIN=https://frontend-domain.kz`
- `BASE_URL=https://api.your-domain.kz`
- `DB_SYNCHRONIZE=false`

Also fill:

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `SMTP_*`

## Server steps

### 1. Install system packages

```bash
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 2. Clone project

```bash
git clone git@github.com:utep0v/bosoryn-backend.git
cd bosoryn-backend
npm ci
npm run build
```

### 3. Create production env

```bash
cp .env.example .env
```

Edit `.env` with production values.

### 4. Start backend with PM2

```bash
pm2 start ecosystem.config.cjs --update-env
pm2 save
pm2 startup
```

### 5. Add Nginx config

Copy `deploy/nginx/bosoryn-backend.conf.example` to:

```bash
/etc/nginx/sites-available/bosoryn-backend.conf
```

Then replace `api.your-domain.kz` with your real backend domain, enable it, and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/bosoryn-backend.conf /etc/nginx/sites-enabled/bosoryn-backend.conf
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Issue SSL certificate

```bash
sudo certbot --nginx -d api.your-domain.kz
```

## Deploy update flow

```bash
git pull
npm ci
npm run build
pm2 restart bosoryn-backend --update-env
```

## Smoke checks

```bash
curl -s http://127.0.0.1:3000/health
curl -s https://api.your-domain.kz/health
```
