let database = require("../../../../../config/database");
let md5 = require("md5");
let CODES = require("../../../../../utilities/response-error-code");
let common = require("../../../../../utilities/common");
let constant = require("../../../../../config/constant");
const moment = require("moment");
const dayjs = require("dayjs");
const haversine = require('haversine-distance');


class AuthModel {

    async signUp(requestData) {
        try {
            const existingUser = await common.getUserByEmailOrMobile(requestData.email, requestData.mobile_number);
    
            if (existingUser) {
                if (existingUser.is_verified === 0) {
                    // User exists but is not verified - resend OTP
                    const otpCode = common.generateOTP();
                    const otpExpiry = moment().add(20, "minutes").format("YYYY-MM-DD HH:mm:ss");
                    const otpData = {
                        user_id: existingUser.user_id,
                        mobile_number: requestData.mobile_number,
                        country_code: requestData.country_code,
                        otp: otpCode,
                        expires_at: otpExpiry
                    };
    
                    const otpResponse = await common.insertOTP(otpData);
                    if (!otpResponse) {
                        return [CODES.OPERATION_FAILED, { keyword: "otp_send_fail" }, {}];
                    }
    
                    return [CODES.SUCCESS, { keyword: "otp_resent" }, { otp: otpCode }];
                }
    
                // User already exists and is verified
                return [CODES.OPERATION_FAILED, { keyword: "user_already_exists" }, {}];
            }
    
            // Proceed with new signup process
            const signUpData = {
                full_name: requestData.full_name,
                address: requestData.address,
                latitude: requestData.latitude,
                longitude: requestData.longitude,
                email: requestData.email,
                country_code: requestData.country_code,
                mobile_number: requestData.mobile_number,
                steps: 1,
                updated_at: moment().utc().format("YYYY-MM-DD HH:mm:ss"),
            };
    
            if (requestData.signup_type === "S") {
                signUpData.password = md5(requestData.password);
                signUpData.signup_type = requestData.signup_type;
            } else if (["G", "F", "A"].includes(requestData.signup_type)) {
                signUpData.signup_type = requestData.signup_type;
                signUpData.social_id = requestData.social_id;
                signUpData.steps = 3;
                signUpData.is_verified = 1;
            }
    
            let sql = "INSERT INTO tbl_user SET ?";
            const [data] = await database.query(sql, [signUpData]);
    
            if (!data.insertId) {
                return [CODES.OPERATION_FAILED, { keyword: "user_reg_fail" }, {}];
            }
    
            let user_id = data.insertId;
    
            let deviceData = {
                user_id: user_id,
                device_token: requestData.device_token,
                device_type: requestData.device_type,
                user_token: common.generateToken(),
                time_zone: requestData.time_zone,
                ...(requestData.device_name && { device_name: requestData.device_name }),// spread operator used bcz of mltiple if condition
                ...(requestData.os_version && { os_version: requestData.os_version }),
                ...(requestData.app_version && { app_version: requestData.app_version })
            };
    
            const deviceInsert = await common.insertDevice(deviceData);
    
            if (!deviceInsert) {
                return [CODES.OPERATION_FAILED, { keyword: "device_insert_fail" }, {}];
            }
    
            let otp = null;
            if (requestData.signup_type === "S") {
                const otpCode = common.generateOTP();
                const otpExpiry = moment().add(20, "minutes").format("YYYY-MM-DD HH:mm:ss");
                const otpData = {
                    user_id: user_id,
                    mobile_number: requestData.mobile_number,
                    country_code: requestData.country_code,
                    otp: otpCode,
                    expires_at: otpExpiry
                };
                const otpResponse = await common.insertOTP(otpData);
                if (!otpResponse) {
                    return [CODES.OPERATION_FAILED, { keyword: "otp_send_fail" }, {}];
                }
            }
    
            const userInfo = await common.getUserInfo(user_id);
            if (!userInfo) {
                return [CODES.OPERATION_FAILED, { keyword: "err_signup" }, {}];
            }
    
            return [CODES.SUCCESS, { keyword: "reg_success" }, { userInfo, ...(otp ? { otp } : {}) }];
    
        } catch (error) {
            console.log(error);
            return [CODES.NOT_APPROVE, { keyword: "err" }, {}];
        }
    }
    
