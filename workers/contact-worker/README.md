# Worker contact Traguardo

Ce Worker recoit le formulaire de contact du front et envoie un email via Resend.

## Prerequis

- Un compte Cloudflare
- Un compte Resend avec domaine expediteur verifie
- Node.js + Wrangler sur ta machine de deploiement

## Variables

Secrets (via `wrangler secret put`):

- `RESEND_API_KEY`
- `CONTACT_FROM_EMAIL` (ex: `Traguardo <contact@ton-domaine.fr>`)
- `CONTACT_TO_EMAIL` (ex: `contact@traguardo.fr`)

Variables non sensibles (dans `wrangler.toml`):

- `ALLOWED_ORIGINS` (optionnel, liste CSV des origines autorisees)
- `CONTACT_SUBJECT_PREFIX`

## Lancer en local

Depuis ce dossier:

```bash
cp .dev.vars.example .dev.vars
npx wrangler dev
```

Le endpoint sera disponible sur `http://127.0.0.1:8787/api/contact`.

## Deployer

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CONTACT_FROM_EMAIL
npx wrangler secret put CONTACT_TO_EMAIL
npx wrangler deploy
```

## Brancher le front

Le front utilise `window.CONTACT_ENDPOINT` dans:

- `/Users/mickaelbembaron/Documents/GitHub/traguardoentreprises/config.js`

Par defaut il est configure sur `/api/contact` pour une route Cloudflare sur le meme domaine.
Si tu utilises une URL `workers.dev`, remplace la valeur par l'URL absolue:

```js
window.CONTACT_ENDPOINT = "https://traguardo-contact.<subdomain>.workers.dev/api/contact";
```
