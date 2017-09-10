var inquirer = require("inquirer");
var mysql = require('mysql');
var mysqlCredentials = require('./mysql-credentials.js');

mysqlCredentials.database = 'bamazon';

var connection = mysql.createConnection(
    mysqlCredentials
);

connection.query("SELECT * FROM products order by item_id", productListingHandler);

const ID_WIDTH = 5;

const PRODUCT_NAME_WIDTH = 60;

const PRICE_WIDTH = 10;

const PRODUCT_FORMAT_STRING = "|%s|%s|%s|";

function padColumn(raw,len,padString,fromStart) {
    const col = raw.toString().trim();

    if (fromStart) {
        return col.padEnd(col.length + 1,padString).padStart(len,padString);
    }
    else {
        return col.padStart(col.length + 1,padString).padEnd(len,padString);
    }
}

function logProductRow(id, productName, price, padString) {
    console.log(
        PRODUCT_FORMAT_STRING,
        padColumn(id,ID_WIDTH,padString,true),
        padColumn(productName,PRODUCT_NAME_WIDTH,padString,false),
        padColumn(price,PRICE_WIDTH,padString,true));
}

function logHr() {
    logProductRow("", "", "", "-");
}

function productListingHandler(err, result) {
    logHr();
    logProductRow("id", "product name", "price", " ");
    logHr();
    result.forEach(
        (product) =>
            logProductRow(
                product.item_id,
                product.product_name,
                product.price));
    logHr();
    getProductSelection(result);
}

function getProductSelection(products) {
    const ids = products.map((p) => p.item_id.toString());
    inquirer.prompt([
        {
            type: "input",
            message: "Select a product id or enter 0 to cancel: ",
            name: "id"
        }
    ]).then(function (inquirerResponse) {
        const id = parseInt(inquirerResponse.id);

        const product = products.find((p) => p.item_id === id);

        if (product) {
            getProductQuantity(product);
        } else if (id === 0) {
            connection.end();
        }
        else {
            console.log(inquirerResponse.id + " is an invalid product id.  Try again!");
            getProductSelection(products);
        }
    });
}

function getProductQuantity(product) {
    inquirer
        .prompt([
            {
                type: "input",
                message: "Enter the quantity or 0 to cancel: ",
                name: "action"
            }
        ])
        .then(function (inquirerResponse) {

            const quantity = parseInt(inquirerResponse.action);

            if (quantity < 0) {
                console.log(inquirerResponse.action + " is an invalid quantity! Try again");
                getProductQuantity(product);
            }
            else if (quantity === 0) {
                console.log("Order Canceled!");
                connection.end();
            }
            else if (quantity > product.stock_quantity) {
                console.log("Sorry!\nWe don't have that many.\nTry a smaller number.");
                getProductQuantity(product);
            }
            else {
                const new_stock_quantity = product.stock_quantity - quantity;

                connection.query("UPDATE products SET stock_quantity=? where item_id=?",
                    [new_stock_quantity, product.item_id],
                    function (err, result) {
                        if (err) {
                            console.log(JSON.stringify(err,null,2));
                            console.log("Ooh Nooo! We messed up your order.  Maybe try the real Amazon.")
                        }
                        else {
                            const totalCost = (quantity * product.price).toFixed(2);
                            console.log("Thank you for your order!\nThe total cost is %s.\nCheap, right?\nThank you for shopping at Bamazon!",
                                totalCost);
                        }
                        connection.end();
                    });
            }
        });
}
