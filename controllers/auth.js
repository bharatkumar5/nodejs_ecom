const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = require("../models/user");
const Cart = require("../models/cart");
const nodemailer = require('nodemailer');
const {validationResult}    = require('express-validator/check');
const { concat } = require('lodash');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'bharatkumar18002@gmail.com',
        pass: 'mixtwunfptofxqez'

    }
})


exports.getlogin = (req, res, next) => {

let message = req.flash('error');
if (message.length >0){
    message = message[0];
}
else {  message = null }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'login',
        errormessage: message
    });
};


exports.getSignup = (req, res, next) => {

    let message = req.flash('error');
    if (message.length >0){
        message = message[0];
    }
    else {  message = null }

    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errormessage: message
    });
};



exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        console.log(errors.array())
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errormessage: errors.array()[0].msg
        });
    }

   
         bcrypt.hash(password, 12).then(hashpassword => {
            const user = new User({
                email: email,
                password: hashpassword



            })

            return user.save();
            }).then(result => {
          


        // console.log('new user ---', result);
        // create new cart entry 
        // userid : result.dataValues.id
       
        const cart = new Cart({ userId: result.dataValues.id });
        cart.save().then(result=> {
            // console.log('cart save0----',result);
             res.redirect('/login');

       return  transporter.sendMail({
            from: 'bharatkumar18002@gmail.com',
            to: email,
            subject: 'signup success',
            text: 'you are successfully signup!'

         })  

        })
    }).catch(err => {
        console.log(err);
        const error = new Error(err);
    error.httpstatuscode = 500
    return next(error);
    
    })
}


exports.Postlogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        
return res.status(422).render('auth/login', {
    path: '/login',
    pageTitle: 'login',
    errormessage: errors.array()[0].msg
});
    }

    User.findOne({ where: { email: email } }).then(user => {

        if (!user) {
            req.flash('error','invalid email or password');
           
            return res.redirect('/login');
        }
        
        bcrypt.compare(password, user.password).then(domatch => {
            
            if (domatch) {
                
                req.session.isloggedIn = true;
              
                req.session.user = user
            
                return req.session.save(err => {
                 
                    console.log(err);
                       
                    res.redirect('/');
                });
            }
        
            req.flash('error','Wrong password');
            res.redirect('/login')

        }).catch(err => {
            console.log(err);
            res.redirect('/login');
        })
    })
        .catch(err => {
            const error = new Error(err);
    error.httpStatusCode = 500
    return next(error);
        });
        
    
    }




exports.Postlogout = (req, res, next) => {

    req.session.destroy(err => {

        console.log(err);
        res.redirect('/');
    });
}




exports.getreset = (req,res,next) =>{
    let message = req.flash('error');
    if (message.length >0){
        message = message[0];
    }
    else {  message = null }

    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'reset password',
        errormessage: message
    });
}

exports.postreset = (req, res, next) =>{
crypto.randomBytes(32,(error,buffer)=>{
    if(error){
        console.log(error);
        return res.redirect('/reset');
    }

    const token = buffer.toString('hex');
    User.findOne({where:{email:req.body.email}}).then(user =>{
        if(!user){
            req.flash('error', 'No account found with email')
        }
    user.resetToken = token;
    user.resetTokenExpiration = Date.now()+3600000
  return user.save();

    }).then(result => {
 res.redirect('/')
        transporter.sendMail({
            from: 'bharatkumar18002@gmail.com',
            to: req.body.email,
            subject: 'reset password',
            html: `<p> you requested reset password </p>
            click this  <a href="http://localhost:3000/reset/${token}">link</a>  to set new password
            `
         })


    }).catch(err =>{const error = new Error(err);
        error.httpstatuscode = 500
        return next(error);
        })
})

}

exports.getnewpassword = (req,res,next) =>{
 
    const token = req.param.token;
    User.findOne({resetToken:token, resetTokenExpiration: {$gt: Date.now()}})
    .then(user =>{
      
        let message = req.flash('error');
        if (message.length >0){
            message = message[0];
        }
        else {  message = null }
    
        res.render('auth/newpassword', {
            path: '/new-password',
            pageTitle: 'new password',
            errormessage: message,
            userid: user.id.toString(),
            passwordtoken: token
        });

    })
    .catch(err =>{ 
        const error = new Error(err);
    error.httpstatuscode = 500
    return next(error);}
    );
  
}

exports.postnewpassword = (req,res,next) =>{
    console.log('hello')
const newpassword = req.body.password
const userid = req.body.userid
const passwordtoken = req.body.passwordtoken
let resetuser; 


User.findOne({resetToken:passwordtoken,resetTokenExpiration:{$gt:Date()},id:userid})
.then(user => {
    resetuser = user;
  return bcrypt.hash(newpassword,12);
}).then(hashpassword =>{
    resetuser.password = hashpassword;
    resetuser.resetToken = null;
    resetuser.resetTokenExpiration = undefined
    
    return resetuser.save();
}).then(result =>{
    res.redirect('/login')
})
.catch(err => {
    console.log(err)
    const error = new Error(err);
    error.httpstatuscode = 500
    return next(error);
    
})

};
