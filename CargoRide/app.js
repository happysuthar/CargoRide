const express = require("express");
require("dotenv").config();
let app = express();
const appRouting = require('./modules/app-routing');
const bodyParser = require("body-parser");
const api_doc = require("./modules/api_document/routes");
const path = require("path");


app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.use("/api-doc", api_doc);

app.use(bodyParser.json());
app.use(bodyParser.text());


app.use('/',require('./middleware/validators').extractHeaderLanguage);
app.use('/',require('./middleware/validators').validateApiKey);
app.use('/',require('./middleware/validators').validateHeaderToken);


// cronn.updateOrderStatus();


appRouting.v1(app);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));


const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
