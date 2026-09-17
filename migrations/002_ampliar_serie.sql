-- Migración: quitar el límite de longitud del número de serie.
-- Ejecuta esto UNA VEZ en el SQL Editor de Neon (tu base de datos ya existente).
-- Es seguro: solo amplía el tamaño de la columna, no borra ni modifica datos existentes.

ALTER TABLE articulos ALTER COLUMN serie TYPE TEXT;
ALTER TABLE prestamos ALTER COLUMN articulo_serie TYPE TEXT;
