let database = require("../../../../../config/database");
let md5 = require("md5");
let CODES = require("../../../../../utilities/response-error-code");
let common = require("../../../../../utilities/common");
let constant = require("../../../../../config/constant");
const moment = require("moment");
const dayjs = require("dayjs");
const crypto = require("crypto");
let message = require("../../../../../language/en");
const {forgot_password} = require("../../../../../email/template")


class AuthModel {
    async signUp(requestData) {
        try {
            const existingDriver = await common.getDriverByEmailOrMobile(requestData.email, requestData.mobile_number);
    
            if (existingDriver) {
                if (existingDriver.is_verified === 0) {
                    const otpCode = common.generateOTP();
                    const otpExpiry = moment().add(20, "minutes").format("YYYY-MM-DD HH:mm:ss");
    
                    const otpData = {
                        driver_id: existingDriver.driver_id,
                        email: requestData.email,
                        otp: otpCode,
                        expires_at: otpExpiry,
                    };
    
                    const otpResponse = await common.insertOTP(otpData);
                    if (!otpResponse) {
                        return [
                            CODES.OPERATION_FAILED,
                            { keyword: "otp_sent_failed" },
                            {}
                        ];
                    }
    
                    const subject = "Your OTP Code";
                    const messageContent = `Hello ${existingDriver.full_name},\n\nYour OTP code is: ${otpCode}\n\nThis OTP will expire at: ${otpExpiry} (UTC)\n\nBest Regards,\nCargo Ride`;
    
                    common.sendMail(subject, requestData.email, messageContent, (err, info) => {
                        if (err) {
                            console.error("Error sending OTP Email:", err);
                        } else {
                            console.log("OTP Email Sent Successfully:", info.response);
                        }
                    });
    
                    return [
                        CODES.SUCCESS,
                        { keyword: "otp_resentt" },
                        { otp: otpCode, otp_expiry: otpExpiry }
                    ];
                }
    
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: message.rest_keywords_unique_email_error },
                    {}
                ];
            }
    
            // If no existing unverified user, proceed with a new signup
            const signUpData = {
                full_name: requestData.full_name,
                company_name: requestData.company_name,
                email: requestData.email,
                country_code: requestData.country_code,
                mobile_number: requestData.mobile_number,
                address: requestData.address,
                latitude: requestData.latitude,
                longitude: requestData.longitude,
                password: md5(requestData.password),
                steps: 1,
                updated_at: moment().utc().format("YYYY-MM-DD HH:mm:ss"),
            };
    
