const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger/rentals-openapi.json");

// Swagger UI page at /docs
function setupSwagger(app) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

module.exports = setupSwagger;