-- Esquema de base de datos para el Sistema de Inventario y Préstamos INCOA
-- Ejecuta este archivo UNA VEZ en el editor SQL de Neon (SQL Editor)

CREATE TABLE IF NOT EXISTS articulos (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  serie TEXT UNIQUE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Disponible' CHECK (estado IN ('Disponible', 'Prestado'))
);

-- Nota: articulo_id NO tiene llave foránea a propósito. Los préstamos guardan
-- una copia del nombre/serie del artículo, así el historial de préstamos se
-- conserva completo aunque el artículo sea eliminado más adelante del inventario.
CREATE TABLE IF NOT EXISTS prestamos (
  id SERIAL PRIMARY KEY,
  articulo_id INTEGER,
  articulo_nombre TEXT NOT NULL,
  articulo_serie TEXT NOT NULL,
  persona TEXT NOT NULL,
  codigo TEXT NOT NULL,
  seccion TEXT NOT NULL,
  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado TEXT NOT NULL DEFAULT 'Prestado' CHECK (estado IN ('Prestado', 'Devuelto')),
  fecha_devolucion TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_prestamos_articulo_id ON prestamos(articulo_id);
CREATE INDEX IF NOT EXISTS idx_prestamos_estado ON prestamos(estado);
