const app = require("./app");
const env = require("./config/env");
const AppDataSource = require("./database/data-source");

AppDataSource.initialize()
    .then(() => {
        console.log("Database Connected Successfully");

        app.listen(env.port, () => {
            console.log(`Server running on port ${env.port}`);
        });
    })
    .catch((error) => {
        console.error("Database Connection Failed");
        console.error(error);
        process.exit(1);
    });