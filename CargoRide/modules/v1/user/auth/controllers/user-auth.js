let AuthModel = require("../models/user-model.js");
let common = require("../../../../../utilities/common.js");
let middleware = require("../../../../../middleware/validators.js");
let { t } = require("localizify");
const rules = require("../../../../validation-rules.js");
const CODES = require("../../../../../utilities/response-error-code.js");

class AuthController {    
  // sign up
  async signUp(req, res) {
    try {
        let requestData = common.decodeBody(req.body);
        let message = {
            required: req.language.required,
            email: req.language.email,
            digits: req.language.digits,
            max: req.language.max,
            regex: req.language.regex
        };
        let keyword = {
            'email': t('rest_keyword_email'),
            'country_code': t('rest_keyword_country_code'),
            'mobile_number': t('rest_keyword_phone'),
            'password': t('rest_keyword_password'),
        };

        let response = middleware.checkValidationRules(requestData, rules.signUp, message, keyword);
        if (response) {
            common.response(req, res, response.code, response.message, {});
        } else {
            const [code, message, data] = await AuthModel.signUp(requestData);
            common.response(req, res, code, message, data);
        }
    } catch (error) {
        common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
    }
}

    async resendOTP(req, res){
    try {     
        let requestData = common.decodeBody(req.body);
        let message = {
            required : req.language.required,
            required_if : req.language.required_if,
            email : req.language.email,
            digits : req.language.digits,
            in : req.language.in,
        };
        let keyword = {

            'mobile_number' : t('rest_keyword_phone'),
            'country_code' : t('rest_keyword_country_code'),
        };

        let response = middleware.checkValidationRules(requestData, rules.sendOTP, message, keyword);
        if (response) {
            common.response(req, res, CODES.code, response.message, {});
        } else {
            const [code, message, data] = await AuthModel.resendOTP(requestData);
            common.response(req, res, code, message, data);
        }
    } catch (error) {
        common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
    }
    }

async verifyUser(req , res){
   try{
    let requestData = common.decodeBody(req.body);
    console.log(requestData);
    
    requestData.flag = true;
    let message = {
        required : req.language.required,
        required_if : req.language.required_if,
        email : req.language.email,
        digits : req.language.digits,
        in : req.language.in,
    };
    let keyword = {
        'mobile_number' : t('rest_keyword_phone'),
        'country_code' : t('rest_keyword_country_code'),
        'otp' : t("rest_keyword_otp")
    };

    let response = middleware.checkValidationRules(requestData, rules.verifyUser, message, keyword);
    if (response) {
        common.response(req, res, response.code, response.message, {});
    } else {
        const [code, message, data] = await AuthModel.verifyUser(requestData);
        common.response(req, res, code, message, data);
    }
} catch (error) {
    common.response(req, res, CODES.UNAUTHORIZED--, { keyword: "Something_went_wrong" }, {});
}
}

async login(req , res){
    try{
     let requestData = common.decodeBody(req.body);
     console.log(requestData);
     
     requestData.flag = true;
     let message = {
         required : req.language.required,
         required_if : req.language.required_if,
         email : req.language.email,
         digits : req.language.digits,
         in : req.language.in,
     };
     let keyword = {
         'mobile_number' : t('rest_keyword_phone'),
         'country_code' : t('rest_keyword_country_code'),
         'otp' : t("rest_keyword_otp")
     };
 
     let response = middleware.checkValidationRules(requestData, rules.login, message, keyword);
     if (response) {
         common.response(req, res, response.code, response.message, {});
     } else {
         const [code, message, data] = await AuthModel.login(requestData);
         common.response(req, res, code, message, data);
     }
 } catch (error) {
     common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
 }
}


 
async verifyForgotPassword(req, res){
    try {     
     let requestData = common.decodeBody(req.body);
     let message = {
         required : req.language.required,
         required_if : req.language.required_if,
         email : req.language.email,
         digits : req.language.digits,
         in : req.language.in,
     };
     let keyword = {
         'email' : t('rest_keyword_email'),
         'mobile_number' : t('rest_keyword_phone'),
         'country_code' : t('rest_keyword_country_code'),
     };
 
     let response = middleware.checkValidationRules(requestData, rules.verifyForgetPassword, message, keyword);
     if (response) {
         common.response(req, res, response.code, response.message, {});
     } else {
         const [code, message, data] = await AuthModel.verifyForgotPassword(requestData);
         common.response(req, res, code, message, data);
     }
 } catch (error) {
     common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
 }
 }

