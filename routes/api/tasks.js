const express = require('express');
const mongoose = require('mongoose');


const router = express.Router();

const Task = require('../../models/task')
const User = require('../../models/user')

router.get('/', (req, res, next) => {
    const whereCond = eval("(" + req.query.where + ")");
    const sortCond = eval("(" + req.query.sort + ")");
    const selectCond = eval("(" + req.query.select + ")");
    const skipCond = eval("(" + req.query.skip + ")");
    var limitCond = 100;
    if (req.query.limit) {
        limitCond = eval("(" + req.query.limit + ")");
    }
    const countCond = eval("(" + req.query.count + ")");

    Task
        .find(whereCond)
        .select(selectCond)
        .sort(sortCond)
        .skip(skipCond)
        .limit(limitCond)
        .exec()
        .then(docs => {
            if (docs.length == 0) {
                return res.status(500).json({
                    message: 'Failed',
                    data: []
                });
            }
            if (countCond) {
                const response = {
                    message: 'Ok',
                    data: docs.length
                };
                res.status(200).json(response);
            } else {
                const response = {
                    message: 'Ok',
                    data: docs
                };
                res.status(200).json(response);
            }

        })
        .catch(err => {
            res.status(500).json({
                message: "Failed",
                data: err
            });
        });
});

router.get('/:taskId', (req, res, next) => {
    Task
        .findById(req.params.taskId)
        .exec()
        .then(task => {
            res.status(200).json({
                message: "Ok",
                data: task
            });
        })
        .catch(err => {
            res.status(404).json({
                message: "Failed",
                data: "No Task Found"
            });
        });
});

router.post('/', (req, res, next) => {
    const task = new Task({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        deadline: req.body.deadline,
        description: req.body.description,
        completed: req.body.completed,
        assignedUser: req.body.assignedUser,
        assignedUserName: req.body.assignedName
    });
    if (req.body.assignedUser) {
        User
            .findById(req.body.assignedUser)
            .then(user => {
                if (!user) {
                    return res.status(500).json({
                        message: "User not found"
                    });
                }
                if (req.body.assignedName && req.body.assignedName !== user.name) {
                    return res.status(500).json({
                        message: "User name does not match with User Id"
                    });
                }

                // REMEBER TO ALSO ADD TASK TO USER's LIST
                user.pendingTasks = [...user.pendingTasks, task._id];
                user.save();
                return task.save();
            })
            .then(result => {
                res.status(201).json({
                    message: 'Ok',
                    data: {
                        _id: result._id,
                        name: result.name,
                        deadline: result.deadline,
                        description: result.description,
                        completed: result.completed,
                        assignedUser: result.assignedUser,
                        assignedUserName: result.assignedUserName,
                        dateCreated: result.dateCreated
                    }
                });
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({
                    message: "Fail to create new task",
                    error: err
                });
            });
    } else {
        task
            .save()
            .then(result => {
                res.status(201).json({
                    message: 'Ok',
                    data: {
                        _id: result._id,
                        name: result.name,
                        deadline: result.deadline,
                        description: result.description,
                        completed: result.completed,
                        assignedUser: result.assignedUser,
                        assignedUserName: result.assignedUserName,
                        dateCreated: result.dateCreated
                    }
                });
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({
                    message: "Fail to create new task",
                    data: err
                });
            });
    }
});

// WHEN YOU DELETE A TASK, YOU ALSO NEED TO DELETE IT FROM USER'S LIST
router.delete('/:taskId', (req, res, next) => {
    const id = req.params.taskId;
    Task
        .findById(id)
        .then(task => {
            if (task.assignedUser) {
                User
                    .findById(task.assignedUser)
                    .then(user => {
                        user.pendingTasks = user.pendingTasks.filter(taskId => taskId.toString() !== id);
                        user.save();
                    });
            }
            return task.remove();
        })
        .then(result => {
            res.status(200).json({
                message: 'Ok',
                data: result
            });
        })
        .catch(err => {
            console.log(err);
            res.status(404).json({
                message: "Task Not Found",
                data: err
            });
        });
});

router.put('/:taskId', (req, res, next) => {
    Task
        .findById(req.params.taskId)
        .exec()
        .then(task => {
            if (!task) {
                return res.status(404).json({
                    message: "Task Not Found"
                });
            }
            task.name = req.body.name;
            task.description = req.body.description;
            task.deadline = req.body.deadline;
            task.completed = req.body.completed;
            task.assignedUser = req.body.assignedUser;
            task.assignedUserName = req.body.assignedUserName;
            task.dateCreated = req.body.dateCreated;
            task.save();
            res.status(200).json({
                message: "Ok",
                data: task
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