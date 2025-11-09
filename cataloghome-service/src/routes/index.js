

const CategoryHomeRouter = require("./CategoryHomeRouter");
const ProductHomeRouter = require("./ProductHomeRouter");
const FavoriteRouter = require("./FavoriteRouter");

const routes = (app) => {


    
    // Routes cho Guest/Customer (Read-only operations)
    app.use("/api", CategoryHomeRouter);
    app.use("/api", ProductHomeRouter);
    
    // Routes cho Favorite (Authenticated users only)
    app.use("/api", FavoriteRouter);
};

module.exports = routes;