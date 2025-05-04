const database = require("./../config/database");
let cryptLib = require("cryptlib");
let constant = require("./../config/constant");
require("dotenv").config({ path: "../.env" });
let { default: localizify } = require("localizify");
let { t } = require("localizify");
const nodemailer = require("nodemailer");

class Common {
    async response(req, res, code, message, data) {
        try {
            const language = req.lang;
            const translatedMessage = await this.getMessage(language, message);
    
            let response = {
                code: code,
                message: translatedMessage,
                data: data,
            };

            res.send(response);
    
            // const encryptedResponse = this.encrypt(response);
            // res.send(encryptedResponse);
        } catch (error) {
            console.error("Error in response:", error);
            res.send(this.encrypt({ code: 500, message: "Internal Server Error", data: {} }));
        }
    }
    
    encrypt(data) {
        return cryptLib.encrypt(
            JSON.stringify(data),
            constant.encryptionKey,
            constant.encryptionIV
        );
    }
    
    decodeBody(data) {
        if (data && Object.keys(data).length > 0) {
            try {
                return JSON.parse(
                    this.decryptPlain(data)
                        .replace(/\0/g, "")
                        .replace(/[^\x00-\xFF]/g, "")
                );
            } catch (error) {
                console.error("Error decoding body:", error);
                return null;
            }
        } else {
            return "";
        }
    }
    
    decryptPlain(data) {
        try {
            const trimmedData = data.trim();
            return cryptLib.decrypt(trimmedData, constant.encryptionKey, constant.encryptionIV);
        } catch (error) {
            console.error("Decryption error:", error);
            return null;
        }
    }
    
    async getMessage(language, message) {   
        try {
            let translatedMessage = await t(message.keyword);
    
            if (message.content) {
                for (const key of Object.keys(message.content)) {
                    translatedMessage = translatedMessage.replace(`{ ${key} }`, message.content[key]);
                }
            }
    
            return translatedMessage;
        } catch (error) {
            console.error("Error in getMessage:", error);
            return "Translation Error";
        }
    }
    

  async checkEmail(email) {
    try {

        let sql = "SELECT id FROM tbl_user WHERE email = ? AND is_active = 1 AND is_deleted = 0 ORDER BY id DESC";
        const [results] = await database.query(sql, [email]);
        if(results.length > 0){
            return true;
        } else{
            return false;
        }
    } catch (error) {
        throw error;
    }
}

async getUserByEmailOrMobile(email, mobile_number) {
    try {
        let sql = `
            SELECT id as user_id, email, mobile_number, is_verified 
            FROM tbl_user 
            WHERE (email = ? OR mobile_number = ?) 
            AND is_active = 1 
            AND is_deleted = 0 
            ORDER BY id DESC 
            LIMIT 1`;

        const [results] = await database.query(sql, [email, mobile_number]);

        if (results.length > 0) {
            return results[0]; // Return the user object if found
        } else {
            return null; // Return null if no user is found
        }
    } catch (error) {
        throw error;
    }
}

async getDriverByEmailOrMobile(email, mobile_number) {
    try {
        let sql = `
            SELECT id as driver_id, email, mobile_number, is_verified 
            FROM tbl_driver
            WHERE (email = ? OR mobile_number = ?) 
            AND is_active = 1 
            AND is_deleted = 0 
            ORDER BY id DESC 
            LIMIT 1`;

        const [results] = await database.query(sql, [email, mobile_number]);

        if (results.length > 0) {
            return results[0]; // Return the user object if found
        } else {
            return null; // Return null if no user is found
        }
    } catch (error) {
        throw error;
    }
}



async checkdriverEmail(email) {
    try {
        console.log("called")

        let sql = "SELECT id FROM tbl_driver WHERE email = ? AND is_active = 1 AND is_deleted = 0 ORDER BY id DESC";
        const [results] = await database.query(sql, [email]);
        console.log(results)
        if(results.length > 0){
            return true;
        } else{
            return false;
        }
    } catch (error) {
        throw error;
    }
}


async checkMobile(mobile_number) {
    try {
        let sql = "SELECT id FROM tbl_user WHERE mobile_number = ? AND is_active = 1 AND is_deleted = 0 ORDER BY id DESC";
        const [results] = await database.query(sql, [mobile_number]);
        if(results.length > 0){
            return true;
        } else{
            return false;
        }
    } catch (error) {
        throw error;
    }
}

async checkdriverMobile(mobile_number) {
    try {
        let sql = "SELECT id FROM tbl_user WHERE mobile_number = ? AND is_active = 1 AND is_deleted = 0 ORDER BY id DESC";
        const [results] = await database.query(sql, [mobile_number]);
        if(results.length > 0){
            return true;
        } else{
            return false;
        }
    } catch (error) {
        throw error;
    }
}


//   checkUserVerification(steps, is_verified, callback) {
//     let sql = "SELECT id FROM tbl_user WHERE steps = 1 AND is_verified = 0 ORDER BY DESC";

//     database.query(sql, [steps, is_verified], (err, results) => {
//         if (!err && results.length > 0) {
//             callback(false);
//         } else {
//             callback(true);
//         }
//     });
//   }

async getUserInfo(user_id) {
    try {
        let sql = `SELECT u.id, u.full_name, u.email, u.mobile_number, d.device_name, d.time_zone 
                   FROM tbl_user u 
                   LEFT JOIN tbl_device d ON d.user_id = u.id 
                   WHERE u.id = ?`;  // Fixed WHERE clause
        const [res] = await database.query(sql, [user_id]);  // Parameterized Query
        return res.length > 0 ? res[0] : null;  // Return null if no user found
    } catch (error) {
        console.error("Error fetching user info:", error);
        throw error;
    }
}


