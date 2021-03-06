module.exports = function(app, model) {
    var passport      = require('passport');
    var auth = authorized;
    app.post  ('/api/login', passport.authenticate('local'), login);
    app.post  ('/api/logout',         logout);
    app.post  ('/api/register',       register);
    app.post(`/api/user`, auth, createUser);
    app.get(`/api/user`, auth, findUserByAuthType);
    app.get(`/api/user/:userId`, auth, findUserById);
    app.put(`/api/user/:userId`, auth, updateUser);
    app.delete(`/api/user/:userId`, auth, deleteUser);

    var userModel = model.userModel; 
    var bcrypt = require('bcrypt-nodejs');

    function authorized (req, res, next) {
    if (!req.isAuthenticated()) {
        res.sendStatus(401);
        } else {
        next();
        }
    }

    var LocalStrategy = require('passport-local').Strategy;
    passport.use(new LocalStrategy(localStrategy));
    function localStrategy(username, password, done) {
        userModel
            .findUserByCredentials({username: username, password: password})
            .then(
                function(user) {
                    if (!user) { return done(null, false); }
                    return done(null, user);
                },
                function(err) {
                    if (err) { return done(err); }
                }
            );
    }

    passport.serializeUser(serializeUser);
    passport.deserializeUser(deserializeUser);

    function serializeUser(user, done) {
        done(null, user);
    }

    function deserializeUser(user, done) {
        userModel
            .findUserById(user._id)
            .then(
                function(user){
                    done(null, user);
                },
                function(err){
                    done(err, null);
                }
            );
    }

    function login(req, res) {
        var user = req.user;
        res.json(user);
    }

    function logout(req, res) {
        req.logOut();
        res.send(200);
    }

    function loggedin(req, res) {
        res.send(req.isAuthenticated() ? req.user : '0');
    }

    function register(req, res) {
        userModel
        .createUser(req, res)
    }

    function createUser(req, res) {
        user = req.body.user;
        user.password = bcrypt.hashSync(user.password);
        userModel
            .createUser(user)
            .then(function (user) {
                res.send(user);
            }, function (err) {
                res.sendStatus(500).send(err);
            });
    }

    function findUserByAuthType(req, res) {
        var username = req.query['username'];
        var password = req.query['password'];
        if (username && password) {
            findUserByCredentials(req, res);
        } else if (username) {
            findUserByUsername(req, res);
        }
    }

    function findUserByUsername(req, res) {
        var username = req.query['username'];
        userModel
            .findUserByUsername(username)
            .then(function (user) {
                res.send(user);
            }, function (err) {
                res.sendStatus(404).send(err);
            });
    }

    function findUserByCredentials(req, res) {
        var username = req.query.username;
        var password = bcrypt.hashSync(req.query.password);
        userModel
            .findUserByCredentials(username, password)
            .then(function (user) {
                res.send(user);
            }, function (err) {
                res.sendStatus(500).send(err);
            });
    }  

    function findUserById(req, res) {
        var userId = req.query['userId'];

        userModel
            .findUserById(userId)
            .then(function (user) {
                res.send(user);
            }, function (err) {
                res.sendStatus(500).send(err);
            });
    }

    function updateUser(req, res) {
        var userId = req.params['userId'];

        userModel
            .updateUser(userId, req.body)
            .then(function (status) {
                res.send(status);
            }, function (err) {
                res.sendStatus(500).send(err);
            });
    }

    function deleteUser(req, res) {
        userModel
            .deleteUser(req.params['userId'])
            .then(function (status) {
                res.send(status);
            }, function (err) {
                res.sendStatus(500).send(err);
            });
    }
};