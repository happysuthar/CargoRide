let AuthModel = require("../models/driver-model.js");
let common = require("../../../../../utilities/common.js");
let middleware = require("../../../../../middleware/validators.js");
let { t } = require("localizify");
const rules = require("../../../../validation-rules.js");
const CODES = require("../../../../../utilities/response-error-code.js");
const { log } = require("node:console");

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

        let response = middleware.checkValidationRules(requestData, rules.driversignUp, message, keyword);
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

            'email' : t('rest_keyword_email'),
        };

        let response = middleware.checkValidationRules(requestData, rules.resendOTP, message, keyword);
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
        email : req.language.email,

    };
    let keyword = {
        'email':t("rest_keyword_email"),
        'otp' : t("rest_keyword_otp")
    };

    let response = middleware.checkValidationRules(requestData, rules.verifydriver, message, keyword);
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
         'email' : t('rest_keyword_email')
     };
 
     let response = middleware.checkValidationRules(requestData, rules.driverlogin, message, keyword);
     if (response) {
         common.response(req, res, response.code, response.message, {});
     } else {
         const [code, message, data] = await AuthModel.login(requestData);
         common.response(req, res, code, message, data);
     }
 } catch (error) {
    console.log(error)
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
        
        const [code, message, data] = await AuthModel.logout(req.driver_id);
        return common.response(req, res, code, message);
    } 
    catch (error) 
    {
        console.log("Logout error:", error);
        common.response(req, res, CODES.OPERATION_FAILED, { keyword: "Something_went_wrong" }, {});
    }
}


async setAvailability(req, res){
    try {     
    
     let requestData = common.decodeBody(req.body);
     let message = {
         required : req.language.required
     };
     let keyword = {
        'availability' : t('rest_keyword_availability'),
     };
     
     let response = middleware.checkValidationRules(requestData,rules.availability, message, keyword);
     if (response) {
         common.response(req, res, response.code, response.message, {});
     } else {
         const [code, message, data] = await AuthModel.setAvailability(req.driver_id, requestData);

         common.response(req, res, code, message);
     }
 } catch (error) {
     common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
 }
 }

 async add_vehicle(req, res){
    try {     
    
     let requestData = common.decodeBody(req.body);
     let message = {
         required : req.language.required
     };
     let keyword = {
     };
     
     let response = middleware.checkValidationRules(requestData,rules.addvehicle, message, keyword);
     if (response) {
         common.response(req, res, response.code, response.message, {});
     } else {
         const [code, message, data] = await AuthModel.add_vehicle(req.driver_id, requestData);

         common.response(req, res, code, message);
     }
 } catch (error) {
    console.log(error);
    
     common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
 }
 }

 async resetPassword(req, res){
    try {     
    
     let requestData = common.decodeBody(req.body);
     
     let message = {
         required : req.language.required
     };
     let keyword = {
     };
     
     let response = middleware.checkValidationRules(requestData,rules.resetpass, message, keyword);
     if (response) {
         common.response(req, res, response.code, response.message, {});
     } else {
         const [code, message, data] = await AuthModel.resetPassword(requestData);

         common.response(req, res, code, message);
     }
 } catch (error) {
    console.log(error);
    
     common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
 }
 }

 async uploadDriverDocuments(req, res) {
    try {
        let requestData = req.body;

        let messages = { required: req.language.required };
        let keyword = {};

        let response = middleware.checkValidationRules(requestData, rules.availability, messages, keyword);
        if (response) {
            return common.response(req, res, response.code, response.message, {});
        }

        let documentData = {
            adhar_front: req.files?.adhar_front?.[0]?.filename || null,
            adhar_back: req.files?.adhar_back?.[0]?.filename || null,
            pan_front: req.files?.pan_front?.[0]?.filename || null,
            pan_back: req.files?.pan_back?.[0]?.filename || null,
            dl_front: req.files?.dl_front?.[0]?.filename || null,
            dl_back: req.files?.dl_back?.[0]?.filename || null
        };

        // 🔹 Call Model Function
        const [code, message, data] = await AuthModel.uploadDriverDocuments(req.driver_id, documentData);

        return common.response(req, res, code, message, data);
    } catch (error) {
        return common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
    }
}

async get_order(req, res) {
    try {
        let requestData = common.decodeBody(req.body);

        const response = await AuthModel.get_order(requestData,req.driver_id);
        const [code, message, data] = response;
        
        return common.response(req, res, code, message, data);

    } catch (error) {
        console.error(error);
        return common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
    }
}

async upcoming_deliveries(req, res) {
    try {
        // let requestData = common.decodeBody(req.body);

        const response = await AuthModel.upcoming_deliveries(req.driver_id);
        const [code, message, data] = response;
        
        return common.response(req, res, code, message, data);

    } catch (error) {
        console.error(error);
        return common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
    }
}

async delivery_otp(req, res) {
    try {
        let requestData = common.decodeBody(req.body);

        const response = await AuthModel.delivery_otp(req.driver_id,requestData);
        const [code, message, data] = response;
        
        return common.response(req, res, code, message, data);

    } catch (error) {
        console.error(error);
        return common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
    }
}

async verify_delivery_otp(req, res) {
    try {
        let requestData = common.decodeBody(req.body);

        const response = await AuthModel.verify_delivery_otp(req.driver_id,requestData);
        const [code, message, data] = response;
        
        return common.response(req, res, code, message, data);

    } catch (error) {
        console.error(error);
        return common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
    }
}

async getRating(req, res) {
    try {
        let requestData = common.decodeBody(req.body);

        const response = await AuthModel.getRating(req.driver_id,requestData);
        const [code, message, data] = response;
        
        return common.response(req, res, code, message, data);

    } catch (error) {
        console.error(error);
        return common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
    }
}

async getPackageDetails(req, res) {
    try {
        // let requestData = common.decodeBody(req.body);

        const response = await AuthModel.getPackageDetails(req.driver_id);
        const [code, message, data] = response;
        
        return common.response(req, res, code, message, data);

    } catch (error) {
        console.error(error);
        return common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
    }
}

async driverHistory(req, res) {
    try {
        // let requestData = common.decodeBody(req.body);

        const response = await AuthModel.driverHistory(req.driver_id);
        const [code, message, data] = response;
        
        return common.response(req, res, code, message, data);

    } catch (error) {
        console.error(error);
        return common.response(req, res, CODES.UNAUTHORIZED, { keyword: "Something_went_wrong" }, {});
    }
}


}
module.exports = new AuthController;