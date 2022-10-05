const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const sequelize = require('./util/database');
const Product = require('./models/product');
const User = require('./models/user');
const cart = require('./models/cart');
const cartitem = require('./models/cart-item');
const Order = require('./models/order');
const Orderitem = require('./models/order-item');
const session = require('express-session');
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const  csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const csrfprotection = csrf();

const app = express();

const storage = new SequelizeStore({
  db: sequelize,
  
})

 // muler pakage configuration
const filestorage = multer.diskStorage({
  destination: (req, file, cb) =>{
cb(null, 'images');
  },
  filename: (req,file,cb) =>{
    cb(null, new Date().toISOString()+'-'+file.originalname)
  }
})

const filefilter = (req,file,cb) =>{
if(file.mimetype === 'image/png'||
file.mimetype === 'image/jpg' ||
file.mimetype === 'image/jpeg'){
  cb(null,true)
}
else{

   cb(null,false)
}
  
}


app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const errorController = require('./controllers/error');
const Cart = require('./models/cart');
const { name } = require('ejs');


app.use(bodyParser.urlencoded({ extended: false }));

app.use(multer({storage: filestorage,fileFilter:filefilter}).single('image'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));

// session storage configuration
app.use(session({ secret: 'my secret', store: storage, resave: false, saveUninitialized: false,name:"bharat"}));


app.use(csrfprotection);
app.use(flash());

app.use((req, res, next) =>{
  res.locals.isAuthenticated = req.session.isloggedIn,
  res.locals.csrfToken =req.csrfToken()

  next()
})

app.use((req,res,next) =>{
  
  console.log(req.locals)
if (!req.session.user){
 
  return next();
}

  User.findByPk(req.session.user.id).then(user =>{
 if(!user){
  return next()
 }
    req.user = user;
    next();
  }).catch(err => {

   next(new Error(err))
  });

})


  



app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);


app.use('/500',errorController.get500);

app.use(errorController.get404);
 //global error handler midleware
app.use((error, req,res,next)=>{
  // res.redirect('/500')
  res.status(500).render('500', 
  { pageTitle: 'Error', path: '/500',isAuthenticated: req.session.isloggedIn });
});

Product.belongsTo(User, {constraints: true, onDelete: 'CASCADE'})
User.hasMany(Product);
User.hasOne(cart);
cart.belongsTo(User);
cart.belongsToMany(Product, {through: cartitem});
Product.belongsToMany(cart,{ through: cartitem});
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product,{through: Orderitem});

sequelize
  // .sync({ force: true })
  
  .sync()
  .then(reuslt => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err)
  })