     async verifyUser(requestData) {
        try {
    
            // Validate required fields
            if (!requestData.mobile_number || !requestData.country_code || !requestData.otp) {
                return [CODES.OPERATION_FAILED, { keyword: "invalid_request_data" }, {}];
            }
    
            // Construct SQL query for OTP verification
            let sql = `mobile_number = '${requestData.mobile_number}' AND country_code = '${requestData.country_code}' AND is_active = 1 AND is_deleted = 0`;
    
            let otpResult = await common.getOTP(sql);
    
            if (!otpResult || !otpResult.otp) {
                return [CODES.OPERATION_FAILED, { keyword: "otp_not_found" }, {}];
            }
    
    
            if (String(otpResult.otp) !== String(requestData.otp)) {
                return [CODES.OTP_NOT_VERIFIED, { keyword: "otp_mismatch" }, {}];
            }
    
            if (!requestData.flag) {
                return [CODES.OPERATION_FAILED, { keyword: "otp_verification_incomplete" }, {}];
            }
    
            let user_id = otpResult.user_id;
    
            let updateData = { is_verified: 1, steps: 2 };
            let updateResponse = await common.updateUserData(user_id, updateData);
    
            let deleteOtpResponse = await common.deleteOTP(user_id);
    
            let userInfo = await common.getUserInfo(user_id);
            if (!userInfo) {
                return [CODES.OPERATION_FAILED, { keyword: "err_get_user" }, {}];
            }
    
            return [CODES.SUCCESS, { keyword: "user_verified" }, { userInfo }];
    
        } catch (error) {
            console.log(error)
            return [CODES.OPERATION_FAILED, { keyword: "err" }, {}];
        }
    }
    
    async login(requestData) {
        try {
            let sql, values;
    
            if (requestData.login_type === "S")
                 {
                sql = `SELECT * FROM tbl_user WHERE email = ? AND password = ?`;
                values = [requestData.email, md5(requestData.password)];
            } else {
                sql = `SELECT * FROM tbl_user WHERE login_type = ? AND social_id = ?`;
                values = [requestData.login_type, requestData.social_id];
            }
    
            const [result] = await database.query(sql, values);
            if (!result.length) {
                return [
                    CODES.OPERATION_FAILED, 
                    { keyword: "err" }, 
                    {}
                ];
            }
    
            let user = result[0];

            if (user.is_deleted === 1) {
                return [
                    CODES.OPERATION_FAILED, 
                    { keyword: "deleted_user" }, 
                    {}
                ];
            }
            if (user.is_active === 0) {
                return [
                    CODES.OPERATION_FAILED, 
                    { keyword: "inactive_user" }, 
                    {}
                ];
            }
            if (user.is_verified === 0) {
                return [
                    CODES.OPERATION_FAILED, 
                    { keyword: "not_verified" }, 
                    {}
                ];
            }
    
            const updateUserData = {
                steps: 3,
                is_login: 1,
                last_login: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            };
    
            const updateResponse = await common.updateUserData(user.id, updateUserData);
            if (!updateResponse) {
                return [
                    CODES.OPERATION_FAILED, 
                    { keyword: "user_update_err" }, 
                    {}
                ];
            }
    
            let deviceData = {
                user_id: user.id,
                device_token: requestData.device_token,
                device_type: requestData.device_type,
                user_token: common.generateToken(),
                time_zone: requestData.time_zone,
                ...(requestData.device_name != undefined && requestData.device_name != "" && {  device_name: requestData.device_name,}),
                ...(requestData.os_version != undefined && requestData.os_version != "" && {  os_version: requestData.os_version, }),
                ...(requestData.app_version != undefined && requestData.app_version != "" && { app_version: requestData.app_version, })
            };
    
            const deviceResponse = await common.updateDeviceData(deviceData, user.id);
            if (!deviceResponse) {
                return [
                    CODES.OPERATION_FAILED, 
                    { keyword: "err_update_device" }, 
                    {}
                ];
            }
    
            const userInfo = await common.getUserInfo(user.id);
            if (!userInfo) {
                return [
                    CODES.OPERATION_FAILED, 
                    { keyword: "signup_err" }, 
                    {}
                ];
            }
    
            return [
                CODES.SUCCESS, 
                { keyword: "login_success" }, 
                { userInfo }

            ];
    
        } catch (error) {
            
            return [CODES.NOT_REGISTER, 
                { keyword: "err" }, 
                {}
            ];
        }
    }
    
