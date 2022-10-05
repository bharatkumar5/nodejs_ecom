const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');
const isauth = require('../middleware/is-auth')

const router = express.Router();



router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', isauth ,shopController.getCart);

router.post('/cart',isauth , shopController.postCart);

router.post('/cart-delete-item', isauth ,shopController.postCartDeleteProduct);

router.get('/orders', isauth ,shopController.getOrders);

router.post('/create-order',isauth , shopController.postOrder);

router.get('/checkout', shopController.getCheckout);

router.get('/orders/:orderid',isauth,shopController.getinvoice)

module.exports = router;
