const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "PROJECT API",
            version: "1.0.0",
            description: "Functional Specifications for ToysShop Request API",
        },
        servers: [
            {
                url: "http://localhost:3010",
                description: "Local Development Server"
            },
            {
                url: "http://localhost:3000/order",
                description: "Via API Gateway (Local)"
            },
            {
                url: "https://youtube-fullstack-nodejs-forbeginer.onrender.com/order",
                description: "Production Server"
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

const swaggerDocs = (app) => {
    app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));
};

module.exports = swaggerDocs;