  async getdriverInfo(driver_id) {
    try{
        console.log(driver_id)
        let sql = `SELECT u.full_name, u.email, u.mobile_number, u.company_name, d.device_name, d.time_zone FROM tbl_driver u left join tbl_driver_device d on d.driver_id = u.id WHERE driver_id = ${driver_id}`;
        const [res] = await database.query(sql);
        return res[0];
    } catch(error){
        throw error;
    }
  }


  async insertDevice(deviceData) {
    try{
        let sql = "INSERT INTO tbl_device SET ?";

        const [res] = await database.query(sql, deviceData);
        if (res.insertId) {
            return true;
        } else {
            return false;
        }
    } catch(error){
        throw error;
    }
    
  }

  async insertdriverDevice(deviceData) {
    try{
        console.log(deviceData)
        let sql = "INSERT INTO tbl_driver_device SET ?";

        const [res] = await database.query(sql, deviceData);
        console.log(res.insertId)
        if (res.insertId) {
            return true;
        } else {
            return false;
        }
    } catch(error){
        throw error;
    }
    
  }

  
  async deletedriverDevice(driver_id) {
    try{
        let sql = "update tbl_driver_device SET device_token = NULL, driver_token = NULL where driver_id = ?";

        const [res] = await database.query(sql, driver_id);
        if (res.affectedRows>0) {
            return true;
        } else {
            return false;
        }
    } catch(error){
        throw error;
    }
    
  }


  async getUser(data) {
    try {
        let sql = `SELECT id, email, mobile_number, is_active, is_verified, password,steps FROM tbl_user WHERE ${data}`;
        const [res] = await database.query(sql);
        if (res.length > 0) {
            return res[0]; 
        } else {
            return false;
        }
    } catch (error) {
        throw error;
    }
}

async getDriver(data) {
    try {
        let sql = `SELECT id, email, mobile_number, is_active, is_verified, password,steps FROM tbl_driver WHERE ${data}`;
        const [res] = await database.query(sql);
        if (res.length > 0) {
            return res[0]; 
        } else {
            return false;
        }
    } catch (error) {
        throw error;
    }
}

async getOTP(data) {
    try {
        let sql = `SELECT user_id, otp FROM tbl_otp WHERE ${data}`;
        const [result] = await database.query(sql);
        return result.length > 0 ? result[0] : false;
        
    } catch (error) {
        console.error("Error in getOTP:", error);
        return false;
    }
  }

  async getOTPd(data) {
    try {
        let sql = `SELECT driver_id, otp FROM tbl_otp WHERE ${data}`;
        const [result] = await database.query(sql);
        return result.length > 0 ? result[0] : false;
        
    } catch (error) {
        console.error("Error in getOTP:", error);
        return false;
    }
  }

  async checkOTP(user_id, data) {
    try {
        let sql = "SELECT id FROM tbl_otp WHERE email_mobile = ? AND is_active = 1 AND is_deleted = 0";
        const [result] = await database.query(sql, [user_id]);

        if (result.length > 0) {
            let deleteResponse = await this.deleteOTP(user_id);
            if (deleteResponse) {
                return await this.insertOTP(data);
            } else {
                return false;
            }
        } else {
            return await this.insertOTP(data);
        }
    } catch (error) {
        return false;
    }
  }

  async insertOTP(data) {
    try {
        let sql = "INSERT INTO tbl_otp SET ?";
        const [insertResponse] = await database.query(sql, data);
        console.log(insertResponse);
        
        return insertResponse.affectedRows > 0;
    } catch (error) {
        return false;
    }
  }

  async deleteOTP(user_id) {
    try {
        let sql = "DELETE FROM tbl_otp WHERE user_id = ?";
        const [result] = await database.query(sql, [user_id]);
        return result.affectedRows > 0;
    } catch (error) {
        return false;
    }
  }

  async deleteoTP(driver_id) {
    try {
        let sql = "DELETE FROM tbl_otp WHERE driver_id = ?";
        const [result] = await database.query(sql, [driver_id]);
        return result.affectedRows > 0;
    } catch (error) {
        return false;
    }
  }

