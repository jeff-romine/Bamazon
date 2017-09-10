DROP DATABASE IF EXISTS bamazon;

CREATE DATABASE bamazon;

USE bamazon;

CREATE TABLE products (
item_id INT NOT NULL AUTO_INCREMENT,
product_name VARCHAR(100),
department_name VARCHAR(100),
price DECIMAL(10,2),
stock_quantity INT UNSIGNED,
PRIMARY KEY (item_id));
