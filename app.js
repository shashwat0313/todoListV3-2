// !!! fix-before-deployement
// require('dotenv').config();
const mongoCloudAddress = process.env.MONGODB_DBADDRESS
const DB_NAME = process.env.MONGODB_DBNAME
const bodyParser = require('body-parser');
const express = require('express');
const { redirect } = require('express/lib/response');
const app = express();
const date = require(__dirname + '/date.js');
const mongoose = require("mongoose");
const mongostore = require('connect-mongo')
const session = require('express-session')
const passport = require('passport');
const fetch = require('node-fetch');
const accountsPrimary = require('./auth/accountsPrimary')
const listRouter = require('./controllers/list')
const checkauth = require('./auth/checkauth')

// !!! fix-before-deployement
//mongoose connection
mongoose.connect(`${mongoCloudAddress}/${DB_NAME}`).then((x) => {console.log('mongo connected');});
/////////////////////////////////////////////////////////////////////////////////

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'))
app.use(express.json())

app.use('/accounts', accountsPrimary)
app.use('/lists', listRouter)
/////////////////////////////////////////////////////////////////////////////////

let arr = []
let lastURL = ""

app.get('/test', (req, res) => {
    console.log("hit on test");
})

app.get('/', (req, res) => {
    res.redirect('/lists');
})

app.get('/about', (req, res) => {
    res.render('about');
})

app.listen(process.env.PORT || 3000, () => {
    console.log(`online`);
});