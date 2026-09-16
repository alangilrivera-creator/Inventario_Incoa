// Service worker mínimo: no cachea datos (la app siempre necesita conexión
// para leer/escribir en la base de datos), pero permite que el navegador
// ofrezca "Instalar app" / "Agregar a pantalla de inicio".
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
self.addEventListener('fetch', () => {
  // Sin caché: siempre va a la red.
});
