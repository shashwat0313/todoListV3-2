// TO DO 
// GOOGLE OAUTH
require('dotenv').config();
const mongoCloudAddress = process.env.MONGODB_DBADDRESS
const DB_NAME = process.env.MONGODB_DBNAME
console.log(DB_NAME);
const express = require('express')
const router = express.Router();
const findOrCreate = require('mongoose-findorcreate')
const mongoose = require('mongoose');
const passport = require('passport');
// const localStrategy = require('passport-local').Strategy
const session = require('express-session')
const mongostore = require('connect-mongo')
const GoogleOneTapStrategy = require("passport-google-one-tap").GoogleOneTapStrategy;
const customStrategy = require('passport-custom').Strategy
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
// const mongooseEncryption = require('mongoose-encryption')

const clientID = process.env.GOOGLE_CLIENT_ID
const clientSECRET = process.env.GOOGLE_CLIENT_SECRET
const client = new OAuth2Client(clientID);
// const scopes = ['www.googleapis.com/auth/userinfo.email', 'www.googleapis.com/auth/userinfo.profile']
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));

const MongooseConnection = mongoose.createConnection(`${mongoCloudAddress}/${DB_NAME}`)

// order matters for most of the actions below. changing them may cause it to explode

const userSchema = require('../schemas/User')
userSchema.plugin(findOrCreate)

// ENCRYPTION LAYER

// const db_enc_key = Uint8Array.prototype.slice.call(Buffer.from(process.env.DB_ENCKEY), 0,32)
// const db_signing_key = Uint8Array.prototype.slice.call(Buffer.from(process.env.DB_SIGNING_KEY), 0,64)

// userSchema.plugin(mongooseEncryption, {encryptionKey:db_enc_key,signingKey:db_signing_key, excludeFromEncryption:['_id', '__v']})

const User = MongooseConnection.model('User', userSchema)

const mongouri = `${mongoCloudAddress}/${DB_NAME}`
console.log("mongouri=", mongouri);
const sessionStore = mongostore.create({ mongoUrl: mongouri, collectionName: 'sessions' })

router.use(session({
    secret: "mysecrethahaha",
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        // httpOnly:false
    },
}))

passport.serializeUser(function (user, cb) {
    cb(null, user.doc.id);
});

passport.deserializeUser(function (id, cb) {
    User.findById(id).then((user) => {
        if (user) {
            return cb(null, user)
        }
    }).catch((err) => { return cb(err) })
});

router.use(passport.initialize())
router.use(passport.session())

passport.use(
    new GoogleOneTapStrategy(
        {
            clientID: clientID, // your google client ID
            clientSecret: clientSECRET, // your google client secret
            verifyCsrfToken: false, // whether to validate the csrf token or not
        },

        //verification function
        //this strategy directly provides a passport.Profile object to the verify/cb function
        //then the object is checked for validity and further processed as required
        //the profile object contains the required information.
        //this is in contrast to customstrategy that provides the entire request to the verify/cb function
        function (profile, done) {
            if (!profile) { return done(null) }
            console.log("profile from google button\n", profile);
            User.findOrCreate({
                email: (profile.emails[0].value),
                Name: profile?.displayName ? `${profile.displayName}` : 'sorry got no name'
            }).then((user) => {
                return done(err, user);
            }).catch((err) => {
                return done(err)
            });
        }
    )
);

//customstrategy was used because I faced issues with the google strategy provided by passport
passport.use('custom', new customStrategy(

    //customstrategy provides the whole request to the verify/cb function
    //once we have hand on the credential inside the request object,
    //the rest of the process is almost the same as that of the googleonetap one.

    (req, done) => {
        const userDetails = (jwt.decode(req.body.credential))
        console.log(userDetails);
        User.findOrCreate({
            email: userDetails.email,
            Name: userDetails.given_name + " " + userDetails.family_name
        }).then((user) => {
            return done(err, user);
        }).catch((err) => {
            return done(err)
        });
    }
))

router.post('/login', (req, res, next) => {
    console.log("/googlelogin/login post hit");
    passport.authenticate('google-one-tap', {
        failureRedirect: 'accounts/login',
        successRedirect: '/',
    })(req, res, next)
})

router.post('/googleonetap', (req, res, next) => {
    console.log("onetap post hit");
    passport.authenticate('custom', (err, user, info) => {
        if (user) {
            req.logIn(user, (err) => {
                if (err) { return next(err) }
                if (!user) { return res.send('/accounts/login') }
                else {
                    return res.send('/')
                }
            })
        }
    })(req, res, next)
})

router.get('/test',(req, res)=>{
    // console.log("enckey=", db_enc_key);
    // console.log("sigkey=", db_signing_key)
    console.log("hit on googlelogin test");
    res.send("hello from googlelogin")
})

router.get('/querylogin', (req, res) => {
    // console.log("req.user=", req.user);
    // console.log("inside querylogin get route");
    // console.log("enckey=", db_enc_key);
    // console.log("sigkey=", db_signing_key)
    if (req.isAuthenticated()) {

        res.json({
            isLoggedIn: true,
            email: req.user.email
        })
    }
    else {
        // console.log("nope");
        res.json({
            isLoggedIn: null, 
            email: ""
        })
    }
})

router.get('/signout', (req, res) => {
    req.logOut((err) => {
        if (err) {
            console.log(err);
        }
        else {
            return res.redirect('/')
        }
    })
})

module.exports = router; 