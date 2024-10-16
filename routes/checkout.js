import express from 'express';
import Order from '../models/order.js';
import Cart from '../models/cart.js';
import { paypalClientID } from '../config/env.js';
import { createOrder, captureOrder } from '../services/paypalService.js';

const router = express.Router();

router.get('/checkout', isLoggedIn, function (req, res, next) {
  if (!req.session.cart) {
    console.log('No Cart session found. Redirecting to Shopping Cart page.');
    return res.redirect('/shopping-cart');
  }
  const cart = new Cart(req.session.cart);
  console.log('Created new Cart object using contents of session:');
  console.log(req.session);

  const errMsg = req.flash('error')[0];
  return res.render('shop/checkout', {
    total: cart.totalPrice,
    errMsg: errMsg,
    noError: !errMsg,
    paypalClientID: paypalClientID, // Pass PayPal Client ID for front-end
  });
});

router.post('/api/orders', async (req, res) => {
  if (!req.session.cart) {
    return res.status(400).json({ error: 'No cart found in session' });
  }

  const cart = new Cart(req.session.cart);
  try {
    // Creating PayPal Order, expecting Order Id to be returned
    // Actual API call occurs in separate services.js with createOrder function
    const orderData = await createOrder(cart);
    if (orderData.id) {
      res.json({ id: orderData.id });
    } else {
      res.status(500).json({ error: 'Order creation failed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/orders/:orderID/capture', async (req, res) => {
  try {
    // Capturing PayPal Order, expecting Name and Shipping Address to be returned
    // Actual API call occurs in separate services.js with createOrder function
    const captureData = await captureOrder(req.params.orderID);
    if (captureData.id) {
      const cart = new Cart(req.session.cart);
      const payer = captureData.payer;
      const shipping = captureData.purchase_units[0].shipping;

      // Creating new Order object for the purposes of saving data to Mongodb
      const order = new Order({
        user: req.user,
        cart: cart,
        address: `${shipping?.address?.address_line_1}, ${shipping?.address?.admin_area_2}, ${shipping?.address?.country_code}`,
        name: `${payer?.name?.given_name} ${payer?.name?.surname}`,
        paymentId: captureData.id,
      });

      await order.save();
      req.flash('success', 'Successfully bought product!');
      req.session.cart = null;
      res.json(captureData);
    } else {
      res.status(500).json({ error: 'Capture failed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.oldUrl = req.url;
  res.redirect('/user/signin');
}

export default router;
