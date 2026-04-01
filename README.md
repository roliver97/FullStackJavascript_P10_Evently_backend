# 🎟️ Evently - Gestión de Eventos (Backend)

## Plataforma Full Stack Javascript - Proyecto 10 - RTC

> 📡 **API Base URL:** [https://evently-backend-p10.vercel.app/api/v1](https://evently-backend-p10.vercel.app/api/v1)

> ⚠️ **Nota:** Este repositorio contiene únicamente el código del **Backend**. Puedes encontrar la interfaz de usuario y la lógica de cliente en el [Repositorio del Frontend](https://github.com/roliver97/FullStackJavascript_P10_Evently_frontend).

API REST robusta construida con Node.js, Express y MongoDB para la gestión integral de eventos. El sistema implementa una arquitectura escalable con controladores dedicados, seguridad mediante JWT, gestión de relaciones complejas en la base de datos y almacenamiento de archivos en la nube a través de Cloudinary.

## 🚀 Tecnologías utilizadas

- - **Node.js & Express** - Entorno de ejecución y framework para la API REST.
- - **MongoDB & Mongoose** - Base de datos NoSQL y ODM (gestión de relaciones entre colecciones).
- - **JSON Web Token (JWT) & Bcrypt** - Autenticación segura, encriptación de contraseñas y control de sesiones.
- - **Cloudinary & Multer** - Subida, almacenamiento y gestión de imágenes (avatares y carteles).
- - **Dotenv** - Gestión de variables de entorno.

## 📂 Estructura del Proyecto

```text
📦 FullStackJavascript_P10_Evently_backend
 ┣ 📂 src
 ┃ ┣ 📂 api
 ┃ ┃ ┣ 📂 controllers  # Lógica de negocio (events.js, users.js)
 ┃ ┃ ┣ 📂 models       # Esquemas de Base de Datos relacionales
 ┃ ┃ ┗ 📂 routes       # Definición de endpoints
 ┃ ┣ 📂 config         # Conexión DB, Cloudinary y JWT
 ┃ ┣ 📂 data           # Datos estáticos para la seed
 ┃ ┣ 📂 middlewares    # Protecciones de ruta (auth.js, uploadFile.js)
 ┃ ┗ 📂 utils          # Funciones auxiliares (deleteFile.js)
 ┣ 📜 .env                  # Variables de entorno
 ┣ 📜 .gitignore            # Archivos ignorados
 ┣ 📜 index.js              # Servidor Express
 ┗ 📜 package.json          # Dependencias
```

## 🛠️ Instalación y Configuración

1.  **Clonar el repositorio:**

    ```bash
    git clone https://github.com/roliver97/FullStackJavascript_P10_Evently_backend.git
    cd FullStackJavascript_P10_Evently_backend
    ```

2.  **Instalar dependencias:**

    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**

Crea un archivo .env en la raíz con las siguientes claves:

    ```env
    PORT=3000
    DB_URL=mongodb+srv://usuario:password@cluster.mongodb.net/eventosDB
    JWT_SECRET=tu_clave_secreta_jwt
    CLOUDINARY_CLOUD_NAME=tu_cloud_name
    CLOUDINARY_API_KEY=tu_api_key
    CLOUDINARY_API_SECRET=tu_api_secret
    ```

4.  **Arranca el servidor:**

    ```bash
    npm run dev
    ```

## 🔐 Autenticación y Seguridad (Middlewares)

La API REST está fuertemente protegida por un sistema de middlewares escalonado:

- **isAuth:** Verifica la validez del JWT en las cabeceras.
- **isAdmin:** Restringe rutas solo para administradores.
- **isOwnerOrAdmin & isOrganizerOrAdmin:** Control de acceso a nivel de documento. Un usuario solo puede editar/borrar su propio perfil o los eventos que él mismo ha creado (salvo que sea administrador).

## ☁️ Gestión Relacional y Archivos

- **Relaciones de Datos:** Se gestionan arrays de referencias (ObjectId) para conectar usuarios con sus eventos creados, asistencias y favoritos.
- **Cloudinary:** Las imágenes subidas (avatares y carteles) se envían directamente a la nube. Si un evento o usuario se elimina, la API lanza un controlador (deleteFile) que localiza y borra el archivo en Cloudinary para no dejar archivos huérfanos.
- **Operadores Avanzados de Mongo:** Los endpoints para confirmar asistencia (toggleAttendees) y guardar favoritos (toggleFavorites) utilizan operadores como $addToSet y $pull para evitar duplicados y manejar la inserción de referencias entre colecciones (ObjectId) con una sola consulta.

## 📡 Endpoints de la API

### 👤 Usuarios (Users)

| Método   | Endpoint                 | Descripción                                          |
| :------- | :----------------------- | :--------------------------------------------------- |
| `POST`   | `/api/v1/users/register` | Registrar un nuevo usuario (encripta password)       |
| `POST`   | `/api/v1/users/login`    | Iniciar sesión y obtener JWT                         |
| `GET`    | `/api/v1/users`          | Obtener lista de usuarios (Público)                  |
| `PUT`    | `/api/v1/users/:id`      | Actualizar datos/avatar (isOwnerOrAdmin)             |
| `DELETE` | `/api/v1/users/:id`      | Eliminar cuenta y eventos asociados (isOwnerOrAdmin) |

### 🎟️ Eventos (Events)

| Método   | Endpoint                            | Descripción                                                    |
| :------- | :---------------------------------- | :------------------------------------------------------------- |
| `POST`   | `/api/v1/events`                    | Crear un evento nuevo con imagen (isAuth)                      |
| `GET`    | `/api/v1/events`                    | Obtener eventos con filtros de búsqueda complejos              |
| `GET`    | `/api/v1/events/:id`                | Obtener detalle del evento populando asistentes                |
| `PUT`    | `/api/v1/events/:id`                | Actualizar información del evento (isOrganizerOrAdmin)         |
| `DELETE` | `/api/v1/events/:id`                | Eliminar evento y su póster de Cloudinary (isOrganizerOrAdmin) |
| `PATCH`  | `/api/v1/events/:eventId/attendees` | Añadir/Eliminar usuario de la lista de asistentes (isAuth)     |
| `PATCH`  | `/api/v1/events/:eventId/favorites` | Añadir/Eliminar evento de favoritos del usuario (isAuth)       |

---

## 💾 Modelos de Datos

- **User:**
  - `firstName, lastName, username`: String (Datos personales)
  - `email`: String (Único)
  - `password`: String (Hasheada con Bcrypt, select: false)
  - `role`: String ('user' o 'admin')
  - `avatar`: String (URL de Cloudinary)
  - `favorites, attendance, createdEvents`: Array de ObjectId (Referencias cruzadas con Eventos)

- **Event:**
  - `title, date, hour, location, city`: Información base del evento.
  - `category`: Enum ('Music', 'Tech', 'Sports', 'Culture', 'Gastronomy', 'Other')
  - `description`: String
  - `poster`: String (URL de Cloudinary)
  - `organizer`: ObjectId (Ref: User - Autor del evento)
  - `attendees, favorites`: Array de ObjectId (Ref: User)

---

Autor: Roman Oliver Gil