            try {
                let sql = "INSERT INTO tbl_driver SET ?";
                const [data] = await database.query(sql, [signUpData]);
    
                if (!data.insertId) {
                    return [
                        CODES.OPERATION_FAILED,
                        { keyword: message.insert_data_error },
                        {}
                    ];
                }
    
                let driver_id = data.insertId;
    
                let deviceData = {
                    driver_id: driver_id,
                    device_token: requestData.device_token,
                    device_type: requestData.device_type,
                    driver_token: common.generateToken(),
                    time_zone: requestData.time_zone,
                    ...(requestData.device_name && { device_name: requestData.device_name }),
                    ...(requestData.os_version && { os_version: requestData.os_version }),
                    ...(requestData.app_version && { app_version: requestData.app_version })
                };
    
                const deviceInsert = await common.insertdriverDevice(deviceData);
                if (!deviceInsert) {
                    return [
                        CODES.OPERATION_FAILED,
                        { keyword: message.device_action_failed },
                        {}
                    ];
                }
    
                const otpCode = common.generateOTP();
                const otpExpiry = moment().add(20, "minutes").format("YYYY-MM-DD HH:mm:ss");
    
                const otpData = {
                    driver_id: driver_id,
                    email: requestData.email,
                    otp: otpCode,
                    expires_at: otpExpiry,
                };
    
                const otpResponse = await common.insertOTP(otpData);
                if (!otpResponse) {
                    return [
                        CODES.OPERATION_FAILED,
                        { keyword: message.failed_to_send_otp },
                        {}
                    ];
                }
    
                // Send OTP Email
                const subject = "Your OTP Code";
                const messageContent = `Hello ${requestData.full_name},\n\nYour OTP code is: ${otpCode}\n\nThis OTP will expire at: ${otpExpiry} (UTC)\n\nBest Regards,\nCargo Ride`;
    
                console.log("Sending OTP Email to:", requestData.email);
    
                common.sendMail(subject, requestData.email, messageContent, (err, info) => {
                    if (err) {
                        console.error("Error sending OTP Email:", err);
                    } else {
                        console.log("OTP Email Sent Successfully:", info.response);
                    }
                });
    
                const userInfo = await common.getdriverInfo(driver_id);
                if (!userInfo) {
                    return [
                        CODES.OPERATION_FAILED,
                        { keyword: message.rest_keywords_something_went_wrong },
                        {}
                    ];
                }
    
                return [
                    CODES.SUCCESS,
                    { keyword: message.otp_send_success },
                    {
                        userInfo,
                        otp: otpCode,
                        otp_expiry: otpExpiry
                    }
                ];
            } catch (error) {
                console.error(error);
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: message.insert_data_error, error: error.message },
                    {}
                ];
            }
        } catch (error) {
            console.error(error);
            return [
                CODES.NOT_APPROVE,
                { keyword: "Something went wrong", error: error.message },
                {}
            ];
        }
    }

     async verifyUser(requestData) {
        try {
    
            
            let sql = `email = '${requestData.email}' AND is_active = 1 AND is_deleted = 0`;
            let otpResult = await common.getOTPd(sql);
            if (!otpResult) {
                return [CODES.OPERATION_FAILED, { keyword: "txt_otp_not_found" }, {}];
            }
            if (otpResult.otp !== requestData.otp) {
                return [CODES.OTP_NOT_VERIFIED, { keyword: "otp_mismatch" }, {}];
            }
    
            let driver_id = otpResult.driver_id;
    
            let updateData = { is_verified: 1, steps: 2 };
            let updateResponse = await common.updateDriverData(driver_id, updateData);
            if(!updateResponse)
            {
                return [CODES.OPERATION_FAILED, { keyword: "update_driver_data_error"}]
            }
    
            let deleteOtpResponse = await common.deleteoTP(driver_id);
            if(!deleteOtpResponse)
            {
                return [CODES.OPERATION_FAILED, { keyword: "delete_otp_error"}]
            }
    
            let userInfo = await common.getdriverInfo(driver_id);
            if (!userInfo) {
                return [CODES.OPERATION_FAILED, { keyword: "rest_keyword_something_went_wrong" }, {}];
            }
            return [CODES.SUCCESS, { keyword: "user_verified" }, { userInfo }];
        } catch (error) {
            return [CODES.OPERATION_FAILED, { keyword: "txt_error_verify_user", error: error.message }, {}];
        }
    }

    async setAvailability(driver_id, requestData) {
        try {
            console.log("Driver ID:", driver_id);
            let data = `id = '${driver_id}' AND is_active = 1 AND is_deleted = 0 AND steps = 2`;
    
            let getuserdetails = await common.getDriver(data);
            if (!getuserdetails) {
                return [
                    CODES.INVALID_REQUEST,
                    { keyword: "user not found, complete the steps" },
                    {}
                ];  
            }
    
            const availabilityData = requestData.availability; 
    
            if ( availabilityData.length === 0) {
                return [
                    CODES.INVALID_REQUEST,
                    { keyword: "invalid_availability_data" },
                    {}
                ];
            }
    
            await database.query("DELETE FROM tbl_driver_availability WHERE driver_id = ?", [driver_id]);
    
            for (const dayData of availabilityData) {
                let availabilityEntry = {
                    driver_id: driver_id,
                    day: dayData.day,
                    start_time: dayData.start_time,
                    end_time: dayData.end_time,
                };
    
                await database.query("INSERT INTO tbl_driver_availability SET ?", [availabilityEntry]);
            }
    
            let updateData = { steps: 3 };
            let updateResponse = await common.updateDriverData(driver_id, updateData);
    
            if (!updateResponse) {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: message.failed_to_update_data },
                    {}
                ];
            }
    
            // console.log("Updating radius for driver:", driver_id, "with value:", requestData.availability_radius_km);
    
            let radiusAdd = await common.addRadius(driver_id, requestData.availability_radius_km);
    
            if (!radiusAdd) {
                // console.error("Failed to update radius for driver:", driver_id);
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: "failed_to_add_radius" },
                    {}
                ];
            }
    
            return [
                CODES.SUCCESS,
                { keyword: message.operation_successful },
                {}
            ];
        } catch (error) {
            console.error( error);
            return [
                CODES.OPERATION_FAILED,
                { keyword: message.operation_failed, error: error.message },
                {}
            ];
        }
    }
    
    async add_vehicle(driver_id, requestData) {
        try {

            let getdriver = await common.getdriverInfo(driver_id);

            if(!getdriver)
            {
                return [CODES.OPERATION_FAILED, { keyword: "no_data_found" }, {}];
            }
            const vehicle_data = {
                vehicle_id: requestData.vehicle_id,
                company: requestData.company,
                number: requestData.number,
                model: requestData.model,
                RTO: requestData.RTO,
            };
    
            let vehicle = await common.addVehicle(vehicle_data, driver_id);
    
            if (!vehicle || !vehicle.insertId) {
                console.error("Failed to add vehicle details:", vehicle);
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: "failed_to_add_vehicle_details" },
                    {},
                ];
            }
    
            let Data = { steps: 4 };
            let updateResponse = await common.updateDriverData(driver_id, Data);
    
            if (!updateResponse) {
                // console.error("Failed to update driver steps");
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: "failed_to_update_driver_steps" },
                    {},
                ];
            }
                return [
                    CODES.SUCCESS,
                    { keyword: message.operation_successful },
                    { vehicle_id: vehicle.insertId },
                ];


        } catch (error) {
            console.error(error);
    
            return [
                CODES.OPERATION_FAILED,
                { keyword: "error_adding_vehicle" },
                {},
            ];
        }
    }

    async uploadDriverDocuments(driver_id, documentData) {
        try {
            let driver = await common.getdriverInfo(driver_id)

            if(driver.steps !== 4)
            {
                return [
                        CODES.OPERATION_FAILED,
                        { keyword: "complete steps" },
                        {}]; 
            }
            let { adhar_front, adhar_back, pan_front, pan_back, dl_front, dl_back } = documentData;
    
            let query = `
                INSERT INTO tbl_driver_documents 
                (driver_id, adhar_front, adhar_back, pan_front, pan_back, dl_front, dl_back) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
    
            let values = [driver_id, adhar_front, adhar_back, pan_front, pan_back, dl_front, dl_back]; 
            let [result] = await database.execute(query, values);

            const subject = "Welcome to Our App!";
            const message = `Hi ${driver.full_name},\n\nWelcome to our app! We're excited to have you onboard.\n\nBest Regards,\nYour App Team`;
    
            console.log("Sending Welcome Email to:", driver.email);
    
            common.sendMail(subject, driver.email, message, (err, info) => {
                if (err) {
                    console.error( err);
                } else {
                    console.log("Welcome Email Sent Successfully:", info.response);
                }
            });

            return [CODES.SUCCESS, { keyword: 'documents_uploaded_successfully' }, { uploaded_files: documentData }];
        } catch (error) {
            console.error(error);
            return [CODES.OPERATION_FAILED,, { keyword: 'db_insert_failed' }, {}];
        }
    }
    
    async login(requestData) 
    {
        try {
            let sql = "";
            let queryParams = [];
    
            if (requestData.type === "Email") {
                sql = "SELECT * FROM tbl_driver WHERE email = ? AND password = ?";
                queryParams = [requestData.email, md5(requestData.password)];
            } else {
                sql = "SELECT * FROM tbl_driver WHERE country_code = ? AND mobile_number = ? AND password = ?";
                queryParams = [requestData.country_code, requestData.mobile, md5(requestData.password)];
            }
    
    
            const [result] = await database.query(sql, queryParams);
            if (!result.length) {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: message.login_invalid_credential },
                    {},
                ];
            }
    
            const driver = result[0];

            if (driver.is_deleted === 1) {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: message.user_not_found, content: { username: driver.user_name } },
                    {},
                ];
            }
    
            if (driver.is_active ===0 ) {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: message.user_not_found, content: { username: driver.user_name } },
                    {},
                ];

            }
    
            if (driver.is_verified !== 1) {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: message.not_verified },
                    {},
                ];

            }
    
            const loginData = {
                latitude: requestData.latitude,
                longitude: requestData.longitude,
                steps: 3,
                is_login: 1,
                last_login: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                updated_at: moment().utc().format("YYYY-MM-DD HH:mm:ss"),
            };
    
    
            await database.query("UPDATE tbl_driver SET ? WHERE id = ?", [loginData, driver.id]);
    
            let deviceData = {
                driver_token: common.generateToken(),
                device_token: requestData.device_token,
                device_name: requestData.device_name ,
                device_type: requestData.device_type,
                time_zone: requestData.time_zone,
                ...(requestData.os_version && { os_version: requestData.os_version }),
                ...(requestData.app_version && { app_version: requestData.app_version }),
            };
    
    
            const deviceResponse = await common.updateDDeviceData( deviceData,driver.id,);
    
            if (!deviceResponse) {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: "rest_keyword_something_went_wrong", content: { username: driver.user_name } },
                    {},
                ];
            }
    
            return [
                CODES.SUCCESS,
                { keyword: "login_success" },
                { driver },
            ];

        } catch (error) 
        {
            console.log(error);
            return [
                CODES.OPERATION_FAILED,
                { keyword: "rest_keyword_something_wrong" },
                {},
            ];
        }
    }
    
    async resendOTP(requestData) {
        try {
            let data = `email = '${requestData.email}' AND is_active = 1 AND is_deleted = 0`;
    
            const user = await common.getDriver(data); 
        
            if (!user) { 
                return [CODES.OPERATION_FAILED, { keyword: "no_data_found" }, {}];
            }
    
            let otpData = {
                driver_id: user.id,
                otp: common.generateOTP(),
                email:requestData.email,
                expires_at: moment().add(20, "minutes").format("YYYY-MM-DD HH:mm:ss"),
            };
    
            const deleteResponse = await common.deleteoTP(otpData.driver_id);
            if (!deleteResponse) {
                return [CODES.OPERATION_FAILED, { keyword: "otp_send_fail" }, {}];
            }
    
    
            const otpResponse = await common.insertOTP(otpData);
            if (!otpResponse) {
                return [CODES.OPERATION_FAILED, { keyword: "otp_send_fail" }, {}];
            }
    
    
            const subject = "Your OTP Code";
            const message = `Hello ${user.full_name || "User"},\n\nYour OTP code is: ${otpData.otp}\n\nThis OTP will expire at: ${otpData.expires_at} (UTC)\n\nBest Regards,\nCargo Ride`;
    
            console.log("Sending OTP Email to:", requestData.email);
    
            common.sendMail(subject, requestData.email, message, (err, info) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log("OTP Email Sent Successfully:", info.response);
                }
            });
    
            return [CODES.SUCCESS, { keyword: "otp_send_success" }, { driver_id: otpData.driver_id, otp: otpData.otp }];
            
        } catch (error) {
            console.error( error);
            return [CODES.OPERATION_FAILED, { keyword: "otp_send_fail", error: error.message }, {}];
        }
    }
   
