//not using lodash in this project
//does not handle database operation errors

require('dotenv').config();
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
const itemSchema = require("./schemas/Task")
const ListSchema = require('./schemas/List')
const userSchema = require('./schemas/User') 
const listRouter = require('./controllers/list')
const checkauth = require('./auth/checkauth')
//mongoose connection
mongoose.connect(`${mongoCloudAddress}/${DB_NAME}`).then((x) => {
});
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

//db structures import

const Item = new mongoose.model('Item', itemSchema)
const List = new mongoose.model('List', ListSchema)
const User = new mongoose.model('User', userSchema)

app.get('/test', (req, res) => {
    console.log("hit on test");
})

app.get('/', (req, res) => {
    res.redirect('/lists');
})

// app.post('/checked', (req, res) => {
//     const lastURL = ""
//     console.log("req.body:", req.body);
//     // const listName = ((req.body.listName)[0]).slice('/lists/'.length);
//     const itemName = req.body.item
//     const listName = Array.isArray(req.body.listName) 
//     ? req.body.listName[0].slice('/lists/'.length) 
//     : req.body.listName.slice('/lists/'.length);
//     console.log("listname:", req.body.listName);
//     checkauth(req).then((result) => {
//         if (result.isLoggedIn) {
//             User.findOne({ email: result.email }).populate("Lists").then(user => {
//                 console.log("found user:", user);
//                 //first find the List
//                 const lists = user.Lists;
//                 console.log("lists:", lists);
//                 const listExists = lists.some(list => list.ListName === listName);
//                 if (listExists) {
//                     //pull the list out
//                     List.findOne({ ListName: listName }).populate("Items").then((listToBeUpdated) => {
//                         //now find the item
//                         console.log("items found : ", listToBeUpdated.Items);
//                         const items = listToBeUpdated.Items
//                         const itemExists = items.some(item => item.Name === itemName)
//                         if (itemExists) {
//                             Item.findOne({ Name: itemName }).then((item) => {
//                                 const id = item._id;
//                                 Item.deleteOne({ _id: id }).then(() => {
//                                     // Remove the item's id from the list
//                                     List.updateOne(
//                                         { ListName: listName },
//                                         { $pull: { Items: id } }
//                                     ).then(() => {
//                                         console.log('Item deleted and id removed from list');
//                                         res.redirect('/lists/' + listName)
//                                     });
//                                 });
//                             })
//                         }
//                     })
//                 }
//                 else{
//                     console.log("no such list");
//                 }
//             })
//         }
//     })

// })


let arr2 = [];

app.get('/manage', (req, res, next) => {
    checkauth(req).then((result) => {
        console.log("check res=", result);
        if (result.isLoggedIn) {
            User.findOne({ email: result.email }).populate('Lists').then(user => {
                console.log("user found: " + user);
                console.log("lists=", user.Lists);
                return res.render('manage', { ItemArray: user.Lists })

            }).catch((err) => {
                console.log("some internal error");
            })
        }
        else {
            return res.redirect('/accounts/login')
        }
    })


})

app.post('/deletelist', function (req, res) {
    const listNameToDelete = req.body.deletename;

    checkauth(req).then((authResult) => {
        if (authResult.isLoggedIn) {
            User.findOne({ email: authResult.email }).populate('Lists').then((user) => {
                const userHasList = user.Lists.some(list => list.ListName === listNameToDelete);

                if (userHasList) {
                    // If the user has the list, delete it
                    List.deleteOne({ ListName: listNameToDelete }).then(() => {
                        res.redirect('/manage');
                    });
                } else {
                    return res.status(400).send('The list does not exist.');
                }
            });
        } else {
            return res.redirect('/accounts/login');
        }
    });
});

app.get('/about', (req, res) => {
    res.render('about');
})

app.listen(process.env.PORT || 3000, () => {
    console.log(`online`);
});