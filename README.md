# Sistema de Inventario y Préstamos — INCOA

Sistema web para registrar el inventario de artículos y sus préstamos. Ahora
guarda los datos en una base de datos real (Neon/Postgres) para que se pueda
usar desde cualquier celular o computadora con el mismo link, y que los datos
no se pierdan ni queden encerrados en un solo navegador.

## Qué cambió respecto a la versión original

- Antes: los datos se guardaban en `localStorage` (solo en el navegador de un
  dispositivo).
- Ahora: los datos se guardan en una base de datos en la nube (Neon), y la
  página web habla con esa base de datos a través de funciones en `/api`.
  Así, el bibliotecario puede entrar desde el celular, la tablet o la
  computadora y siempre ver la misma información actualizada.

## Estructura del proyecto

```
├── index.html          → página principal
├── css/styles.css       → estilos (sin cambios)
├── js/app.js            → lógica de la interfaz (ahora usa fetch a /api)
├── img/                 → logo
├── icons/               → íconos para instalar la app en el celular
├── manifest.json        → configuración para "Agregar a pantalla de inicio"
├── sw.js                → habilita la instalación como app
├── api/articulos.js     → endpoint para crear/editar/eliminar artículos
├── api/prestamos.js     → endpoint para registrar/devolver préstamos
├── lib/db.js            → conexión a Neon
└── schema.sql           → estructura de las tablas (ejecutar una sola vez en Neon)
```

---

## Guía de despliegue paso a paso

Vas a necesitar 3 cuentas **gratuitas**: GitHub, Neon y Vercel. Puedes crear
las tres usando tu mismo correo de Google en segundos.

### Paso 1 — Subir el proyecto a GitHub

1. Entra a https://github.com y crea una cuenta si no tienes (botón *Sign up*).
2. Ya con sesión iniciada, haz clic en el botón **+** (arriba a la derecha) →
   **New repository**.
3. Ponle de nombre, por ejemplo, `inventario-prestamos-incoa`. Déjalo en
   **Public** o **Private** (cualquiera funciona con Vercel). Clic en
   **Create repository**.
4. En la página del repositorio recién creado, busca el botón
   **Add file → Upload files**.
5. Arrastra **todos** los archivos y carpetas de esta carpeta del proyecto
   (tal como están, respetando la estructura de carpetas `api/`, `css/`,
   `js/`, etc.) y haz clic en **Commit changes**.

   > Alternativa para quien use Git desde la terminal:
   > ```bash
   > git init
   > git add .
   > git commit -m "Primera versión"
   > git branch -M main
   > git remote add origin https://github.com/TU-USUARIO/inventario-prestamos-incoa.git
   > git push -u origin main
   > ```

### Paso 2 — Crear la base de datos en Neon

1. Entra a https://neon.tech y crea una cuenta gratis (puedes usar tu cuenta
   de Google/GitHub).
2. Crea un **nuevo proyecto** (te va a pedir un nombre; puedes poner
   `incoa-inventario`) y una región (elige la más cercana, por ejemplo
   *US East*).
3. Al crearse el proyecto, Neon te muestra una **cadena de conexión**
   (Connection string), algo como:
   `postgresql://usuario:password@ep-xxxxx.neon.tech/neondb?sslmode=require`
   **Cópiala y guárdala** — la vas a necesitar en el Paso 3.
4. En el menú lateral de Neon, busca **SQL Editor**.
5. Abre el archivo `schema.sql` de este proyecto, copia todo su contenido, y
   pégalo en el SQL Editor de Neon. Haz clic en **Run** (Ejecutar).
   Esto crea las tablas `articulos` y `prestamos`. Solo se hace **una vez**.

### Paso 3 — Publicar en Vercel y conectarlo con Neon

1. Entra a https://vercel.com y crea una cuenta gratis usando **tu cuenta de
   GitHub** (así quedan conectados automáticamente).
2. Haz clic en **Add New → Project**.
3. Busca y selecciona el repositorio `inventario-prestamos-incoa` que
   subiste en el Paso 1, y haz clic en **Import**.
4. Antes de darle a "Deploy", abre la sección **Environment Variables** y
   agrega:
   - **Name:** `DATABASE_URL`
   - **Value:** (pega aquí la cadena de conexión que copiaste de Neon)
5. Haz clic en **Deploy**. Espera 1–2 minutos.
6. Cuando termine, Vercel te da un link como:
   `https://inventario-prestamos-incoa.vercel.app`
   Ese es el link que va a usar el bibliotecario. Ábrelo y prueba registrar
   un artículo para confirmar que todo funciona.

> Tip: en Vercel también existe una integración directa "Neon" en la pestaña
> **Storage** del proyecto, que crea la base de datos y configura la variable
> `DATABASE_URL` automáticamente por ti, sin copiarla a mano. Si la usas, el
> nombre de la variable puede llamarse distinto (por ejemplo
> `POSTGRES_URL` o similar); en ese caso solo renombra la variable a
> `DATABASE_URL` en el mismo panel de Vercel, o cambia esa línea en
> `lib/db.js`.

### Paso 4 — Poner el acceso directo en el celular del bibliotecario

Con el link de Vercel abierto en el navegador del celular:

**En Android (Chrome):**
1. Abre el link.
2. Toca el menú de tres puntos (⋮) arriba a la derecha.
3. Selecciona **"Instalar app"** o **"Agregar a pantalla de inicio"**.
4. Confirma. Va a aparecer un ícono como cualquier otra app.

**En iPhone (Safari):**
1. Abre el link en Safari (tiene que ser Safari, no Chrome).
2. Toca el ícono de **Compartir** (el cuadro con la flecha hacia arriba).
3. Selecciona **"Agregar a pantalla de inicio"**.
4. Confirma. Va a aparecer el ícono en la pantalla principal.

Desde ese ícono, el bibliotecario abre la app directamente, sin escribir la
dirección cada vez.

---

## Mantenimiento

- **Actualizar el sistema:** si en el futuro quieres cambiar algo del código,
  edita los archivos en GitHub (o súbelos de nuevo) y Vercel vuelve a publicar
  automáticamente en 1–2 minutos.
- **Ver o respaldar los datos:** entra a tu proyecto en Neon → SQL Editor →
  puedes correr `SELECT * FROM articulos;` o `SELECT * FROM prestamos;` para
  ver todo lo registrado, o exportar los datos.
- **Costo:** los tres servicios (GitHub, Neon, Vercel) tienen un plan gratuito
  más que suficiente para el uso de una biblioteca escolar.
