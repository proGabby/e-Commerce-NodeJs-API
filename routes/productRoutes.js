const express = require('express');
const router = express.Router();
const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

const {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
} = require('../controllers/productController');

const { getSingleProductReviews } = require('../controllers/reviewController');

router
  .route('/')
  //only authenticated admin can access
  .post([authenticateUser, authorizePermissions('admin')], createProduct)
  //public can access
  .get(getAllProducts);

router
  .route('/uploadImage')
   //only authenticated admin can access
  .post([authenticateUser, authorizePermissions('admin')], uploadImage);

router
  .route('/:id')
  //public can access
  .get(getSingleProduct)
   //only authenticated admin can access
  .patch([authenticateUser, authorizePermissions('admin')], updateProduct)
  .delete([authenticateUser, authorizePermissions('admin')], deleteProduct);

  //publiv can access
router.route('/:id/reviews').get(getSingleProductReviews);

module.exports = router;