//     async verifyForgotPassword(requestData) {
//         try {
//             let sql = `mobile_number = '${requestData.mobile_number}' 
//                        AND country_code = '${requestData.country_code}' 
//                        AND is_active = 1 
//                        AND is_deleted = 0`;
    
//             let otpResult = await common.getOTP(sql);
//             if (!otpResult || !otpResult.otp) {
//                 return [
//                     CODES.OPERATION_FAILED,
//                     { keyword: "txt_otp_not_found" },
//                     {}
//                 ];
//             }
//             if (String(otpResult.otp) !== String(requestData.otp)) {
//                 return [
//                     CODES.OTP_NOT_VERIFIED,
//                     { keyword: "otp_mismatch" },
//                     {}
//                 ];
//             }
//             if (moment().isAfter(moment(otpResult.expires_at))) {
//                 return [
//                     CODES.OTP_EXPIRED,
//                     { keyword: "otp_expired" },
//                     {}
//                 ];
//             }
//             let user_id = otpResult.user_id;
//             let updateData = {
//                 steps: 4
//             };
//             let updateResponse = await common.updateUserData(user_id, updateData);
//             if (!updateResponse) {
//                 return [
//                     CODES.OPERATION_FAILED,
//                     { keyword: "rest_keyword_update_failed" },
//                     {}
//                 ];
//             }
//             let deleteOtpResponse = await common.deleteOTP(user_id);
//             if (!deleteOtpResponse) {
//                 return [
//                     CODES.OPERATION_FAILED,
//                     { keyword: "rest_keyword_otp_delete_failed" },
//                     {}
//                 ];
//             }
//             let userInfo = await common.getUserInfo(user_id);
//             if (!userInfo) {
//                 return [
//                     CODES.OPERATION_FAILED,
//                     { keyword: "rest_keyword_something_went_wrong" },
//                     {}
//                 ];
//             }
//             return [
//                 CODES.SUCCESS,
//                 { keyword: "forgot_password_verified" },
//                 { userInfo }
//             ];
    
