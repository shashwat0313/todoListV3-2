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

router.post('/:listName', (req, res) => {
    const newTaskName = req.body.task
    const listName = req.params.listName
    console.log("listName=", listName);
    console.log("new task name = ", newTaskName);
    console.log("req(post)=", req);
    checkauth(req).then((x) => {
        console.log("checkauth res=", x);
        if (x.isLoggedIn) {
            User.findOne({ email: x.email }).populate("Lists").then((user) => {
                console.log("user=", user);
                const lists = user.Lists
                const listExists = lists.some(list => list.ListName === listName);
                if (listExists) {
                    List.findOne({ ListName: listName }).then((listToBeUpdated) => {
                        console.log("list found:", listToBeUpdated);
                        Item.create({ Name: newTaskName }).then((newItem) => {
                            listToBeUpdated.Items.push(newItem._id)
                            listToBeUpdated.save().then((updatedList) => {
                                console.log("updated list after pushing an item is - ", updatedList);
                                return res.redirect('/lists/' + listName)
                            })
                        })
                    })
                }
                else{
                    console.log("could not find list");
                }
            })
        }
        else{
            console.log("user not logged in");
            return res.send("checkauth returned false")
        }
    })

})

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