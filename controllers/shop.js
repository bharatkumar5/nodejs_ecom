const Product = require('../models/product');
const Cart = require('../models/cart');
const User = require("../models/user");
const fs = require('fs');
const path = require('path');
const Order = require('../models/order');
const pdfdocument = require('pdfkit');
const items_per_page = 2;


exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
Product.findAndCountAll().then(numproducts =>{
       totalItems = numproducts.count;
      return Product.findAll({limit:items_per_page,offset: (page-1)*items_per_page});

}).then(products => {

res.render('shop/product-list',{
    prods: products,
    pageTitle: 'products',
    path: '/products',
    currentPage: page,
    hasNextPage: items_per_page * page < totalItems,
    hasPreviousPage: page > 1,
    nextPage: page + 1,
    previousPage: page - 1,
    lastPage: Math.ceil(totalItems / items_per_page)
    
  });

  }).catch(err => {
    const error = new Error(err);
    error.httpstatuscode = 500
    return next(error);
    
  })
  
};

exports.getProduct = (req, res, next) => {
  
  const prodId = req.params.productId;
  Product.findByPk(prodId).then(product => {


    res.render('shop/product-detail', {
      product: product,
      pageTitle: product.title,
      path: '/products',
     
    });

  }).catch(err => {
    const error = new Error(err);
    error.httpstatuscode = 500
    return next(error);
    
  })
};

 
    


exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
Product.findAndCountAll().then(numproducts =>{
       totalItems = numproducts.count;
      return Product.findAll({limit:items_per_page,offset: (page-1)*items_per_page});

}).then(products => {

res.render('shop/index',{
    prods: products,
    pageTitle: 'Shop',
    path: '/',
    currentPage: page,
    hasNextPage: items_per_page * page < totalItems,
    hasPreviousPage: page > 1,
    nextPage: page + 1,
    previousPage: page - 1,
    lastPage: Math.ceil(totalItems / items_per_page)
    
  });

  }).catch(err => {
    const error = new Error(err);
    error.httpstatuscode = 500
    return next(error);
    
  })
  
  
};

exports.getCart = (req, res, next) => {
  console.log(req.user)
  req.user.getCart().then(cart => {



  return cart.getProducts().then(product => {
    
    res.render('shop/cart', {
            path: '/cart',
            pageTitle: 'Your Cart',
            products: product
            
          
          });

   }).catch(err => console.log(err))
 }).catch(err => {
  const error = new Error(err);
  error.httpstatuscode = 500
  return next(error);
  
})

};


exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  let fetchcart;
  let newQuantity = 1;
  req.user
  .getCart()
  .then(cart => {
   
    fetchcart = cart;
    return cart.getProducts({where:{ id: prodId } })
  }).then(products =>{

  

      let product
      if (products.length > 0){
        product = products[0]
      }
      if(product){
        const oldQuantity = product.cartitem.quantity;
        newQuantity = oldQuantity +1;
        return product;
      }
      return Product.findByPk(prodId)
    })
      .then(product =>{
        

        return fetchcart.addProduct(product, {
          through: {quantity: newQuantity}

        });
      
    }).then(() =>{
       res.redirect('/cart');
    })
  .catch(err => {
    const error = new Error(err);
    error.httpstatuscode = 500
    return next(error);
    
  });
  
};
 



exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user.getCart().then(cart =>{
 return cart.getProducts({where: {id: prodId}})
}).then(products =>{
  const product = products[0];
 return product.cartitem.destroy();
}).then(result =>{
  res.redirect('/cart');
}).catch(err =>{ const error = new Error(err);
  error.httpstatuscode = 500
  return next(error);
  
})

  
};



exports.getOrders = (req, res, next) => {
  req.user.getOrders({include: ['products']}).then(orders =>{


     res.render('shop/orders', {
    path: '/orders',
    pageTitle: 'Your Orders',
    orders: orders
   

  })}).catch(err => {
    const error = new Error(err);
    error.httpstatuscode = 500
    return next(error);
    
  })
 
  
};

exports.postOrder = (req, res, next) => {
let fetchcart;
req.user.getCart().then(cart => {
 fetchcart =cart;
 return cart.getProducts();
})
.then(products => {

 return req.user.createOrder()
 .then(order => { 

return order.addProducts(products.map(product =>{

product.orderitem = {quantity: product.cartitem.quantity}

  return product;
}))

 }).catch(err =>{console.log(err)})

}).then(result => {
return fetchcart.setProducts(null);
  
}).then(result => {
 res.redirect('/orders');
})
.catch(err => {
  const error = new Error(err);
    error.httpstatuscode = 500
    return next(error);
    
});

}

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'Checkout'
  });
};


exports.getinvoice = (req,res,next) =>{
  
  const orderId = req.params.orderid
   
  Order.findByPk(orderId, {
    include: ["products"]
  })
    .then((order) => {
    
      if (!order) {
        return next(new Error("No order found"))
      }
 
      if (order.dataValues.userId !== req.user.id) {
        return next(new Error("Unauthorized"))
      }
 
      const invoiceName = `invoice-${orderId}.pdf`
      const invoicePath = path.join("data", "invoices", invoiceName)
 
      // const {products} = order
 
      let totalPrice = 0
      
 
      res.set({
        "Content-Type": "application/pdf"
      })
 
      const doc = new pdfdocument()
 
      doc.pipe(fs.createWriteStream(invoicePath))
      doc.pipe(res)
 
      doc
        .fontSize(26)
        .text("Invoice", {
          underline: true
        })
 
      doc.text("------------------------------------------")
      order.dataValues.products.forEach((prod) => {

        totalPrice += prod.orderitem.quantity * prod.price
        doc
          .fontSize(14)
          .text(`${prod.title}-${prod.orderitem.quantity}x $${prod.price}`)
      })
      doc.text("------------------------------------------")
      doc.text(`Total Price: $${totalPrice}`)
 
      doc.end()
    })



// fs.readFile(invoicepath,(err, data)=>{
//   if(err){
//     return next(err)
//   }
//   res.setHeader('Content-Type', 'application/pdf')
// res.send(data)

// })

// const file = fs.createReadStream(invoicepath);




.catch(err => next(err))


}