//         } catch (error) {
//             return [
//                 CODES.OPERATION_FAILED,
//                 { keyword: "txt_error_verify_forgot_password", error: error.message },
//                 {}
//             ];
//         }
//     }

//     async setPassword(requestData) {
//         try {
//             // Fetch user info
//             let sql = `id = '${requestData.user_id}' AND is_active = 1 AND is_deleted = 0`;
//             let userInfo = await common.getUser(sql);
    
//             if (!userInfo) {
//                 return [
//                     CODES.OPERATION_FAILED,
//                     { keyword: "txt_user_not_found" },
//                     {}
//                 ];
//             }
    
//             // Prevent resetting if user is at step 4
//             if (Number(userInfo.steps) !== 4) {
//                 return [
//                     CODES.OPERATION_FAILED,
//                     { keyword: "txt_invalid_reset_step" },
//                     {}
//                 ];

//             }
    
//             let old_password = userInfo.password;
            
//             let new_password = md5(requestData.password);
            
//             // Check if new password is the same as old password
//             if (old_password === new_password) {
//                 return [
//                     CODES.OPERATION_FAILED,
//                     { keyword: "txt_password_mismatch" },
//                     {}
//                 ];
//             }
    
//             // Update password and steps
//             let updateData = {
//                 password: new_password,
//             };
//             let updateResponse = await common.updateUserData(requestData.user_id, updateData);
    
