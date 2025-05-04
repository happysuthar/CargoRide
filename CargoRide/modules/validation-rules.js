const { user_id } = require("../language/en");
const { set_password } = require("./v1/user/auth/models/user-model");

let rules = {
    signUp: {
        full_name: "required",
        email: "required|email",
        country_code: "required",
        mobile_number: "required|digits:10",
        signup_type: "required|in:S,G,F,A", 
        password: "required_if:login_type,S", 
        social_id: "required_if:login_type,G,F,A", 
        device_token: "required",
        },

        driversignUp: {
            full_name: "required",
            email: "required|email",
            country_code: "required",
            mobile_number: "required|digits:10",
            password: "required", 
            device_token: "required",
            },

            availability: {
                },

        // sendOTP : {
        //     verify_with : 'required|in:E,M',
        //     country_code : 'required_if:verify_with,M',
        //     mobile_number : 'required_if:verify_with,mobile_number',
        //     email : 'required_if:verify_with,E'
        // },

            resendOTP : {
            email : 'required'
        },

        vehiclelisting : {
            order_id : 'required',
            pick_up_address : 'required',
            pick_up_latitude : 'required',
            pick_up_longitude : 'required',
            dropoff_address : 'required',
            dropoff_latitude : 'required',
            dropoff_longitude : 'required'

        },

        verifyUser : {
            country_code : 'required',
            mobile_number : 'required',
            otp : 'required|digits:4'
        },

        verifydriver : {
            email : 'required',
            otp : 'required|digits:4'
        },


        login: {

            login_type: "required|in:S,G,F,A",  
            email: "required_if:login_type,S",  
            password: "required_if:login_type,S",  
            social_id: "required_if:login_type,G,F,A",  
            device_token: "required",  
            device_type: "required"

        },
        driverlogin: {

            email: "required_if:login_type,S",  
            password: "required_if:login_type,S" ,
            device_token: "required",  
            device_type: "required"

        },


        addvehicle: {

            vehicle_id: "required",  
            company: "required" ,
            number: "required",  
            model: "required",
            RTO: "required"


        },

        resetpass: {


        },


        set_password:{

            user_id:"required",
            password:"required"

        },

        verifyforgotpassword:{
            country_code:"required",
            mobile_number:"required",
            otp:"required"

        }
}
module.exports = rules;