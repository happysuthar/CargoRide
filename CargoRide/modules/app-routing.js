let userAuthRoute = require("./v1/user/auth/routes/user-routes");
let driverAuthRoute = require("./v1/driver/auth/routes/driver-routes");

// let PostRoutes = require("./v1/user/routes/postroutes");

class Routing{
    v1(app){

        userAuthRoute(app);
        driverAuthRoute(app);


        // PostRoutes(app);

    }
}

module.exports = new Routing();