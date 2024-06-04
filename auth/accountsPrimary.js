const express = require("express")
const passport = require('passport')
const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate')
const PassportLocalMongoose = require('passport-local-mongoose')
const session = require('express-session')
const mongostore = require('connect-mongo')
const customStrategy = require('passport-custom').Strategy

const googleLogin = require('./googleLogin');
const checkauth = require("./checkauth");
const { result } = require("lodash");

//setting up epxress
const app = express();
app.set('view-engine', 'ejs');
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const router = express.Router()

router.use('/googlelogin', googleLogin)

router.get('/test',(req,res)=>{
    console.log("hit on test acc-primary");
    res.send('hello from accts-primary')
})

router.get('/login', (req, res) => {

    checkauth(req).then((result)=>{
        if(result.isLoggedIn){
            res.redirect('/')
        }
        else{
            res.render('login')
        }

    })

    // if(checkauth(req).isLoggedIn){
    //     res.redirect('/')
    // }
    // else
    // res.render('login')
});

module.exports = router