    async resendOTP(requestData) {
        try {
            let otpData = {
                mobile_number: requestData.mobile_number,
                country_code: requestData.country_code,
            };
    
            let data = `mobile_number = '${requestData.mobile_number}' AND country_code = '${requestData.country_code}' AND is_active = 1 AND is_deleted = 0`;
    
    
            const userResult = await common.getUser(data);
            if (!userResult) {
                return [CODES.OPERATION_FAILED, { keyword: "no_data_found" }, {}];
            }
    
            otpData.user_id = userResult.id;
            otpData.otp = common.generateOTP();
            otpData.expires_at = moment().add(20, "minutes").format("YYYY-MM-DD HH:mm:ss");
    
    
            const deleteResponse = await common.deleteOTP(otpData.user_id);
            if (!deleteResponse) {
                return [CODES.OPERATION_FAILED, { keyword: "otp_delete_fail" }, {}];
            }
        
            const otpResponse = await common.insertOTP(otpData);
            if (!otpResponse) {
                return [CODES.OPERATION_FAILED, { keyword: "otp_send_fail" }, {}];
            }
        
            return [CODES.SUCCESS, { keyword: "otp_send_success" }, { user_id: otpData.user_id, otp: otpData.otp }];
            
        } catch (error) {
            console.error("Unexpected Error in sendOTP:", error);
            return [CODES.OPERATION_FAILED, { keyword: "otp_send_fail", error: error.message }, {}];
        }
    }
   