//             if (!updateResponse) {
//                 return [
//                     CODES.OPERATION_FAILED,
//                     { keyword: "rest_keyword_update_failed" },
//                     {}
//                 ];
//             }
    
//             // Fetch updated user info
//             let updatedUserInfo = await common.getUserInfo(requestData.user_id);
//             if (!updatedUserInfo) {
//                 return [
//                     CODES.OPERATION_FAILED,
//                     { keyword: "rest_keyword_something_went_wrong" },
//                     {}
//                 ];
//             }
    
//             return [
//                 CODES.SUCCESS,
//                 { keyword: "password_reset_success" },
//                 { userInfo: updatedUserInfo }
//             ];
    
//         } catch (error) {
//             console.error("Error in setPassword:", error);
//             return [
//                 CODES.OPERATION_FAILED,
//                 { keyword: "txt_error_set_password", error: error.message },
//                 {}
//             ];
//         }
//     }
    
    
//    async changePassword(user_id,requestData) {
//     try {
//         // Fetch user data using user_token        
//         let userResult = await common.getUser(`id = '${user_id}' AND is_active = 1 AND is_deleted = 0`);
//         if (!userResult) {
//             return [
//                 CODES.OPERATION_FAILED,
//                 { keyword: "txt_user_not_found" },
//                 {}
//             ];
//         }
//         // Verify old password
//         if (userResult.password !== md5(requestData.old_password)) {
//             return [
//                 CODES.OPERATION_FAILED,
//                 { keyword: "txt_old_password_incorrect" },
//                 {}
//             ];
//         }
//         // Update password
//         let hashedPassword = md5(requestData.new_password);
//         let updateData = { password: hashedPassword };
//         let updateResponse = await common.updateUserData(userResult.id, updateData);

