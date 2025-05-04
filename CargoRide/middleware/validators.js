const Validator = require("Validator");
require("dotenv").config({ path: "./.env" });
const { default: localizify } = require("localizify");
let en = require("../language/en.js")
let hn = require("../language/hn.js");
const { t } = require("localizify");
let CODES = require("../utilities/response-error-code.js");
var cryptoLib = require('cryptlib')
var shaKey = cryptoLib.getHashSha256(process.env.KEY,32)
var database = require("../config/database.js");
const common = require("../utilities/common.js");
const { response } = require("express");
var bypassMethods = ["signup","send-otp","reset-password","verify-driver", "verify-otp", "verify-user", "resend-otp", "login", "forgot-password", "verify-forgot-password", "set-password"];


class middleware {
    
  checkValidationRules( request, rules , message, keyword){

    const v = Validator.make(request,rules,message,keyword);
    if (v.fails()) { 
        const errors = v.getErrors();     
        var error = "";    
        for(var key in errors){
            error = errors[key][0];
            break;
        } 
        let response_data = {
            code : CODES.OPERATION_FAILED,
            message : { keyword : error },
            data : {}
        } 
        return response_data ;
    
    }else{
        return false;
    }

    }

  extractHeaderLanguage(req , res , callback){
  let headerLang = (req.headers['accept-language'] != undefined && req.headers['accept-language'] != "") ? req.headers['accept-language'] : 'en';

  req.lang = headerLang;
  
  req.language = (headerLang == 'en') ? en : hn;

  localizify
      .add('en' , en)
      .add('hn' , hn)
      .setLocale(headerLang);

  callback();
}


  validateApiKey(req, res, callback) {
    var api_key = req.headers['api-key'] || '';
    
    if (api_key != "") {
        try {
            
            var dec_apikey = common.decryptPlain(api_key);
            console.log(dec_apikey);
            
            if (dec_apikey != "" && dec_apikey === process.env.API_KEY) {

                callback();
            } else {
                res.status(401).send({
                    code: '0',
                    message: t("header_key_value_incorrect")
                });
            }
        } catch (error) {
            res.status(401).send({
                code: '0',
                message: t("header_key_value_incorrect")
            });
        }
    } else {
        res.status(401).send({
            code: '0',
            message: t("header_key_value_incorrect")
        });
    }
}

async validateHeaderToken(req, res, next) {
    let headerToken = req.headers['token'] ? req.headers['token'] : '';
    let pathData = req.path.split('/');

    if (bypassMethods.includes(pathData[4])) {
        return next();
    }

    if (!headerToken) {
        console.error("Header Token is missing or empty");
        return res.status(401).send(common.encrypt({
            code: CODES.OPERATION_FAILED,
            message: req.language.invalid_user_token,
            data: {}
        }));
    }

    try {

        let decToken = common.decryptPlain(headerToken);
        console.log(decToken);
        

        // Check if the token exists in `tbl_device` for users
        let userSql = `SELECT * FROM tbl_device WHERE user_token = '${decToken}'`;
        const [userResult] = await database.query(userSql);

        if (userResult.length > 0) {
            req.user_id = userResult[0].user_id;
            return next();
        }

        // If user_token is not found, check for driver_token in `tbl_driver_device`
        let driverSql = `SELECT * FROM tbl_driver_device WHERE driver_token = '${decToken}'`;
        const [driverResult] = await database.query(driverSql);

        if ( driverResult.length > 0) {
            req.driver_id = driverResult[0].driver_id;
            return next();
        }

        // If neither token is valid
        console.error("Invalid Token: Not found in either tbl_device or tbl_driver_device");
        return res.status(401).send(common.encrypt({
            code: CODES.OPERATION_FAILED,
            message: req.language.invalid_user_token,
            data: {}
        }));

    } catch (error) {
        console.error("Token Validation Error:", error);
        return res.status(401).send(common.encrypt({
            code: CODES.OPERATION_FAILED,
            message: req.language.invalid_user_token,
            data: {}
        }));
    }
}


};


module.exports = new middleware();