 async setPassword(req, res){
    try {     
     let requestData = common.decodeBody(req.body);

     let message = {
         required : req.language.required,
         required_if : req.language.required_if,
         email : req.language.email,
         digits : req.language.digits,
         in : req.language.in,
     };
     let keyword = {
         'new_password' : t('rest_keyword_new_password'),
     };
 
     let response = middleware.checkValidationRules(requestData, rules.setPassword, message, keyword);
     if (response) {
         common.response(req, res, response.code, response.message, {});
     } else {
         const [code, message, data] = await AuthModel.setPassword(requestData);
         common.response(req, res, code, message, data);
     }
 } catch (error) {
     common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
 }
 }

 async changePassword(req, res){
    try {     
    

     let requestData = common.decodeBody(req.body);

     let message = {
         required : req.language.required,
         required_if : req.language.required_if,
         email : req.language.email,
         digits : req.language.digits,
         in : req.language.in,
     };
     let keyword = {
         'old_password' : t('rest_keyword_old_password'),
         'new_password' : t('rest_keyword_new_password'),
         'conf_password' : t('rest_keyword_conf_password'),
     };
 
     let response = middleware.checkValidationRules(requestData, rules.changePassword, message, keyword);
     if (response) {
         common.response(req, res, response.code, response.message, {});
     } else {
         const [code, message, data] = await AuthModel.changePassword(req.user_id, requestData);
         common.response(req, res, code, message);
     }
 } catch (error) {
     common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
 }
 }

 async logout(req, res) {
    try {
        
        const [code, message, data] = await AuthModel.logout(req.user_id);
        return common.response(req, res, code, message);
    } 
    catch (error) 
    {
        console.log("Logout error:", error);
        common.response(req, res, CODES.OPERATION_FAILED, { keyword: "Something_went_wrong" }, {});
    }
}


async vehicleListing(req, res){
    try {     
    

     let requestData = common.decodeBody(req.body);

     let message = {
         required : req.language.required
     };
     let keyword = {

     };
 
     let response = middleware.checkValidationRules(requestData, rules.vehiclelisting, message, keyword);
     if (response) {
         common.response(req, res, response.code, response.message, {});
     } else {
        const response = await AuthModel.vehicleListing(req.user_id, requestData);
        common.response(req, res, response.code, response.message, response.data);
     }
 } catch (error) {
    console.log(error);
    
     common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
 }
 }


 
async confirm_booking  (req, res)
 {
     try {
         let requestData = common.decodeBody(req.body);
 
         // Call the service function to process booking
         const [statusCode, responseMessage, responseData] = await AuthModel.confirm_booking(req.user_id, requestData);
 
         return res.status(200).json({
             status: statusCode,
             message: responseMessage,
             data: responseData
         });
 
     } catch (error) {
         console.error("Error in confirmBookingController:", error);
         return res.status(500).json({ status: CODES.SERVER_ERROR, message: "Internal Server Error" });
     }
 };

 async packageDetails(req, res) {
    try {
        let requestData = common.decodeBody(req.body);

        const response = await AuthModel.packageDetails(req.user_id, requestData);
        return common.response(req, res, response.code, response.message, response.data);
        

    } catch (error) {
        console.error( error);
        return common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
    }
}

async showOrders(req, res) {
    try {
        let requestData = common.decodeBody(req.body);

        const response = await AuthModel.showOrders(req.user_id, requestData);
        const [code, message, data] = response;
        return common.response(req, res, code, message, data);

    } catch (error) {
        console.error(error);
        return common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
    }
}

async addRating(req, res) {
    try {
        let requestData = common.decodeBody(req.body);

        const response = await AuthModel.addRating(req.user_id, requestData);
        const [code, message, data] = response;
        return common.response(req, res, code, message, data);

    } catch (error) {
        console.error(error);
        return common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
    }
}

async getNotification(req, res) {
    try {
        // let requestData = common.decodeBody(req.body);

        const response = await AuthModel.getNotification(req.user_id);
        const [code, message, data] = response;
        return common.response(req, res, code, message, data);

    } catch (error) {
        console.error(error);
        return common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
    }
}

async cancel_order(req, res) {
    try {
        let requestData = common.decodeBody(req.body);

        const response = await AuthModel.cancel_order(req.user_id,requestData);
        const [code, message, data] = response;
        return common.response(req, res, code, message, data);

    } catch (error) {
        console.error(error);
        return common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
    }
}


}
module.exports = new AuthController;