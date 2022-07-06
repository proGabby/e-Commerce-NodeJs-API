const Review = require('../models/Review');
const Product = require('../models/Product');

const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { checkPermissions } = require('../utils');

const createReview = async (req, res) => {
  //get productId from the request body
  const { product: productId } = req.body;
  // find product with productId
  const isValidProduct = await Product.findOne({ _id: productId });
  //throw error if no product found
  if (!isValidProduct) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
  }
  //check if user already submitted a review
  const alreadySubmitted = await Review.findOne({
    product: productId,
    user: req.user.userId,
  });
  //throw error if review already review
  if (alreadySubmitted) {
    throw new CustomError.BadRequestError(
      'Already submitted review for this product'
    );
  }
  //supply user object with the userId from the auth cookie
  req.body.user = req.user.userId;
  //create review
  const review = await Review.create(req.body);
  res.status(StatusCodes.CREATED).json({ review });
};


const getAllReviews = async (req, res) => {
  //fetch all reviews
  //Note: populate method allow ref of document in other collections
  //poulate of product and user is possible since review refs the user and product model
  const reviews = await Review.find({}).populate({
    path: 'product', //the model we want to access
    select: 'name company price', //getting only the name, company and price properties from the product
  })
  .populate({
    path: 'user', //the model we want to access
    select: 'name', //getting only the name from the user
  })
  //send back response
  res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};


const getSingleReview = async (req, res) => {
  //get review id froom the params
  const { id: reviewId } = req.params;
  //find the review with the provide id
  const review = await Review.findOne({ _id: reviewId });
  //check for review availabilty
  if (!review) {
    throw new CustomError.NotFoundError(`No review with id ${reviewId}`);
  }
  //provide response with status code
  res.status(StatusCodes.OK).json({ review });
};


const updateReview = async (req, res) => {
  //get review id from request params
  const { id: reviewId } = req.params;
  //get rating, title, comment from request body
  const { rating, title, comment } = req.body;
  //check for review
  const review = await Review.findOne({ _id: reviewId });
  //throw error if review does not exist
  if (!review) {
    throw new CustomError.NotFoundError(`No review with id ${reviewId}`);
  }
  //check for permission to ensure only admin and owner of review can update
  checkPermissions(req.user, review.user);
  //set new value for review rating, title and comment
  review.rating = rating;
  review.title = title;
  review.comment = comment;
  //save review using save prehook 
  await review.save();
  //send back respond with status code
  res.status(StatusCodes.OK).json({ review });
};

//deleta a review
const deleteReview = async (req, res) => {
  //get review id from request params
  const { id: reviewId } = req.params;
  //find review
  const review = await Review.findOne({ _id: reviewId });
  //check for review availability
  if (!review) {
    throw new CustomError.NotFoundError(`No review with id ${reviewId}`);
  }
  //ensure only admin and owner of the review can delete
  checkPermissions(req.user, review.user);
  //remove review use the remove prehook
  await review.remove();
  //send back respond with status code
  res.status(StatusCodes.OK).json({ msg: 'Success! Review removed' });
};

//get only reviews associated with a single product
const getSingleProductReviews = async (req, res) => {
  //get product id from the params variable
  const { id: productId } = req.params;
  //query only reviews of a product with the product id
  const reviews = await Review.find({ product: productId });
  //send back response
  res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};

module.exports = {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getSingleProductReviews,
};