  async updateUserData(driver_id, data) {
    try {
        if (Object.keys(data).length === 0 || data == null || data === "") {
            return true;
        }

        let sql = `UPDATE tbl_user SET ? WHERE id = ?`;
        const [result] = await database.query(sql, [data, driver_id]);

        return result.affectedRows > 0;
    } catch (error) {
        return false;
    }
}

async updateDriverData(user_id, data) {
    try {
        if (Object.keys(data).length === 0 || data == null || data === "") {
            return true;
        }

        let sql = `UPDATE tbl_driver SET ? WHERE id = ?`;
        const [result] = await database.query(sql, [data, user_id]);

        return result.affectedRows > 0;
    } catch (error) {
        return false;
    }
}

async updateDeviceData(deviceData, userID) {
    try {
        let sql = "UPDATE tbl_device SET ? WHERE user_id = ?";
        const [results] = await database.query(sql, [deviceData, userID]);
        return true;
    } catch (err) {
        return false;
    }
}

async updateDDeviceData(deviceData, userID) {
    try {
        let sql = "UPDATE tbl_driver_device SET ? WHERE driver_id = ?";
        const [results] = await database.query(sql, [deviceData, userID]);
        return true;
    } catch (err) {
        return false;
    }
}



  generateToken() {
    var randtoken = require("rand-token").generator();
    var usersession = randtoken.generate(
      64,
      "0123456789abcdefghijklnmopqrstuvwxyz"
    );

    return usersession;
  }

  generateOTP() {
    return Math.floor(1000 + Math.random() * 9000);
  }


  requestValidation(v) {
    var error = "";
    if(v.fails()) {
        var Validator_errors = v.getErrors();
        for (var key in Validator_errors) {
            error = Validator_errors[key][0];
            break;
        }
        var response_data = {
            code: true,
            message: error
        }
        return response_data;
    } else {
        var response_data = {
            code : false,
            message: ""
        };
        return response_data;
    }
}

async sendMail(subject, to_email, htmlContent) {
    try {
        if (!to_email || to_email.trim() === "") {
            throw new Error("Recipient email is empty or undefined!");
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: constant.mailer_email,
                pass: constant.mailer_password
            }
        });

        const mailOptions = {
            from: constant.from_email,
            to: to_email,
            subject: subject,
            html: htmlContent,
            text: "Please enable HTML to view this email.",
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(info)

;
        return { success: true, info };
    } catch (error) {
        console.log(error);
        return { success: false, error };
    }
}

async requestValidation(v) {
    if (v.fails()) {
        const Validator_errors = v.getErrors();
        const error = Object.values(Validator_errors)[0][0];
        return {
            code: true,
            message: error
        };
    } 
    return {
        code: false,
        message: ""
    };
}


async addVehicle(vehicle_data, driver_id) {
    try {
        
        vehicle_data.driver_id = driver_id;
        let sql = "INSERT INTO tbl_driver_vehicle SET ?";
        const [insertResponse] = await database.query(sql, [vehicle_data]);

        return insertResponse;
    } catch (error) {
        console.error("Error inserting vehicle:", error);
        return false;
    }
}


async insertResetToken(data) {
    try {
        const result = await database.query("INSERT INTO tbl_reset_password SET ?", [data]);
        return result;
    } catch (error) {
        console.error("Error inserting reset token:", error);
        return false;
    }
}

async getResetToken(condition) {
    try {
        const result = await database.query(`SELECT * FROM tbl_reset_password WHERE ${condition}`);
        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error("Error fetching reset token:", error);
        return null;
    }
}

async updateUserPassword(driver_id, hashedPassword) {
    try {
        const result = await database.query("UPDATE tbl_driver SET password = ? WHERE id = ?", [hashedPassword, driver_id]);
        return result;
    } catch (error) {
        console.error("Error updating user password:", error);
        return false;
    }
}

async deleteResetToken(driver_id) {
    try {
        const result = await database.query("DELETE FROM tbl_reset_password WHERE driver_id = ?", [driver_id]);
        return result;
    } catch (error) {
        console.error("Error deleting reset token:", error);
        return false;
    }
}


async insertvehId(deviceData, user_id) {
    try {
        let sql = "UPDATE tbl_delivery SET ? WHERE user_id = ?";
        const [results] = await database.query(sql, [deviceData, user_id]);
        return true;
    } catch (err) {
        return false;
    }
}

async addRadius(driver_id, availability_radius_km) {
    try {
        let sql = "UPDATE tbl_driver SET availability_radius_km = ? WHERE id = ? AND is_active = 1 AND is_deleted = 0";
        const [result] = await database.query(sql, [availability_radius_km, driver_id]);

        if (result.affectedRows > 0) {
            console.log("Radius updated successfully for driver:", driver_id);
            return true; 
        } else {
            console.log("No rows updated. Driver ID may not exist or conditions not met.");
            return false;
        }
    } catch (error) {
        console.error("Error in addRadius:", error);
        return false;
    }
}
}

module.exports = new Common();
