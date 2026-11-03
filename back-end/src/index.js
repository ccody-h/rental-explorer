const express = require("express");
const cors = require("cors");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const routes = require("./routes");
const setupSwagger = require("./swagger");

const app = express();

const HTTP_PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// Middleware
app.use(cors());
app.use(express.json());

setupSwagger(app);
app.use("/", routes);

// Unknown endpoints
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Page not found!",
  });
});

// HTTP server
http.createServer(app).listen(HTTP_PORT, () => {
  console.log(`Docs available at http://localhost:${HTTP_PORT}/docs`);
});

// Cert paths
const keyPath = path.join(__dirname, "../certs/server.key");
const certPath = path.join(__dirname, "../certs/server.cert");

// HTTPS server
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
    console.log(`Docs available at https://localhost:${HTTPS_PORT}/docs`);
  });
} else {
  console.warn("HTTPS certificate files not found.");
  console.warn(`Expected key at: ${keyPath}`);
  console.warn(`Expected cert at: ${certPath}`);
  console.warn("HTTPS server was not started.");
}