const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "About Service API",
            version: "1.0.0",
            description: "API Documentation for DarkCore About Service - Quản lý thông tin About Us và Founders",
        },
        servers: [
            {
                url: "http://localhost:3005",
                description: "Local Development Server"
            },
            {
                url: "http://localhost:3000/about",
                description: "Via API Gateway (Local)"
            },
            {
                url: "https://your-production-url.com/about",
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
