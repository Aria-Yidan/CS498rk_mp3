const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const User = require('../../models/user')
const Task = require('../../models/task')

router.get('/', (req, res, next) => {
    const whereCond = eval("(" + req.query.where + ")");
    const sortCond = eval("(" + req.query.sort + ")");
    const selectCond = eval("(" + req.query.select + ")");
    const skipCond = eval("(" + req.query.skip + ")");
    const limitCond = eval("(" + req.query.limit + ")");
    const countCond = eval("(" + req.query.count + ")");

    User
        .find(whereCond)
        .select(selectCond)
        .sort(sortCond)
        .skip(skipCond)
        .limit(limitCond)
        .exec()
        .then(users => {
            if (users.length == 0) {
                return res.status(404).json({
                    message: "Failed",
                    data: []
                });
            }
            if (countCond) {
                const response = {
                    message: "Ok",
                    data: users.length
                };
                return res.status(200).json(response);
            }
            const response = {
                message: 'Ok',
                data: users
            };
            res.status(200).json(response);
        })
        .catch(err => {
            res.status(500).json({
                message: "Error",
                data: err
            });
        });
});

router.post('/', (req, res, next) => {
    const user = new User({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        email: req.body.email,
        dateCreated: req.body.dateCreated,
        pendingTasks: req.body.pendingTasks,
    });
    if (req.body.pendingTasks && req.body.pendingTasks.length > 0) {
        req.body.pendingTasks.map(id => {
            Task
                .findById(id)
                .then(task => {
                    if (!task) {
                        return res.status(404).json({
                            message: "Failed",
                            data: "No Task Found"
                        });
                    }
                    task.assignedUser = user._id;
                    task.save();

                })
        });
    }
    user
        .save()
        .then(result => {
            res.status(201).json({
                message: "Ok",
                data: result
            });
        })
        .catch(err => {
            res.status(500).json({
                message: "Error",
                data: err
            });
        });
});


router.get('/:userId', (req, res, next) => {
    User
        .findById(req.params.userId)
        .exec()
        .then(user => {
            res.status(200).json({
                message: "Ok",
                data: user
            });
        })
        .catch(err => {
            res.status(404).json({
                message: "Error",
                data: err
            });
        });
});

router.delete('/:userId', (req, res, next) => {
    User
        .findById(req.params.userId)
        .then(user => {
            console.log("userid", user._id);
            if (!user) {
                return res.status(404).json({
                    message: "Failed",
                    data: "No User Found"
                });
            }
            if (user.pendingTasks.length > 0) {
                user.pendingTasks.map(id => {
                    Task.findById(id).then(task => {
                        if (task) {
                            task.assignedUser = "";
                            task.assignedUserName = "unassigned";
                            task.save();
                        }
                    });
                });
            }
            res.status(200).json({
                message: "Ok",
                data: user
            });
            return user.remove();
        })
        .catch(err => {
            res.status(404).json({
                message: "Failed",
                data: "No User Found"
            });
        });
});

router.put('/:userId', (req, res, next) => {
    User
        .findById(req.params.userId)
        .exec()
        .then(user => {
            if (!user) {
                return res.status(404).json({
                    message: "Failed",
                    data: "No User Found"
                });
            }
            user.name = req.body.name;
            user.email = req.body.email;
            user.pendingTasks = req.body.pendingTasks;
            user.dateCreated = req.body.dateCreated;
            user.save();
            res.status(200).json({
                message: "Ok",
                data: user
            });
        })
        .catch(err => {
            res.status(404).json({
                message: "Invalid Task ID",
                data: err
            });
        });
});


module.exports = router;