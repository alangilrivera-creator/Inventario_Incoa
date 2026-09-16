// lib/db.js
// Conexión a la base de datos Neon usando el driver serverless oficial.
// La variable DATABASE_URL se configura en Vercel (Settings > Environment Variables)
// o en el archivo .env local para pruebas.

import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'Falta la variable de entorno DATABASE_URL. Configúrala en Vercel o en tu archivo .env'
  );
}

export const sql = neon(process.env.DATABASE_URL);
