const Order = require('../models/Order');
const Product = require('../models/Product');
const stripe = require('stripe')(process.env.STRIPE_KEY)

const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { checkPermissions } = require('../utils');

const fakeStripeAPI = async ({ amount, currency }) => {
  const client_secret = 'someRandomValue';
  return { client_secret, amount };
};

const createOrder = async (req, res) => {
  //getting cart data, tax and shippingFee from request param
  const { items: cartItems, tax, shippingFee } = req.body;
  //check for cart data
  if (!cartItems || cartItems.length < 1) {
    throw new CustomError.BadRequestError('No cart items provided');
  }
  //check for tax and shipping fee
  if (!tax || !shippingFee) {
    throw new CustomError.BadRequestError(
      'Please provide tax and shipping fee'
    );
  }

  let orderItems = [];
  let subtotal = 0;
  //iterating through each the cartitems
  for (const item of cartItems) {
    //find the item with id
    const dbProduct = await Product.findOne({ _id: item.product });
    //check for item
    if (!dbProduct) {
      throw new CustomError.NotFoundError(
        `No product with id : ${item.product}`
      );
    }
    //destruction name, price, image and id
    const { name, price, image, _id } = dbProduct;
    //make a single order object
    const singleOrderItem = {
      amount: item.amount,
      name,
      price,
      image,
      product: _id,
    };
    // add item to order
    orderItems = [...orderItems, singleOrderItem];
    // calculate subtotal
    subtotal += item.amount * price;
  }
  // calculate total
  const total = tax + shippingFee + subtotal;


  // get client secret
            // const paymentIntent = await fakeStripeAPI({
            //   amount: total,
            //   currency: 'usd',
            // });
  const paymentIntent = await stripe.paymentIntents.create({
    amount: total,
    currency: 'usd',
  });
  
  //create a order
  const order = await Order.create({
    orderItems,
    total,
    subtotal,
    tax,
    shippingFee,
    clientSecret: paymentIntent.client_secret,
    user: req.user.userId,
  });

  //send response
  res
    .status(StatusCodes.CREATED)
    .json({ order, clientSecret: order.clientSecret });

};

const getAllOrders = async (req, res) => {
  //get all orders... only admin
  const orders = await Order.find({});
  //send response
  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};

const getSingleOrder = async (req, res) => {
  //get id from params
  const { id: orderId } = req.params;
  //get the order associated with the id
  const order = await Order.findOne({ _id: orderId });
  //check order
  if (!order) {
    throw new CustomError.NotFoundError(`No order with id : ${orderId}`);
  }
  //ensure only admin or owner of order can access
  checkPermissions(req.user, order.user);
  //send response
  res.status(StatusCodes.OK).json({ order });
};


const getCurrentUserOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.userId });
  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};


const updateOrder = async (req, res) => {
  const { id: orderId } = req.params;
  //get payment intend id from request
  const { paymentIntentId } = req.body;
  //get order
  const order = await Order.findOne({ _id: orderId });
  //check for order
  if (!order) {
    throw new CustomError.NotFoundError(`No order with id : ${orderId}`);
  }
  //ensure only permitted user can access
  checkPermissions(req.user, order.user);
  //update order paument intent
  order.paymentIntentId = paymentIntentId;
  //update order status
  order.status = 'paid';
  //save update using prehook
  await order.save();
  //send response
  res.status(StatusCodes.OK).json({ order });
};

module.exports = {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrders,
  createOrder,
  updateOrder,
};
