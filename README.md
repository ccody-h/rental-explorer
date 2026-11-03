# Rental Explorer

A full-stack rental property application built with React, Express and MySQL. Users can search rental listings, explore property details, create an account and rate properties.

Originally developed as a university project, Rental Explorer demonstrates frontend development, REST API integration, JWT authentication, relational database access and API documentation.

## Features

- Search rental properties using filters, including state and property type.
- View property details, map information and similar properties.
- Register and log in to an account.
- Submit property ratings from 1 to 5 and view previously rated rentals.
- Navigate through a React single-page application.
- Explore the backend API through Swagger UI.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, React Router, Bootstrap, Vite |
| Backend | Node.js, Express |
| Database | MySQL, Knex, mysql2 |
| Authentication | JSON Web Tokens, bcrypt |
| API documentation | Swagger UI, swagger-jsdoc |
| Development tools | ESLint, Nodemon |

## Project structure

```text
rental-explorer/
├── front-end/
│   ├── public/
│   ├── src/
│   ├── index.html
│   └── package.json
├── back-end/
│   ├── certs/
│   ├── src/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── swagger/
│   │   ├── index.js
│   │   └── swagger.js
│   ├── knexfile.js
│   └── package.json
└── README.md
```

## Running locally

### Prerequisites

- A Node.js version supported by the project's installed Vite version, and npm.
- A running MySQL server.
- The rental database schema and rental listing data.
- OpenSSL if you want to generate local HTTPS certificates.

Run commands from the folders shown below. In VS Code, right-click a folder and select **Open in Integrated Terminal**.

### 1. Install dependencies

From `back-end`:

```bash
# Install backend dependencies.
npm install
```

From `front-end`:

```bash
# Install frontend dependencies.
npm install
```

### 2. Configure the database

Create a MySQL database named `rental_api`, or use another name and set `DB_NAME` accordingly. Configure a local database user with the permissions needed to create the schema and read and write application data.

Create a `.env` file inside `back-end`:

```dotenv
# Local database connection settings.
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=rental_api

# Backend listening ports.
PORT=3000
HTTPS_PORT=3443
```

The backend loads `.env` through dotenv. Keep this file out of version control and provide an `.env.example` containing placeholders for other developers.

Set the JWT signing secret using the environment variable expected by the authentication implementation. Check the authentication code for its exact name; the entry point and database configuration do not define it.

Import the rental schema and listing data from your local SQL dump using MySQL Workbench or the MySQL client. The property table is named `data`.

From `back-end`, apply any outstanding migrations:

```bash
# Apply database migrations.
npm run migrate
```

If your SQL dump already contains application tables, check it against the migrations before applying them to avoid duplicate-table errors. Use the project's seed command only if seed files are provided and their contents are appropriate for your local database.

### 3. Configure optional HTTPS

The backend starts HTTP by default. It also starts HTTPS when both of these files exist:

- `back-end/certs/server.key`
- `back-end/certs/server.cert`

To generate a self-signed certificate for local development, create the `certs` directory if needed and run this command from `back-end` using a terminal with OpenSSL installed:

```bash
# Generate a local certificate and private key valid for one year.
openssl req -x509 -newkey rsa:2048 -nodes -keyout certs/server.key -out certs/server.cert -days 365 -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
```

The certificate is self-signed, so browsers may show a trust warning. Open the local HTTPS API address and accept the development certificate before using a frontend configured to call it. Never commit the private key.

If the certificate files are absent, the backend logs a warning and continues serving HTTP.

### 4. Start the backend

From `back-end`:

```bash
# Start the backend server.
npm start
```

Alternatively, use automatic restarts during development:

```bash
# Restart the backend when source files change.
npm run dev
```

Default API documentation addresses:

- HTTP: <http://localhost:3000/docs>
- HTTPS, when certificates are available: <https://localhost:3443/docs>

### 5. Configure and start the frontend

Check the API base URL used by the frontend source. Point it to the running local backend:

- `http://localhost:3000` for HTTP.
- `https://localhost:3443` for HTTPS.

If it still points to the original university VM, update it before running the app. The frontend's API configuration file and variable name depend on the source implementation.

From `front-end`, in a second terminal:

```bash
# Start the Vite development server.
npm run dev
```

Open the Local URL printed by Vite, typically <http://localhost:5173>. Keep both terminals running while using the application.

## Available commands

| Folder | Command | Purpose |
| --- | --- | --- |
| `front-end` | `npm run dev` | Start the frontend development server |
| `front-end` | `npm run build` | Build the frontend into `dist` |
| `front-end` | `npm run preview` | Preview the built frontend locally |
| `front-end` | `npm run lint` | Run ESLint |
| `back-end` | `npm start` | Start the API with Node.js |
| `back-end` | `npm run dev` | Start the API with Nodemon |
| `back-end` | `npm run migrate` | Apply database migrations |
| `back-end` | `npm run rollback` | Roll back the latest migration batch; may remove data |
| `back-end` | `npm run seed` | Run configured database seed files, if supplied |

## API overview

The API supports rental searches and details, user registration and login, authenticated ratings and user profiles. See Swagger UI at `/docs` for endpoint definitions and request formats.

## Troubleshooting

| Issue | What to check |
| --- | --- |
| Vite is not recognised | Run `npm install` from `front-end` |
| Node cannot find the startup file | Use `npm start` from `back-end`; the entry point is `src/index.js` |
| Failed to fetch states | Check the API base URL, backend terminal, database connection and HTTPS certificate trust |
| HTTPS is unavailable | Check the exact filenames `certs/server.key` and `certs/server.cert` |
| Database connection fails | Check MySQL is running, `.env` credentials, database name and user permissions |

## Project background

This application began as a university assessment and is being prepared as a portfolio project. It demonstrates an end-to-end rental browsing and rating workflow across a React client, Express API and MySQL database.

Running the application requires database setup and rental listing data. Development HTTPS uses locally generated certificates. No live demo URL is currently documented here.
