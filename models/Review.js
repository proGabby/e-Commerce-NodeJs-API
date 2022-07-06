const mongoose = require('mongoose');

const ReviewSchema = mongoose.Schema(
  {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Please provide rating'],
    },
    title: {
      type: String,
      trim: true,
      required: [true, 'Please provide review title'],
      maxlength: 100,
    },
    comment: {
      type: String,
      required: [true, 'Please provide review text'],
    },
    user: {
      type: mongoose.Schema.ObjectId, //every review is tied to a userid
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.ObjectId, //every review is tied to a productid
      ref: 'Product',
      required: true,
    },
  },
   //timestamps will ensure createdAt property is added
  { timestamps: true }
);
// A compound index... ensure user can leave only one review per product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

//static schema method to calculate avg rating
ReviewSchema.statics.calculateAverageRating = async function (productId) {
  //using aggregation pipeline to calc the avg
  const result = await this.aggregate([
    //first aggregate step... matching
    { $match: { product: productId } },
    //2nd aggregation step .... grouping 
    {
      $group: {
       // _id: null,
        _id: '$product',
        averageRating: { $avg: '$rating' },
        numOfReviews: { $sum: 1 },
      },
    },
  ]);

  try {
    //updating the product model
    await this.model('Product').findOneAndUpdate(
      { _id: productId },
      {
        //using optional chaining on result
        averageRating: Math.ceil(result[0]?.averageRating || 0),
        numOfReviews: result[0]?.numOfReviews || 0,
      }
    );
  } catch (error) {
    console.log(error);
  }
};

ReviewSchema.post('save', async function () {
  //calling the static method calculateAverageRating
  await this.constructor.calculateAverageRating(this.product);
});

ReviewSchema.post('remove', async function () {
  await this.constructor.calculateAverageRating(this.product);
});

module.exports = mongoose.model('Review', ReviewSchema);
