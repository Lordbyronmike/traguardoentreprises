// Configuration front optionnelle
// Définir l'URL du Worker/API qui reçoit les messages de contact.
// Laisser vide pour désactiver l'envoi direct depuis le formulaire.
// Recommande en production: route Cloudflare sur le meme domaine -> "/api/contact"
// Alternative: URL absolue workers.dev (ex: "https://traguardo-contact.<subdomain>.workers.dev/api/contact")
window.CONTACT_ENDPOINT = "/api/contact";
