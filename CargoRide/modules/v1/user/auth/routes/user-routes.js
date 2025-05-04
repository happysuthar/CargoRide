let Auth = require('../controllers/user-auth');

let AuthRoute = (app) => {

    app.post('/v1/user/auth/signup', Auth.signUp);

    app.post('/v1/user/auth/resend-otp', Auth.resendOTP);

    app.post('/v1/user/auth/verify-user', Auth.verifyUser);

    app.post('/v1/user/auth/login', Auth.login);

    app.post('/v1/user/auth/verify-forgot-password', Auth.verifyForgotPassword);

    app.post('/v1/user/auth/set-password', Auth.setPassword);

    app.post('/v1/user/auth/vehicle-listing', Auth.vehicleListing);

    app.post('/v1/user/auth/change-password', Auth.changePassword);

    app.post('/v1/user/auth/logout' , Auth.logout);

    app.post('/v1/user/auth/confirm_booking' , Auth.confirm_booking);

    app.get('/v1/user/auth/packageDetails' , Auth.packageDetails);

    app.get('/v1/user/auth/showOrders' , Auth.showOrders);

    app.post('/v1/user/auth/add-rating' , Auth.addRating);

    app.get('/v1/user/auth/get-notification' , Auth.getNotification);

    app.post('/v1/user/auth/cancel-order' , Auth.cancel_order);



    
    // app.post('/v1/auth/delete-account', Auth.deleteAccount);

    // app.post('/v1/auth/view-profile', Auth.viewProfile);
};

module.exports = AuthRoute;