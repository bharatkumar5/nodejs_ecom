const Product = require('../models/product');
const db =  require('../util/database');

exports.getAddProduct = (req, res, next) => {
// if (!req.session.isloggedIn){
//   res.redirect('/login');
// }
let message = req.flash('error');

if (message.length >0){
    message = message[0];
   
}
else {  message = null }
 

  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    isAuthenticated: req.session.isloggedIn
    // errormessage: message
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
if(!image){
// req.flash('error','image format should be png or jpg')
return res.redirect('/admin/add-product')

}


console.log(image)
const imageUrl = image.path;
  req.user.createProduct({
   
    title: title,
    price: price,
    imageUrl: imageUrl,
    description: description
  }).then(result  => {
    console.log('created product')
    res.redirect('/');
  }).catch(err => {
    console.log(err);

    const error = new Error(err);
    error.httpstatuscode = 500
    return next(error);
    
  })
  
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  req.user.getProducts({where: {id: prodId} }).then(products => {
    const product = products[0];
    if (!product) {
      return res.redirect('/');
    }

res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: editMode,
      product: product,
      isAuthenticated: req.session.isloggedIn
    });

  }).catch(err =>{
    console.log(err);
    const error = new Error(err);
    error.httpstatuscode = 500
    return next(error);
    
  })
   
};


exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const Image = req.file;
  const updatedDesc = req.body.description;

 Product.findByPk(prodId).then(product =>{
  

product.title = updatedTitle;
product.price = updatedPrice;
if(Image){
  product.imageUrl = Image.path;
}


product.description = updatedDesc;
return product.save();
}).then(result => {
  console.log('update Product');
  res.redirect('/admin/products');
  
  
  }).catch(err =>{
  console.log(err);
  const error = new Error(err);
    error.httpstatuscode = 500
    return next(error);
    
})

};


exports.getProducts = (req, res, next) => {
  req.user.getProducts()
  .then(products => {

    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products',
      isAuthenticated: req.session.isloggedIn
    });
  }).catch(err => {

    console.log(err);
    const error = new Error(err);
    error.httpstatuscode = 500
    return next(error);
    
  })
    

};

exports.deleteProduct = (req, res, next) => {
  
  const prodId = req.params.productId;
  Product.findByPk(prodId).then(product => {
    return product.destroy();

  }).then(result => {
console.log('deleted product');
res.status(200).json({message: "success"})

  }).catch(err => {
    console.log(err)
    res.status(500).json({message:"delete product failed"})
    
  })
  
};
