const express = require('express');

const router = express.Router();
const authcontroller = require('../controllers/auth')
const {check,body} = require('express-validator/check');
const User = require('../models/user');



router.get('/login',authcontroller.getlogin);


router.post('/login'
,body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
body('password','incorrect password').isLength({min:6}).trim()


,authcontroller.Postlogin);

router.post('/logout',authcontroller.Postlogout);

router.get('/signup',authcontroller.getSignup);

router.post('/signup',
check('email').isEmail().withMessage('Please enter a valid email').custom((value,{ req })=> {
    // if(value === "bharatseervi5@gmail.com"){
    //     throw new Error('this Email address forbiden')
    // }
    // return true;
    

   return User.findOne({ where: { email: value } }).then(userdoc => {
        if (userdoc) {
            return Promise.reject('Email exits already!')
        }
 })
}).normalizeEmail(),body('password','password should be atleast 6 characters').isLength({min:6}).trim()
,body('confirmPassword').trim().custom((value, { req }) => {
    console.log(value)
    if(value !== req.body.password) {
        
        throw new Error('password have to match');
    }
    return true;
})
,authcontroller.postSignup);

router.get('/reset',authcontroller.getreset);
router.post('/reset',authcontroller.postreset);

router.get('/reset/:token',authcontroller.getnewpassword);
router.post('/new-password',authcontroller.postnewpassword)

module.exports = router;