create database cargo_ride;
use cargo_ride;

create table tbl_user(
	id bigint primary key auto_increment,
    full_name varchar(256),
    company_name varchar(256),
    email varchar(256) unique,
    country_code VARCHAR(8),
    mobile_number varchar(16) unique,
    address text,
    latitude char(16),
    longitude char(16),
    password varchar(256),
	signup_type enum('A', 'G', 'F', 'S') DEFAULT 'S',
    login_type enum('A', 'G', 'F', 'S') DEFAULT 'S',
    social_id varchar(256),
    profile_img varchar(64) default "default.jpg",
    steps VARCHAR(10) default 0,
    is_login boolean default 0,
    last_login DATETIME,
    is_completed boolean default 0,
    is_active boolean default 1,
    is_deleted boolean default 0,
    created_at datetime default current_timestamp(),
    updated_at datetime on update current_timestamp()
);

CREATE TABLE tbl_otp (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT REFERENCES tbl_user(id),
    verify_with ENUM('M', 'E'),
    country_code VARCHAR(8),
    email_mobile VARCHAR(100),
    otp VARCHAR(6) NOT NULL,
    is_used TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
	is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

CREATE TABLE tbl_device (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT REFERENCES tbl_user(id),
    device_token VARCHAR(255),
    user_token VARCHAR(255),
    device_name VARCHAR(100),
    device_type VARCHAR(50) ,
    app_version VARCHAR(50),    
    time_zone VARCHAR(50) ,
    os_version VARCHAR(50) ,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tbl_vehicle (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    logo VARCHAR(32),
    vechicle_name VARCHAR(256),
    vehicle_weight_kg DECIMAL(10,2),
    height DECIMAL(10,2),
    width DECIMAL(10,2),
    depth DECIMAL(10,2),
    unit ENUM('cm','ft'),
    max_capacity_kg DECIMAL(10,2), 
    vehicle_category VARCHAR(64),
    is_active BOOLEAN DEFAULT 1,
    is_deleted BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP(),
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP()
);

create table tbl_pod(
	id bigint primary key auto_increment,
	full_name varchar(256),
    company_name varchar(256),
    email varchar(256) unique,
    country_code VARCHAR(8),
    mobile_number varchar(16) unique,
    address text,
    user_id bigint references tbl_user(id),
    delivery_status ENUM('Pending', 'Delivered', 'Failed') DEFAULT 'Pending',
    is_save boolean,
	is_active boolean default 1,
    is_deleted boolean default 0,
    created_at datetime default current_timestamp(),
    updated_at datetime on update current_timestamp()
);

create table tbl_receiver(
	id bigint primary key auto_increment,
    full_name varchar(256),
    email varchar(256) unique,
    country_code VARCHAR(8),
    mobile_number varchar(16) unique,
    address text,
    is_active boolean default 1,
    is_deleted boolean default 0,
    created_at datetime default current_timestamp(),
    updated_at datetime on update current_timestamp()
);

create table tbl_item(
	id bigint primary key auto_increment,
    type enum('doc','package'),
	weight decimal(10,2),
    weight_unit enum('kg','gm'),
    height decimal(10,2),
	height_unit enum('cm','ft'),
	width decimal(10,2), 
	width_unit enum('cm','ft'),
    unit enum('cm','ft'),
    notes text,
    is_active boolean default 1,
    is_deleted boolean default 0,
    created_at datetime default current_timestamp(),
    updated_at datetime on update current_timestamp()
);

create table tbl_order(
	id bigint primary key auto_increment,
    user_id bigint references tbl_user(id),
    order_number bigint default 0,
    sub_total decimal(10,2),
    tax decimal(10,2),
    discount_amt decimal(10,2),
    grand_total decimal(10,2),
    delivery_date datetime,
    total_qty bigint,
    status enum ('Pending', 'Confirmed', 'Failed'),
    estimated_price DECIMAL(10,2), 
    distance_km DECIMAL(10,2),
    estimated_time_min INT,
    is_active boolean default 1,
    is_deleted boolean default 0,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp
);

create table tbl_order_details(
	id bigint primary key auto_increment,
    order_id bigint references tbl_order(id),
    item_id bigint references tbl_item(id),
    price decimal(10,2),
    quantity INT DEFAULT 1, 
    discount DECIMAL(10,2) DEFAULT 0.00,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp
);

create table tbl_delivery(
	id bigint primary key auto_increment,
    pickup_add text,
    dropoff_add text,
    pick_up_lat char(16),
	pick_up_log char(16),
    dropoff_up_lat char(16),
	dropoff_up_log char(16),
    user_id bigint references tbl_user(id),
    order_id bigint references tbl_order(id),
    delivery_status ENUM('Pending', 'In Transit', 'Delivered', 'Order Cancelled') DEFAULT 'Pending', 
    estimated_delivery_time DATETIME,
    is_active bool default 1,
    is_deleted bool default 0,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp
);

create table tbl_notification(
	id bigint primary key auto_increment ,
    cover_image varchar(128),
    title text,
    descriptions text,
    user_id INT REFERENCES tbl_user(id),
    is_read boolean default 0, 
    read_at timestamp,
    notification_type ENUM('Success', 'Cancel', 'Alert', 'Message', 'Reminder') DEFAULT 'Message',
    is_active bool default 1,
    is_deleted bool default 0,
    created_at timestamp default current_timestamp,
    sent_at TIMESTAMP
);

create table tbl_image_report(
	id bigint primary key auto_increment,
    image_name varchar(64),
    report_id bigint references tbl_report(id),
    is_active boolean default 1,
    is_deleted boolean default 0,
    uploaded_by BIGINT REFERENCES tbl_user(id),
    created_at datetime default current_timestamp(),
    updated_at datetime on update current_timestamp()
);

create table tbl_report(
	id bigint primary key auto_increment,
    subject text,
    description text,
    user_id bigint references tbl_user(id),
    report_type ENUM('Complaint', 'Feedback', 'Bug'),
    is_active bool default 1,
    is_deleted bool default 0,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp
);

-- for driver
CREATE TABLE tbl_driver (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rider_name VARCHAR(256),
    avg_rating FLOAT(5,2),
    profile_image VARCHAR(800),
    vehicle_no VARCHAR(128),
    vehicle_type VARCHAR(128),
    latitude CHAR(16),
    longitude CHAR(16),
    availability_status ENUM('Available', 'Busy', 'Offline') DEFAULT 'Offline',
    total_orders BIGINT DEFAULT 0,
    radius DECIMAL(10,2),
    points INT DEFAULT 0,
    email VARCHAR(256) UNIQUE,
    password VARCHAR(256),
    country_code VARCHAR(8),
    mobile_number VARCHAR(16) UNIQUE,
    steps VARCHAR(10),
    is_login TINYINT(1) DEFAULT 0,
    last_login DATETIME,
    is_verified TINYINT(1) DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    is_deleted BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP(),
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP()
);

CREATE TABLE tbl_driver_availability (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    driver_id BIGINT REFERENCES tbl_driver(id),
    day TINYINT, -- Changed from day_of_week ENUM to TINYINT (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    is_deleted BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP(),
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP()
);

CREATE TABLE tbl_driver_delivery (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    driver_id BIGINT REFERENCES tbl_driver(id),
    order_id BIGINT REFERENCES tbl_order(id),
    delivery_id BIGINT REFERENCES tbl_delivery(id), 
    status ENUM('Assigned', 'On Way to Pick', 'Picked Up', 'On Way to Drop', 'Delivered'),
    otp VARCHAR(6),
    otp_verified BOOLEAN DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tbl_points_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    driver_id BIGINT REFERENCES tbl_driver(id),
    order_id BIGINT REFERENCES tbl_order(id), 
    points_earned INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tbl_driver_notification (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    driver_id BIGINT REFERENCES tbl_driver(id),
    cover_image VARCHAR(128),
    title TEXT,
    descriptions TEXT,
    is_read BOOLEAN DEFAULT 0,
    read_at TIMESTAMP,
    notification_type ENUM('Success', 'Cancel', 'Alert', 'Message', 'Reminder') DEFAULT 'Message',
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    sent_at TIMESTAMP,
    is_active BOOL DEFAULT 1,
    is_deleted BOOL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);