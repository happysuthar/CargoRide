let Auth = require('../controllers/driver-auth');
const upload = require("../../../../../middleware/multerdemo");

let DriverRoute = (app) => {



    app.post("/v1/driver/auth/upload-documents", upload.fields([
            { name: "pan_front", maxCount: 1 },
            { name: "pan_back", maxCount: 1 },
            { name: "adhar_front", maxCount: 1 },
            { name: "adhar_back", maxCount: 1 },
            { name: "dl_front", maxCount: 1 },
            { name: "dl_back", maxCount: 1 }
        ]),
        Auth.uploadDriverDocuments);

    app.post('/v1/driver/auth/signup', Auth.signUp);

    app.post('/v1/driver/auth/resend-otp', Auth.resendOTP);

    app.post('/v1/driver/auth/verify-driver', Auth.verifyUser);

    app.post('/v1/driver/auth/login', Auth.login);

    app.post('/v1/driver/auth/verify-forgot-password', Auth.verifyForgotPassword);

    app.post('/v1/driver/auth/set-password', Auth.setPassword);

    app.post('/v1/driver/auth/change-password', Auth.changePassword);

    app.post('/v1/driver/auth/logout' , Auth.logout);

    app.post('/v1/driver/auth/set-availability', Auth.setAvailability);

    app.post('/v1/driver/auth/add-vehicle', Auth.add_vehicle);

    app.post('/v1/driver/auth/reset-password', Auth.resetPassword);

    app.get('/v1/driver/auth/get-order', Auth.get_order);

    app.get('/v1/driver/auth/upcoming-deliveries', Auth.upcoming_deliveries);

    app.post('/v1/driver/auth/delivery-otp', Auth.delivery_otp);

    app.post('/v1/driver/auth/verify-delivery-otp', Auth.verify_delivery_otp);

    app.get('/v1/driver/auth/get-rating', Auth.getRating);

    app.get('/v1/driver/auth/get-package-details', Auth.getPackageDetails);

    app.get('/v1/driver/auth/driver-history', Auth.driverHistory);

    
    

};

module.exports = DriverRoute;