    async verifyForgotPassword(requestData) {
        try {
            let sql = `mobile_number = '${requestData.mobile_number}' 
                       AND country_code = '${requestData.country_code}' 
                       AND is_active = 1 
                       AND is_deleted = 0`;
    
            let otpResult = await common.getOTP(sql);
            if (!otpResult || !otpResult.otp) {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: "otp_not_found" },
                    {}
                ];
            }
            if (otpResult.otp !== requestData.otp) {
                return [
                    CODES.OTP_NOT_VERIFIED,
                    { keyword: "otp_mismatch" },
                    {}
                ];
            }
            if (moment().isAfter(moment(otpResult.expires_at))) {
                return [
                    CODES.OTP_EXPIRED,
                    { keyword: "otp_expired" },
                    {}
                ];
            }
            let user_id = otpResult.user_id;
            let updateData = {
                steps: 4
            };
            let updateResponse = await common.updateUserData(user_id, updateData);
            if (!updateResponse) {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: "user_update_fail" },
                    {}
                ];
            }

            let deleteOtpResponse = await common.deleteOTP(user_id);
            if (!deleteOtpResponse) {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: "rest_keyword_otp_delete_failed" },
                    {}
                ];
            }
            let userInfo = await common.getUserInfo(user_id);
            if (!userInfo) {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: "rest_keyword_something_went_wrong" },
                    {}
                ];
            }
            return [
                CODES.SUCCESS,
                { keyword: "forgot_password_verified" },
                { userInfo }
            ];
    
        } catch (error) {
            return [
                CODES.OPERATION_FAILED,
                { keyword: "txt_error_verify_forgot_password", error: error.message },
                {}
            ];
        }
    }

    async setPassword(requestData) {
        try {
            let sql = `id = '${requestData.user_id}' AND is_active = 1 AND is_deleted = 0`;
            let userInfo = await common.getUser(sql);
    
            if (!userInfo) {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: "txt_user_not_found" },
                    {}
                ];
            }
    
            if (userInfo.steps !== 4) {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: "txt_invalid_reset_step" },
                    {}
                ];

            }
    
            let old_password = userInfo.password;
            
            let new_password = md5(requestData.password);
            
            // Check if new password is the same as old password
            if (old_password === new_password) {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: "txt_password_mismatch" },
                    {}
                ];
            }
    
            // Update password and steps
            let updateData = {
                password: new_password,
            };
            let updateResponse = await common.updateUserData(requestData.user_id, updateData);
    
            if (!updateResponse) {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: "rest_keyword_update_failed" },
                    {}
                ];
            }
    
            // Fetch updated user info
            let updatedUserInfo = await common.getUserInfo(requestData.user_id);
            if (!updatedUserInfo) {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: "rest_keyword_something_went_wrong" },
                    {}
                ];
            }
    
            return [
                CODES.SUCCESS,
                { keyword: "password_reset_success" },
                { userInfo: updatedUserInfo }
            ];
    
        } catch (error) {
            console.error("Error in setPassword:", error);
            return [
                CODES.OPERATION_FAILED,
                { keyword: "txt_error_set_password", error: error.message },
                {}
            ];
        }
    }   
    
   async changePassword(user_id,requestData) {
    try {
        let userResult = await common.getUser(`id = '${user_id}' AND is_active = 1 AND is_deleted = 0`);
        if (!userResult) {
            return [
                CODES.OPERATION_FAILED,
                { keyword: "txt_user_not_found" },
                {}
            ];
        }
        // Verify old password
        if (userResult.password !== md5(requestData.old_password)) {
            return [
                CODES.OPERATION_FAILED,
                { keyword: "txt_old_password_incorrect" },
                {}
            ];
        }
        let hashedPassword = md5(requestData.new_password);
        let updateData = { password: hashedPassword };
        let updateResponse = await common.updateUserData(userResult.id, updateData);

        if (!updateResponse) {
            return [
                CODES.OPERATION_FAILED,
                { keyword: "txt_password_change_failed" },
                {}
            ];
        }
        return [
            CODES.SUCCESS,
            { keyword: "password_change_success" },
            {}
        ];
    } catch (error) {
        return [
            CODES.OPERATION_FAILED,
            { keyword: "txt_error_change_password", error: error.message },
            {}
        ];
    }
    }

    async logout(user_id,requestData)
    {
        try {
            let updateData = { is_login:0 };
            let updateResponse = await common.updateUserData(user_id, updateData);
    
            if (!updateResponse) {
                return [
                    CODES.OPERATION_FAILED,
                    { keyword: "txt_logout_failed" },
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
            return [
                CODES.OPERATION_FAILED,
                { keyword: "txt_error_logout", error: error.message },
                {}
            ];
        }
    
    }

    async vehicleListing(user_id, requestData) {
        try {
            const vehicle_data = {
                user_id: user_id,
                order_id: requestData.order_id,
                pickup_address: requestData.pick_up_address,
                pick_up_latitude: requestData.pick_up_latitude,
                pick_up_longitude: requestData.pick_up_longitude,
                dropoff_address: requestData.dropoff_address,
                dropoff_latitude: requestData.dropoff_latitude,
                dropoff_longitude: requestData.dropoff_longitude
            };
    
            const pickupCoords = { latitude: parseFloat(requestData.pick_up_latitude), longitude: parseFloat(requestData.pick_up_longitude) };
            const dropoffCoords = { latitude: parseFloat(requestData.dropoff_latitude), longitude: parseFloat(requestData.dropoff_longitude) };
            const distance = haversine(pickupCoords, dropoffCoords) / 1000; // meter to kilometer
    
            let fetchSQL = `SELECT * FROM tbl_vehicle WHERE is_active = 1 AND is_deleted = 0`;
            const [vehicles] = await database.query(fetchSQL);
    
            const vehicleEstimates = vehicles.map(vehicle => {
                const speed = vehicle.avg_speed_kmh;
                const estimated_time = Math.ceil((distance / speed) * 60); // in minutes
                const estimated_price = (distance * vehicle.price_km).toFixed(2); 
    
                return {
                    vehicle_id: vehicle.id,  
                    vehicle_name: vehicle.vehicle_name,
                    logo: constant.image_base_url + vehicle.logo,
                    weight_capacity: vehicle.vehicle_weight_capacity_kg,
                    dimensions: `${vehicle.height} x ${vehicle.width} x ${vehicle.depth} ${vehicle.unit}`,
                    estimated_price,
                    estimated_time_min: estimated_time
                };
            });
    
            vehicle_data.estimated_delivery_distance = distance;
            // vehicle_data.order_id = requestData.order_id;
    
            let insertSQL = `INSERT INTO tbl_delivery SET ?`;
            const [insertResult] = await database.query(insertSQL, [vehicle_data]);
    
            if (insertResult.affectedRows === 0) {
                return [CODES.OPERATION_FAILED, { keyword: "fail_add_delivery" }, {}];
            }
    
            for (const vehicle of vehicleEstimates) {
                const insertData = {
                    user_id: user_id,
                    vehicle_id: vehicle.vehicle_id,
                    price: vehicle.estimated_price,
                    time: vehicle.estimated_time_min,
                    distance: distance
                };
    
                let insertdata = `INSERT INTO tbl_price_time_distance SET ?`;
                const [result] = await database.query(insertdata, [insertData]);
    
                if (result.affectedRows === 0) {
                    console.error(`Failed to insert vehicle data: ${vehicle.vehicle_name}`);
                }
            }
    
            return {
                code: CODES.SUCCESS,
                message: { keyword: "operation_successful" },
                data: { 
                    distance_km: distance.toFixed(2),
                    vehicles: vehicleEstimates
                }
            };    
        } catch (error) {
            console.error("Error in vehicleListing:", error);
            return [CODES.OPERATION_FAILED, { keyword: "server_error" }, {}];
        }
    }

    async confirm_booking(user_id, requestData) {
        try {
            const { order_id, vehicle_id, pod, pod_details, package_details, receiver_details } = requestData;
    
            let fetchPriceSQL = `SELECT price, time, distance FROM tbl_price_time_distance WHERE vehicle_id = ? AND user_id = ?`;
            const [priceData] = await database.query(fetchPriceSQL, [vehicle_id, user_id]);
    
            if (!priceData.length) {
                return [CODES.OPERATION_FAILED, { keyword: "price_data_not_found" }, {}];
            }
    
            const { price, time, distance } = priceData[0];
    
            let fetchVehicleSQL = `SELECT * FROM tbl_vehicle WHERE id = ?`;
            const [vehicleData] = await database.query(fetchVehicleSQL, [vehicle_id]);
    
            if (!vehicleData.length) {
                return [CODES.OPERATION_FAILED, { keyword: "vehicle_not_found" }, {}];
            }
    
            // Calculate sub_total 
            let sub_total = price;
            if (pod && pod_details) {
                sub_total += 200;
            }
    
            let insertOrderSQL = `INSERT INTO tbl_order 
            (user_id, estimated_price, estimated_time_min, distance_km, sub_total, delivery_date, is_active, is_deleted) 
            VALUES (?, ?, ?, ?, ?, ?, 1, 0)`;
        
        const [orderResult] = await database.query(insertOrderSQL, [
            user_id,
            price,
            time,
            distance,
            sub_total,
            requestData.delivery_date
        ]);
    
            if (orderResult.affectedRows === 0) {
                return [CODES.OPERATION_FAILED, { keyword: "order_insert_failed" }, {}];
            }
    
            const new_order_id = orderResult.insertId; 
    
            let updateSQL = `UPDATE tbl_delivery SET vehicle_id = ? WHERE order_id = ? AND user_id = ?`;
            const [updateResult] = await database.query(updateSQL, [vehicle_id, order_id, user_id]);
    
            if (updateResult.affectedRows === 0) {
                return [CODES.OPERATION_FAILED, { keyword: "update_failed" }, {}];
            }
    
            let responseData = { order_id: new_order_id, vehicle_id };
    
            if (pod && pod_details) {
                const { full_name, company_name, email, country_code, mobile_number, address, is_save } = pod_details;
    
                let insertPODSQL = `INSERT INTO tbl_pod 
                    (user_id, full_name, company_name, email, country_code, mobile_number, address, is_save, delivery_status, is_active, is_deleted) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 1, 0)`;
    
                const [insertResult] = await database.query(insertPODSQL, [
                    user_id,
                    full_name || null,
                    company_name || null,
                    email || null,
                    country_code || null,
                    mobile_number || null,
                    address || null,
                    is_save ? 1 : 0
                ]);
    
                if (insertResult.affectedRows === 0) {
                    return [CODES.OPERATION_FAILED, { keyword: "pod_insert_failed" }, {}];
                }
    
                responseData.pod_id = insertResult.insertId;
            }
    
            let item_id = null;
            if (package_details) {
                const { type, weight, weight_unit, height, height_unit, width, width_unit, unit, notes } = package_details;
    
                let insertPackageSQL = `INSERT INTO tbl_item 
                    (user_id, order_id, type, weight, weight_unit, height, height_unit, width, width_unit, unit, notes, is_active, is_deleted) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`;
    
                const [packageResult] = await database.query(insertPackageSQL, [
                    user_id,
                    new_order_id,
                    type || "package",
                    weight || null,
                    weight_unit || "kg",
                    height || null,
                    height_unit || "ft",
                    width || null,
                    width_unit || "ft",
                    unit || "kg",
                    notes || null
                ]);
    
                if (packageResult.affectedRows === 0) {
                    return [CODES.OPERATION_FAILED, { keyword: "package_insert_failed" }, {}];
                }
    
                item_id = packageResult.insertId;
                responseData.package_id = item_id;
            }
    
            if (item_id) {
                let insertOrderDetailsSQL = `INSERT INTO tbl_order_details (order_id, item_id, is_active, is_deleted) VALUES (?, ?, 1, 0)`;
                const [orderDetailsResult] = await database.query(insertOrderDetailsSQL, [new_order_id, item_id]);
    
                if (orderDetailsResult.affectedRows === 0) {
                    return [CODES.OPERATION_FAILED, { keyword: "order_details_insert_failed" }, {}];
                }
            }
    
            if (receiver_details) {
                const { full_name, email, country_code, mobile_number, address } = receiver_details;
    
                let insertReceiverSQL = `INSERT INTO tbl_receiver 
                    (user_id, order_id, full_name, email, country_code, mobile_number, address, is_active, is_deleted) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)`;
    
                const [receiverResult] = await database.query(insertReceiverSQL, [
                    user_id,
                    new_order_id,
                    full_name || null,
                    email || null,
                    country_code || null,
                    mobile_number || null,
                    address || null
                ]);
    
                if (receiverResult.affectedRows === 0) {
                    return [CODES.OPERATION_FAILED, { keyword: "receiver_insert_failed" }, {}];
                }
    
                responseData.receiver_id = receiverResult.insertId;
            }

            let sql = `INSERT INTO tbl_notification (receiver_id, title, type, description) 
            VALUES (?, "Order place", "Message", "Order placed successfully")`;
 
            const [notification] = await database.query(sql, [user_id]);
 
            return [CODES.SUCCESS, { keyword: "booking_confirmed_successfully" }, responseData];
    
        } catch (error) {
            console.error("Error in confirm_booking:", error);
            return [CODES.SERVER_ERROR, { keyword: "server_error" }, {}];
        }
    }
    
    async packageDetails(user_id, requestData) {
        try {
            let order_id = requestData.order_id;
    
            let fetchSQL = `SELECT o.id,dl.pickup_address,dl.pick_up_latitude,dl.pick_up_longitude, dl.dropoff_address,dl.dropoff_latitude,dl.dropoff_longitude, rc.id as receiver_id, rc.full_name, rc.email, rc.country_code, rc.mobile_number, 
                            it.type, it.notes, o.payment, o.status, dr.profile_img, dr.full_name, dr.avg_rating, 
                            o.distance_km, o.estimated_time_min, o.delivery_date, o.sub_total
                            FROM tbl_delivery dl
                            JOIN tbl_receiver rc ON dl.order_id = rc.order_id
                            JOIN tbl_item it ON it.order_id = dl.order_id
                            JOIN tbl_order o ON o.id = dl.order_id
                            JOIN tbl_driver dr ON dr.id = o.driver_id 
                            WHERE o.id = ?`;
    
                            const [result] = await database.query(fetchSQL, [order_id]);

                            if (!result || result.length === 0) {
                                return {
                                    code: CODES.NOT_FOUND,
                                    message: { keyword: "package_not_found" },
                                    data: {}
                                };
                            }
    
                            return {
                                code: CODES.SUCCESS,
                                message: { keyword: "package_fetched_successfully" },
                                data: result[0]  // Extracting the first object instead of returning an array
                            };    
        } catch (error) {
            console.error( error);
            return [CODES.SERVER_ERROR, { keyword: "server_error" }, {}]; 
        }
    }
    
    async showOrders(user_id, requestData) {
        try {
    
            const userData = await common.getUserInfo(user_id);
            if (!userData) {  
                return [
                    CODES.UNAUTHORIZED,
                    { keyword: "unauthorized_access" },
                    {}
                ];
            }
    
            let whereFilter;
            if (requestData.type === "Running") {
                whereFilter = `AND o.status IN ('WayToPickUp', 'WayToDropOff')`;
            } else if (requestData.type === "Upcoming") {
                whereFilter = `AND o.status IN ('Confirmed', 'Waiting')`;
            } else if (requestData.type === "History") {
                whereFilter = `AND o.status IN ('Delivered', 'Cancelled')`;
            } else {
                whereFilter = `AND o.status IN ('WayToPickUp', 'WayToDropOff')`;
            }
    
            let sql = `
                SELECT 
                    it.type, 
                    rc.full_name, 
                    rc.email, 
                    GROUP_CONCAT(CONCAT(rc.country_code, rc.mobile_number)) AS mobile_number, 
                    o.id, 
                    o.delivery_date,
                    o.status
                FROM tbl_item it
                JOIN tbl_receiver rc ON it.order_id = rc.order_id
                JOIN tbl_order o ON o.id = rc.order_id 
                WHERE o.user_id = ?
                ${whereFilter}
                GROUP BY o.id, it.type, rc.full_name, rc.email, o.delivery_date
                ORDER BY o.created_at DESC;
            `;
    
            const [result] = await database.query(sql, [user_id]);
    
            if (result.length > 0) {
                return [
                    CODES.SUCCESS,
                    { keyword: "data_found" },
                    { result }
                ];
            } else {
                return [
                    CODES.NO_DATA_FOUND,
                    { keyword: "text_no_data_found" },
                    {}
                ];
            }
        } catch (error) {
            console.error(error);
            return [
                CODES.SERVER_ERROR,
                { keyword: "server_error" },
                {}
            ];
        }
    }
     
    async addRating(user_id, requestData) {
        try {
            const { driver_id, rating, review } = requestData;
        
            // if (!user_id || !driver_id || !rating) {
            //     return [CODES.BAD_REQUEST, { keyword: "missing_parameters" }, {}];
            // }
    
            let sql = `INSERT INTO tbl_driver_rating (user_id, driver_id, rating, review) VALUES (?, ?, ?, ?)`;
    
            const [result] = await database.query(sql, [user_id, driver_id, rating, review]);
    
            if (result.affectedRows === 0) {
                return [CODES.NOT_FOUND, { keyword: "rating_err" }, {}];
            }
    
            return [CODES.SUCCESS, { keyword: "rating_success" }, { insertId: result.insertId }];
    
        } catch (error) {
            console.error(error);
            return [CODES.SERVER_ERROR, { keyword: "server_error" }, {}]; 
        }
    }

    async getNotification(user_id) {
        try {
    
            let fetchSQL = `SELECT receiver_id as user_id ,title,type,description from tbl_notification where receiver_id = ?`;
    
            const [noti] = await database.query(fetchSQL, [user_id]);
    
            if (!noti || noti.length === 0) {
                return [CODES.NOT_FOUND, { keyword: "err" }, {}];
            }
    
            return [CODES.SUCCESS, { keyword: "noti_fetch" }, noti];
    
        } catch (error) {
            console.error( error);
            return [CODES.SERVER_ERROR, { keyword: "server_error" }, {}]; 
        }
    }

    async cancel_order(user_id,requestData)
    {
        try {
            let sql = `select * from tbl_order where order_id = ? and status not in ("Delivered")`;
            const [order] = await database.query(sql, [requestData.order_id]);
            if (!order || order.length === 0) {
                return [CODES.NOT_FOUND, { keyword: "order_not_found" }, {}];
                }
                let sql2 = `update tbl_order set status = "Cancelled" where order_id = ?`;
                const [result] = await database.query(sql2, [requestData.order_id]);

                return [CODES.SUCCESS, { keyword: "order_cancelled" }];
            
        } catch (error) {
            console.log(error)
            return [CODES.SERVER_ERROR, { keyword: "server_error" }, {}];

        }
    }
}

module.exports = new AuthModel();
