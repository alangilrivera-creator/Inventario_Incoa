// api/articulos.js
// Endpoint: /api/articulos
// GET     -> lista todos los artículos
// POST    -> crea un artículo nuevo          body: { nombre, serie }
// PUT     -> edita un artículo existente     body: { id, nombre, serie, estado }
// DELETE  -> elimina un artículo             query: ?id=123

import { sql } from '../lib/db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const articulos = await sql`SELECT * FROM articulos ORDER BY id ASC`;
      return res.status(200).json(articulos);
    }

    if (req.method === 'POST') {
      const { nombre, serie } = req.body || {};

      if (!nombre || !nombre.trim()) {
        return res.status(400).json({ error: 'El nombre del artículo es obligatorio.' });
      }
      if (!/^\d+$/.test(serie || '')) {
        return res.status(400).json({ error: 'El número de serie debe contener solo números.' });
      }

      const existente = await sql`SELECT id FROM articulos WHERE serie = ${serie}`;
      if (existente.length > 0) {
        return res.status(409).json({ error: 'Ya existe un artículo registrado con ese número de serie.' });
      }

      const [nuevo] = await sql`
        INSERT INTO articulos (nombre, serie, estado)
        VALUES (${nombre.trim()}, ${serie}, 'Disponible')
        RETURNING *
      `;
      return res.status(201).json(nuevo);
    }

    if (req.method === 'PUT') {
      const { id, nombre, serie, estado } = req.body || {};

      if (!id) return res.status(400).json({ error: 'Falta el id del artículo.' });
      if (!nombre || !nombre.trim()) {
        return res.status(400).json({ error: 'El nombre del artículo es obligatorio.' });
      }
      if (!/^\d+$/.test(serie || '')) {
        return res.status(400).json({ error: 'El número de serie debe contener solo números.' });
      }

      const duplicado = await sql`SELECT id FROM articulos WHERE serie = ${serie} AND id != ${id}`;
      if (duplicado.length > 0) {
        return res.status(409).json({ error: 'Ya existe un artículo registrado con ese número de serie.' });
      }

      const [actual] = await sql`SELECT * FROM articulos WHERE id = ${id}`;
      if (!actual) return res.status(404).json({ error: 'Artículo no encontrado.' });

      const nuevoEstado = estado || actual.estado;

      // Si se marca manualmente como Disponible, cerrar cualquier préstamo activo relacionado
      if (actual.estado === 'Prestado' && nuevoEstado === 'Disponible') {
        await sql`
          UPDATE prestamos SET estado = 'Devuelto', fecha_devolucion = now()
          WHERE articulo_id = ${id} AND estado = 'Prestado'
        `;
      }

      const [actualizado] = await sql`
        UPDATE articulos SET nombre = ${nombre.trim()}, serie = ${serie}, estado = ${nuevoEstado}
        WHERE id = ${id}
        RETURNING *
      `;
      return res.status(200).json(actualizado);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Falta el id del artículo.' });

      const [actual] = await sql`SELECT * FROM articulos WHERE id = ${id}`;
      if (!actual) return res.status(404).json({ error: 'Artículo no encontrado.' });
      if (actual.estado === 'Prestado') {
        return res.status(409).json({ error: 'No puedes eliminar un artículo que está actualmente prestado.' });
      }

      await sql`DELETE FROM articulos WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error del servidor. Intenta de nuevo.' });
  }
}
