const express = require('express');
const bodyParser = require('body-parser');

const Dishes = require('../models/dishes');
const Favorites = require('../models/favorites');

const authenticate = require('../authenticate');
const cors = require('./cors');
const user = require('../models/user');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req,res) => {res.sendStatus = 200})
.get(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({ user: req.user._id })
    .populate('user')
    .populate('favoriteDishes')
    .then((fav) => {
        if (fav == null) {
            error = new Error('No Favorite Document Found');
            error.status = 404;
            next(error);
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(fav);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
    .then((fav) => {
        if (fav == null) {
            let promises = [];
            let favorite = { favoriteDishes: [], user: req.user._id };
            for (let i = 0; i < req.body.length; i++) {
                promises.push(Dishes.findById(req.body[i]._id)
                .then((dish) => {
                    if (dish != null)
                        {favorite.favoriteDishes.push(dish._id)}}))
            }
            Promise.all(promises)
            .then(() => {
                Favorites.create(favorite)
                .then((fav) => {
                    console.log('Favorite Document Updated ', fav);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(fav);
                }, (err) => next(err))
            })
        }
        else {
            let promises = [];
            for (let i = 0; i < req.body.length; i++) {
                promises.push(Dishes.findById(req.body[i]._id)
                .then((dish) => {
                    if (dish != null && fav.favoriteDishes.indexOf(dish._id) == -1)
                        {fav.favoriteDishes.push(dish._id)}}))
            }
            Promise.all(promises)
            .then(() => {
                fav.save()
                .then((fav) => {
                    console.log('Favorite Document Updated ', fav);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(fav);
                }, (err) => next(err))
            })
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put((req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.deleteOne({ user: req.user._id })
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));    
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req,res) => {res.sendStatus = 200})
.get((req, res, next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /favorites/'+ req.params.dishId);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        if (dish == null) {
            error = new Error('Dish '+ req.params.dishId + 'not found');
            error.status = 404;
            return next(error);
        }
        else {
            Favorites.findOne({ user: req.user._id })
            .then((fav) => {
                if (fav == null) {
                    var favorite = { favoriteDishes: [req.params.dishId], user: req.user._id };
                    Favorites.create(favorite)
                    .then((fav) => {
                        console.log('Favorite Document Created ', fav);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(fav);
                    }, (err) => next(err))}
                else {
                    if (fav.favoriteDishes.indexOf(req.params.dishId) == -1){
                        fav.favoriteDishes.push(req.params.dishId)
                    }
                    fav.save()
                    .then((fav) => {
                        console.log('Favorite Document Updated ', fav);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(fav);
                    }, (err) => next(err))
                }
            }, (err) => next(err))
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put((req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/'+ req.params.dishId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
    .then((fav) => {
        if (fav == null) {
            error = new Error('Favorites not found');
            error.status = 404;
            next(error);
        }
        else {
            if (fav.favoriteDishes.indexOf(req.params.dishId) == -1) {
                error = new Error('Dish '+ req.params.dishId + ' not found in favorites');
                error.status = 404;
                next(error);
            }
            else {
                fav.favoriteDishes = fav.favoriteDishes.filter((id) => !id.equals(req.params.dishId))
                fav.save()
                .then((fav) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(fav);
                })
                
            }
            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = favoriteRouter;