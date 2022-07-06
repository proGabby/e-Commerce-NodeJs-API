const Product = require('../models/Product');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');

//creating product
//Note: only authenticated admin can access here.
const createProduct = async (req, res) => {
  //user but pass authentication, permission middleware before here. hence, no need to validate

  //Note: from the product model, to create a product a user prop. is required from the request
  //the userid assign to user prop. required to create a product
  req.body.user = req.user.userId;
  //create a product
  const product = await Product.create(req.body);
  res.status(StatusCodes.CREATED).json({ product });
};

const getAllProducts = async (req, res) => {
  //TODO: sorting and filtering implementation

  //find all product
  const products = await Product.find({});

  res.status(StatusCodes.OK).json({ products, count: products.length });
};

const getSingleProduct = async (req, res) => {
  //get the id from the params variable 
  const { id: productId } = req.params;
  //find the product with the id
  //Note: review is not a product model. hence, to .populate review can only be done on a virtual property
  //Note: the virtual property cant be query
  const product = await Product.findOne({ _id: productId }).populate('reviews');
  //throw error if product not found
  if (!product) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
  }

  res.status(StatusCodes.OK).json({ product });
};

const updateProduct = async (req, res) => {
  //get the id from the params variable 
  const { id: productId } = req.params;
  //find and update the product using the id
  //Note is it a patch therefore it only replaces provided field found on req.body
  const product = await Product.findOneAndUpdate({ _id: productId }, req.body, {
    new: true,
    runValidators: true,
  });
  //product not found throw error
  if (!product) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
  }

  res.status(StatusCodes.OK).json({ product });
};

const deleteProduct = async (req, res) => {
  //get the id of prouduct from the params variable 
  const { id: productId } = req.params;
  //find product the with it id
  const product = await Product.findOne({ _id: productId });

  if (!product) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
  }

  //remove product and all it reviews using remove prehook method
  await product.remove();
  res.status(StatusCodes.OK).json({ msg: 'Success! Product removed.' });
};

const uploadImage = async (req, res) => {
  //check if request carries a file
  if (!req.files) {
    throw new CustomError.BadRequestError('No File Uploaded');
  }
  //get the image object
  const productImage = req.files.image;
  //check if image object is actually an image
  if (!productImage.mimetype.startsWith('image')) {
    throw new CustomError.BadRequestError('Please Upload Image');
  }
  //define acceptable size
  const maxSize = 1024 * 1024;
  //check image size
  if (productImage.size > maxSize) {
    throw new CustomError.BadRequestError(
      'Please upload image smaller than 1MB'
    );
  }
  //create a path to save image on server
  const imagePath = path.join(
    __dirname,
    '../public/uploads/' + `${productImage.name}`
  );

  //save image on the public folder in the server
  await productImage.mv(imagePath);

  res.status(StatusCodes.OK).json({ image: `/uploads/${productImage.name}` });
};

module.exports = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
};
