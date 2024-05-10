const express = require('express')
const router = express.Router()
const checkauth = require('../auth/checkauth')
const mongoose = require('mongoose')

const ListSchema = require('../schemas/List')
const itemSchema = require('../schemas/Task')
const userSchema = require('../schemas/User')
const { update } = require('lodash')

const List = new mongoose.model('List', ListSchema)
const Item = new mongoose.model('Item', itemSchema)
const User = new mongoose.model('user', userSchema)
// router.set('view engine', 'ejs');

const passport = require('passport')

router.get('/deleteitem',(req, res)=>{
    console.log("req.query=", req.query);

    res.redirect("/");

})

router.get('/additem', (req, res)=>{
    // const {listName} = req.params;
    // console.log(req.params);
    console.log(req.query);
    const newTaskName = req.query.task;
    const listName = req.query.list
    
    checkauth(req).then((result)=>{
        console.log("checkauth result in additem", result);

        if(result.isLoggedIn){
            User.findOne({email:result.email}).populate('Lists').then((user)=>{
                const lists = user.Lists;
                console.log("user found by additem-", user);
                const list = lists.find(list => list.ListName === listName);

                if(list){
                    // found a list
                    console.log("list=", list);
                    List.findById(list.id).then((listToBeUpdated)=>{
                        console.log("this list is to be updated:", listToBeUpdated);
                        Item.create({Name:newTaskName}).then((newitem)=>{
                            listToBeUpdated.Items.push(newitem._id);
                            listToBeUpdated.save().then((updatedList)=>{
                                // the list should have been updated by now
                                console.log("updatedlist=", updatedList);

                                // now redirect to the same page for a refresh
                                res.redirect('/lists/' + listName);
                            })

                        })
                    })
                }
                else{
                    console.log("some issue with listfind");
                }

            })
        }
        
    })  

})

// request made here to fetch a list or to create and empty list
router.get('/:listName', (req, res) => {
    const listName = req.params.listName
    // const isAuthenticated = req.isAuthenticated();
    // console.log("result of isAuthenticated=", isAuthenticated);
    checkauth(req).then((result) => {
        console.log("checkauth res<listname get>=", result);
        if (result.isLoggedIn) {
            User.findOne({ email: result.email }).populate('Lists').then((user) => {
                console.log("user found by listget", user);
                let lists = user.Lists
                const listExists = lists.some(list => list.ListName === listName);

                if (listExists) {
                    let tasks = []
                    List.findOne({ ListName: listName }).populate("Items").then((listToBeDisplayed) => {
                        const itemNames = listToBeDisplayed.Items.map(item => item.Name);
                        console.log("task array : ", itemNames);
                        res.render('list', { dayvalue: listName, taskArray: itemNames, routeName: '/lists/' + listName })
                    })
                } else {
                    // Do something else if no such list exists
                    List.create({ ListName: listName }).then((newList) => {
                        user.Lists.push(newList._id);
                        user.save().then((updatedUser) => {
                            console.log("updatedUser", updatedUser)
                            res.render('list', { dayvalue: listName, taskArray: [], routeName: '/lists/' + listName })
                        })
                    })
                }
            })
        }
        else{
            console.log("not authenticated");
        }
    })

})

// request made here to add an item to the list
// router.post('/:listName', (req, res) => {
//     const newTaskName = req.body.task
//     const listName = req.params.listName
//     console.log("listName=", listName);
//     console.log("new task name = ", newTaskName);
//     console.log("req(post)=", req);
//     checkauth(req).then((x) => {
//         console.log("checkauth res=", x);
//         if (x.isLoggedIn) {
//             User.findOne({ email: x.email }).populate("Lists").then((user) => {
//                 console.log("user=", user);
//                 const lists = user.Lists
//                 const listExists = lists.some(list => list.ListName === listName);
//                 if (listExists) {
//                     List.findOne({ ListName: listName }).then((listToBeUpdated) => {
//                         console.log("list found:", listToBeUpdated);
//                         Item.create({ Name: newTaskName }).then((newItem) => {
//                             listToBeUpdated.Items.push(newItem._id)
//                             listToBeUpdated.save().then((updatedList) => {
//                                 console.log("updated list after pushing an item is - ", updatedList);
//                                 return res.redirect('/lists/' + listName)
//                             })
//                         })
//                     })
//                 }
//                 else{
//                     console.log("could not find list");
//                 }
//             })
//         }
//         else{
//             console.log("user not logged in");
//             return res.send("checkauth returned false")
//         }
//     })

// })



router.get('/', (req, res, next) => {

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


module.exports = router