const express = require('express')
const router = express.Router()
const checkauth = require('../auth/checkauth')
const mongoose = require('mongoose')

const ListSchema = require('../schemas/List')
const itemSchema = require('../schemas/Task')
const userSchema = require('../schemas/User')
const { update } = require('lodash')

// const mongooseEncryption = require('mongoose-encryption')

// const db_enc_key = Uint8Array.prototype.slice.call(Buffer.from(process.env.DB_ENCKEY), 0,32)
// const db_signing_key = Uint8Array.prototype.slice.call(Buffer.from(process.env.DB_SIGNING_KEY), 0,64)

// userSchema.plugin(mongooseEncryption, {encryptionKey:db_enc_key,signingKey:db_signing_key})

const List = new mongoose.model('List', ListSchema)
const Item = new mongoose.model('Item', itemSchema)
const User = new mongoose.model('user', userSchema)

const passport = require('passport')

router.get('/deletelist', (req, res) => {
    const { listName } = req.query;
    checkauth(req).then((result) => {
        if (result.isLoggedIn) {
            User.findOne({ email: result.email }).populate("Lists").then((user) => {
                const lists = user.Lists;
                const list = lists.find(list => list.ListName === listName);

                if (list) {
                    // console.log("list found = ", list);
                    const itemIds = list.Items
                    Item.deleteMany({ _id: { $in: itemIds } }).then(() => {
                        List.findByIdAndRemove(list._id).then(() => {
                            User.findByIdAndUpdate(user._id, { $pull: { Lists: list._id } }).then((updatedUser) => {
                                // console.log("this is the updated user doc:", updatedUser);
                                res.redirect('/');
                            }).catch((err) => {
                                console.log("error-", err);
                                return res.send(err)
                            })
                        }).catch((err) => {
                            console.log("error-", err);
                            return res.send(err)
                        })
                    }).catch((err) => {
                        console.log("error-", err);
                        return res.send(err)
                    })
                }
                else {
                    res.send("list not found (deletelist)")
                }
            }).catch((err) => {
                console.error("error-", err);
            })
        }
    })

})

router.get('/deleteitem', (req, res) => {
    // console.log("req.query=", req.query);
    const { item, listName } = req.query

    checkauth(req).then((result) => {
        if (result.isLoggedIn) {
            User.findOne({ email: result.email }).populate('Lists').then((user) => {
                const lists = user.Lists;
                // console.log("user found by additem-", user);
                const list = lists.find(list => list.ListName === listName);

                if (list) {
                    // found a list
                    // console.log("list=", list);
                    List.findById(list.id).populate("Items").then((listToBeUpdated) => {
                        // console.log("this list is to be updated:", listToBeUpdated);

                        let items = listToBeUpdated.Items
                        const itemToRemove = items.find((i) => i.Name === item)

                        if (itemToRemove) {
                            Item.findByIdAndRemove(itemToRemove._id).then(() => {
                                // Remove the item's ID from the list's items array
                                List.findByIdAndUpdate(list.id, { $pull: { Items: itemToRemove._id } }).then((updatedList) => {
                                    // console.log("new list=", updatedList);
                                    return res.redirect('/lists/' + listName)

                                }).catch((err) => {
                                    console.log("error-", err);
                                    return res.send(err)
                                })
                            }).catch(err => {
                                console.error(err);
                                res.send("got this error - ", err)
                            });
                        }
                    }).catch((err) => {
                        console.log("error-", err);
                        return res.send(err)
                    })
                }
            }).catch((err) => {
                console.log("error-", err);
                return res.send(err)
            })
        }
        else {
            return res.send("not authenticated")
        }
    }
    ).catch((err) => {
        console.log("error-", err);
        return res.send(err)
    })
})

router.get('/additem', (req, res) => {
    // const {listName} = req.params;
    // console.log(req.params);
    // console.log(req.query);
    const newTaskName = req.query.task;
    const listName = req.query.list

    checkauth(req).then((result) => {
        // console.log("checkauth result in additem", result);

        if (result.isLoggedIn) {
            User.findOne({ email: result.email }).populate('Lists').then((user) => {
                const lists = user.Lists;
                // console.log("user found by additem-", user);
                const list = lists.find(list => list.ListName === listName);

                if (list) {
                    // found a list
                    // console.log("list=", list);
                    List.findById(list.id).then((listToBeUpdated) => {
                        // console.log("this list is to be updated:", listToBeUpdated);
                        Item.create({ Name: newTaskName }).then((newitem) => {
                            listToBeUpdated.Items.push(newitem._id);
                            listToBeUpdated.save().then((updatedList) => {
                                // the list should have been updated by now
                                // console.log("updatedlist=", updatedList);

                                // now redirect to the same page for a refresh
                                res.redirect('/lists/' + listName);
                            }).catch((err) => {
                                console.log("error-", err);
                                return res.send(err)
                            })
                        }).catch((err) => {
                            console.log("error-", err);
                            return res.send(err)
                        })
                    }).catch((err) => {
                        console.log("error-", err);
                        return res.send(err)
                    })
                }
                else {
                    // console.log("some issue with listfind");
                    res.send("could not find list")
                }

            }).catch((err) => {
                console.log("error-", err);
                return res.send(err)
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
        // console.log("checkauth res<listname get>=", result);
        if (result.isLoggedIn) {
            User.findOne({ email: result.email }).populate('Lists').then((user) => {
                // console.log("user found by listget", user);
                let lists = user.Lists
                const listExists = lists.some(list => list.ListName === listName);

                if (listExists) {
                    let tasks = []
                    List.findOne({ ListName: listName }).populate("Items").then((listToBeDisplayed) => {
                        const itemNames = listToBeDisplayed.Items.map(item => item.Name);
                        // console.log("task array : ", itemNames);
                        res.render('list', { dayvalue: listName, taskArray: itemNames, routeName: '/lists/' + listName })
                    }).catch((err) => {
                        console.log("error-", err);
                        return res.send(err)
                    })
                } else {
                    // Do something else if no such list exists
                    List.create({ ListName: listName }).then((newList) => {
                        user.Lists.push(newList._id);
                        user.save().then((updatedUser) => {
                            // console.log("updatedUser", updatedUser)
                            res.render('list', { dayvalue: listName, taskArray: [], routeName: '/lists/' + listName })
                        }).catch((err) => {
                            console.log("error-", err);
                            return res.send(err)
                        })
                    }).catch((err) => {
                        console.log("error-", err);
                        return res.send(err)
                    })
                }
            }).catch((err) => {
                console.log("error-", err);
                return res.send(err)
            })
        }
        else {
            console.log("not authenticated");
        }
    })

})

router.get('/', (req, res, next) => {

    checkauth(req).then((result) => {
        // console.log("check res=", result);
        if (result.isLoggedIn) {
            User.findOne({ email: result.email }).populate('Lists').then(user => {
                console.log("user found: " + user);
                // console.log("lists=", user.Lists);
                return res.render('manage', { ItemArray: user.Lists })

            }).catch((err) => {
                console.log("some internal error");
                return res.send(err)
            })
        }
        else {
            return res.render('manage', { ItemArray: [] })
            // return res.redirect('/accounts/login')
        }
    })
})


module.exports = router