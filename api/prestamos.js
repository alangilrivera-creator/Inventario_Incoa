// api/prestamos.js
// Endpoint: /api/prestamos
// GET     -> lista todos los préstamos
// POST    -> crea un préstamo nuevo          body: { articuloId, persona, codigo, seccion }
// PUT     -> marca un préstamo como devuelto body: { id }
// DELETE  -> elimina un préstamo             query: ?id=123

import { sql } from '../lib/db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const prestamos = await sql`SELECT * FROM prestamos ORDER BY id ASC`;
      return res.status(200).json(prestamos);
    }

    if (req.method === 'POST') {
      const { articuloId, persona, codigo, seccion } = req.body || {};

      if (!articuloId) return res.status(400).json({ error: 'Selecciona un artículo disponible.' });
      if (!persona?.trim() || !codigo?.trim() || !seccion?.trim()) {
        return res.status(400).json({ error: 'Por favor completa Nombre, Código y Sección.' });
      }

      const [articulo] = await sql`SELECT * FROM articulos WHERE id = ${articuloId}`;
      if (!articulo || articulo.estado !== 'Disponible') {
        return res.status(409).json({ error: 'El artículo seleccionado ya no está disponible.' });
      }

      const [nuevo] = await sql`
        INSERT INTO prestamos (articulo_id, articulo_nombre, articulo_serie, persona, codigo, seccion, estado)
        VALUES (${articulo.id}, ${articulo.nombre}, ${articulo.serie}, ${persona.trim()}, ${codigo.trim()}, ${seccion.trim()}, 'Prestado')
        RETURNING *
      `;
      await sql`UPDATE articulos SET estado = 'Prestado' WHERE id = ${articulo.id}`;

      return res.status(201).json(nuevo);
    }

    if (req.method === 'PUT') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Falta el id del préstamo.' });

      const [prestamo] = await sql`SELECT * FROM prestamos WHERE id = ${id}`;
      if (!prestamo) return res.status(404).json({ error: 'Préstamo no encontrado.' });
      if (prestamo.estado === 'Devuelto') {
        return res.status(200).json(prestamo);
      }

      const [actualizado] = await sql`
        UPDATE prestamos SET estado = 'Devuelto', fecha_devolucion = now()
        WHERE id = ${id}
        RETURNING *
      `;
      await sql`UPDATE articulos SET estado = 'Disponible' WHERE id = ${prestamo.articulo_id}`;

      return res.status(200).json(actualizado);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Falta el id del préstamo.' });

      const [prestamo] = await sql`SELECT * FROM prestamos WHERE id = ${id}`;
      if (!prestamo) return res.status(404).json({ error: 'Préstamo no encontrado.' });

      if (prestamo.estado === 'Prestado') {
        await sql`UPDATE articulos SET estado = 'Disponible' WHERE id = ${prestamo.articulo_id}`;
      }
      await sql`DELETE FROM prestamos WHERE id = ${id}`;

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Método ${req.method} no permitido.` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error del servidor. Intenta de nuevo.' });
  }
}