//         if (!updateResponse) {
//             return [
//                 CODES.OPERATION_FAILED,
//                 { keyword: "password_change_failed" },
//                 {}
//             ];
//         }
//         return [
//             CODES.SUCCESS,
//             { keyword: "password_change_success" },
//             {}
//         ];
//     } catch (error) {
//         return [
//             CODES.OPERATION_FAILED,
//             { keyword: "error_change_password", error: error.message },
//             {}
//         ];
//     }
// }

    async logout(driver_id)
    {
        try {
            let updateData = { is_login:0 };
            let updateResponse = await common.updateDriverData(driver_id, updateData);
    
            if (!updateResponse) {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: "logout_failed" },
                    {}
                ];
            }
            
            let updatedevice = await common.deletedriverDevice(driver_id)
            if(!updatedevice)
            {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: "Error deleting the device information" },
                    {}
                ];   
            }

            return [
                CODES.SUCCESS,
                { keyword: "logout_success" },
                {}
            ];            
        } 
        
        catch (error) {
            console.log(error)
            return [
                CODES.OPERATION_FAILED,
                { keyword: "error_logout" },
                {}
            ];
        }
    }

    async resetPassword(requestData) {
        try {
    
            let data = `email = '${requestData.email}' AND is_active = 1 AND is_deleted = 0`;
    
            const DriverResult = await common.getDriver(data);
            if (!DriverResult) {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: "no_data_found" },
                    {}
                ];
            }
            const resetToken = crypto.randomBytes(32).toString("hex");
            const expires_at = moment().add(1, "hour").format("YYYY-MM-DD HH:mm:ss");
            const resetData = {
                driver_id: DriverResult.id,
                email: requestData.email,
                reset_token: resetToken,
                expires_at: expires_at,
                created_at: moment().utc().format("YYYY-MM-DD HH:mm:ss"),
            };
            const resetResponse = await common.insertResetToken(resetData);
            if (!resetResponse) {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: "reset_link_generation_failed" },
                    {}
                ];
            }
    

            const resetLink = `http://localhost:8000/resetemailpassword.php?token=${resetToken}`;
            const subject = "Reset Your Password";
            const emailData = {
                name: requestData.full_name || 'User',
                url: resetLink
            };
            const htmlMessage = forgot_password(emailData);
            common.sendMail(subject, requestData.email, htmlMessage, (err, info) => {
                if (err) {
                    console.log(err);
                    
                    return [
                        CODES.OPERATION_FAILED, 
                        { keyword: "txt_email_send_fail" }, 
                        {}
                    ];
                } else {
                    return [
                        CODES.SUCCESS,
                        { keyword: "reset_link_sent" },
                        { email: requestData.email, reset_link: resetLink }
                    ];
                }
            });

        } catch (error) {
            console.error(error);
            return [
                CODES.OPERATION_FAILED,
                { keyword: "error_send_reset_link", error: error.message },
                {}
            ];
        }
    }

    async get_order(requestData, driver_id) {
        try {
            let fetchSQL = `SELECT 
                            dl.pickup_address,
                            dl.dropoff_address,
                            it.type,
                            it.notes,
                            it.weight,
                            it.weight_unit,
                            it.height,
                            it.height_unit,
                            it.width,
                            it.width_unit,
                            o.estimated_time_min,
                            o.delivery_date,
                            o.distance_km,
                            o.estimated_time_min,
                            o.id AS order_id,  -- Fetching order_id
                            (6371 * ACOS(
                                COS(RADIANS(dr.latitude)) * COS(RADIANS(dl.pick_up_latitude)) 
                                * COS(RADIANS(dl.pick_up_longitude) - RADIANS(dr.longitude)) 
                                + SIN(RADIANS(dr.latitude)) * SIN(RADIANS(dl.pick_up_latitude))
                            )) AS distance_km
                          FROM tbl_delivery dl
                          JOIN tbl_receiver rc ON dl.order_id = rc.order_id
                         JOIN tbl_item it ON it.order_id = dl.order_id
                         JOIN tbl_order o ON o.id = dl.order_id
                         CROSS JOIN tbl_driver dr  -- Using CROSS JOIN instead of JOIN ON condition
                        WHERE 
                            (6371 * ACOS(
                                COS(RADIANS(dr.latitude)) * COS(RADIANS(dl.pick_up_latitude)) 
                                * COS(RADIANS(dl.pick_up_longitude) - RADIANS(dr.longitude)) 
                                + SIN(RADIANS(dr.latitude)) * SIN(RADIANS(dl.pick_up_latitude))
                            )) <= dr.availability_radius_km  -- Filter drivers within radius
                            AND dr.availability_status = "Available"
                        ORDER BY distance_km ASC;`;

    
            const [orders] = await database.query(fetchSQL);
    
            if (!orders || orders.length === 0) {
                return [CODES.NOT_FOUND, { keyword: "no_orders_found" }, {}];
            }
    
            if (requestData.is_ignore === 1) {
                return [CODES.SUCCESS, { keyword: "orders_fetched" }, orders];
            }
    
            if (requestData.is_accept === 1) {
                const firstOrder = orders[0]; 
                if (!firstOrder || !firstOrder.order_id) {
                    return [CODES.NOT_FOUND, { keyword: "no_order_id_found" }, {}];
                }
    
                let updateSQL = `UPDATE tbl_order 
                                SET driver_id = ?, status = "Confirmed" 
                                WHERE id = ?`;
                await database.query(updateSQL, [driver_id, firstOrder.order_id]);
    
                return [CODES.SUCCESS, { keyword: "order_accepted" }, { order_id: firstOrder.order_id }];
            }
    
            return [CODES.SUCCESS, { keyword: "orders_fetched" }, orders];
    
        } catch (error) {
            console.error(error);
            return [CODES.SERVER_ERROR, { keyword: "server_error" }, {}];
        }
    }
    
    async upcoming_deliveries(driver_id) {
        try {
            let fetchSQL =
                             `	SELECT 
                                dl.pickup_address,
                                dl.dropoff_address,
                                it.type,
                                o.delivery_date
                                FROM tbl_delivery dl
                                JOIN tbl_item it ON it.order_id = dl.order_id
                                JOIN tbl_order o ON o.id = dl.order_id
                                JOIN tbl_driver dr ON dr.id = o.driver_id
                                WHERE o.driver_id = ? and o.status !="Delivered";`;

    
            const [orders] = await database.query(fetchSQL,[driver_id]);
    
            if (!orders || orders.length === 0) {
                return [CODES.NOT_FOUND, { keyword: "no_orders_found" }, {}];
            }
    
            return [CODES.SUCCESS, { keyword: "orders_fetched" }, orders];
    
        } catch (error) {
            console.error(error);
            return [CODES.SERVER_ERROR, { keyword: "server_error" }, {}];
        }
    }

    async delivery_otp(driver_id, requestData) {
        try {
            const sql = `SELECT * FROM tbl_order WHERE id = ?`;
            const [order] = await database.query(sql, [requestData.order_id]);
    
            if (!order || order.length === 0) {
                return [CODES.NOT_FOUND, { keyword: "no_order_found" }, {}];
            }

            let user = order[0]; // Fetching the first order record

    
            let sql3 = `select * from tbl_user where id = ?`
            const [userr] = await database.query(sql3, [user.user_id]);
            let User = userr[0];
    
            let otp = common.generateOTP();
            let expires_at = moment().add(20, "minutes").format("YYYY-MM-DD HH:mm:ss");
    
            let sql2 = `UPDATE tbl_user SET delivery_otp = ? WHERE id = ?`;
            const [result] = await database.query(sql2, [otp, user.user_id]); // Ensure correct column name for user_id
    
            if (!result || result.affectedRows === 0) { 
                return [CODES.OPERATION_FAILED, { keyword: "otp_update_failed" }, {}];
            }
    
            const subject = "Your OTP Code";
            const message = `Hello ${User.full_name || "User"},\n\nYour OTP for delivery verification is: ${otp}\n\nThis OTP will expire at: ${expires_at} (UTC)\n\nBest Regards,\nCargo Ride`;
    
            console.log("Sending OTP Email to:", User.email);
    
            common.sendMail(subject, User.email, message, (err, info) => {
                if (err) {
                    console.error("Error sending OTP Email:", err);
                } else {
                    console.log("OTP Email Sent Successfully:", info.response);
                }
            });
    
            return [CODES.SUCCESS, { keyword: "otp_send_success" }, { driver_id: driver_id, otp: otp }];
    
        } catch (error) {
            console.error(error);
            return [CODES.OPERATION_FAILED, { keyword: "otp_send_fail" }];
        }
    }
    
    async verify_delivery_otp(driver_id, requestData) {
        try {

            let sql3 = `select * from tbl_user where delivery_otp = ?`
            const [result] = await database.query(sql3, [requestData.otp]);
    
            if (!result) { 
                return [CODES.OPERATION_FAILED, { keyword: "wrong_otp" }, {}];
            }

            let sql2 = `update tbl_order set status = "Delivered" where id = ?`
            const [result2] = await database.query(sql2, [requestData.order_id]);
            if (result.affectedRows==0) { 
                return [CODES.OPERATION_FAILED, { keyword: "status_update_error" }, {}];
            }
    
            return [CODES.SUCCESS, { keyword: "otp_verified" },{}];
    
        } catch (error) {
            console.error(error);
            return [CODES.OPERATION_FAILED, { keyword: "otp_send_fail" }];
        }
    }

    async getRating(driver_id, requestData) {
        try {
            let ratingFilter = requestData.rating; 
            
            if (ratingFilter < 1 || ratingFilter > 5) 
            {
                return [CODES.VALIDATION_ERROR, { keyword: "invalid_rating_value" }, {}];
            }
    
            let sql = `SELECT user_id, driver_id, rating, review 
                        FROM tbl_driver_rating 
                        WHERE driver_id = ? 
                        AND rating >= ? AND rating < ?`; 
    
            let data = [driver_id, ratingFilter, ratingFilter + 0.9]; // for exmple 1.0 - 1.9, 2.0 - 2.9,
    
            const [result] = await database.query(sql, data);
    
            if (!result || result.length === 0) { 
                return [CODES.OPERATION_FAILED, { keyword: "no_rating_found" }, {}];
            }
    
            return [CODES.SUCCESS, { keyword: "rating_fetched" }, { ratings: result }];
        
        } catch (error) {
            console.error(error);
            return [CODES.OPERATION_FAILED, { keyword: "server_error" }];
        }
    }

    async getPackageDetails(driver_id) {
        try {
    
            let sql = ` SELECT 
                        u.full_name AS sender_name,
                        u.email AS sender_email,
                        GROUP_CONCAT(CONCAT(u.country_code, u.mobile_number)) AS sender_mobile_number,
                        u.address AS sender_address,

                        rc.full_name AS receiver_name,
                        rc.email AS receiver_email,
                        GROUP_CONCAT(CONCAT(rc.country_code, rc.mobile_number)) AS receiver_mobile_number,
                        rc.address AS receiver_address,

                        it.type AS item_type,
                        it.notes AS item_notes,

                        o.payment,
                        o.status,
                        o.distance_km,
                        o.estimated_time_min,
                        o.delivery_date

                        FROM tbl_delivery dl
                        JOIN tbl_receiver rc ON dl.order_id = rc.order_id
                        JOIN tbl_item it ON it.order_id = dl.order_id
                        JOIN tbl_order o ON o.id = dl.order_id
                        JOIN tbl_driver dr ON dr.id = o.driver_id
                        JOIN tbl_user u ON u.id = o.user_id

                        where o.driver_id = ? and o.status = "Delivered"

                        GROUP BY 
                        u.id, u.full_name, u.email, u.address, 
                        rc.full_name, rc.email, rc.address, 
                        it.type, it.notes, o.payment, o.status, 
                        o.estimated_time_min, o.delivery_date, o.distance_km;
                    `; 
    
    
            const [result] = await database.query(sql, [driver_id]);
    
            if (result.affectedRows==0) { 
                return [CODES.OPERATION_FAILED, { keyword: "no_data_found" }, {}];
            }
    
            return [CODES.SUCCESS, { keyword: "data_fetched" }, {result}];
        
        } catch (error) {
            console.error(error);
            return [CODES.OPERATION_FAILED, { keyword: "server_error" }];
        }
    }

    async driverHistory(driver_id) {
        try {
    
            let sql = `SELECT 
                        it.type AS item_type,
                        u.full_name AS sender_name,
                        u.email AS sender_email,
                        GROUP_CONCAT(CONCAT(u.country_code, u.mobile_number)) AS sender_mobile_number,
                        u.address AS sender_address,
                        rc.full_name AS receiver_name,
                        rc.email AS receiver_email,
                        GROUP_CONCAT(CONCAT(rc.country_code, rc.mobile_number)) AS receiver_mobile_number,
                        rc.address AS receiver_address
                        FROM tbl_delivery dl
                        JOIN tbl_receiver rc ON dl.order_id = rc.order_id
                        JOIN tbl_item it ON it.order_id = dl.order_id
                        JOIN tbl_order o ON o.id = dl.order_id
                        JOIN tbl_driver dr ON dr.id = o.driver_id
                        JOIN tbl_user u ON u.id = o.user_id
                        where o.driver_id = 18 and o.status = "Delivered"
                        GROUP BY 
                        u.id, u.full_name, u.email, u.address, 
                        rc.full_name, rc.email, rc.address, 
                        it.type, it.notes, o.payment, o.status, 
                        o.estimated_time_min, o.delivery_date, o.distance_km;`; 
    
    
            const [result] = await database.query(sql, [driver_id]);
    
            if (result.affectedRows==0) { 
                return [CODES.OPERATION_FAILED, { keyword: "no_data_found" }, {}];
            }
    
            return [CODES.SUCCESS, { keyword: "history_fetched" }, {result}];
        
        } catch (error) {
            console.error(error);
            return [CODES.OPERATION_FAILED, { keyword: "server_error" }];
        }
    }
    
}

module.exports = new AuthModel();
