require('dotenv').config();
require('express-async-errors'); //middleware to jandle all try/catch errors

// express
const express = require('express');
const app = express();

// rest of the packages
const morgan = require('morgan'); //to handle request logging of route on the console
const cookieParser = require('cookie-parser'); //to get cookie from frontend
const fileUpload = require('express-fileupload'); //to enable file uploading
const rateLimiter = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');

// database
const connectDB = require('./db/connect');

//  routers
const authRouter = require('./routes/authRoutes');
const userRouter = require('./routes/userRoutes');
const productRouter = require('./routes/productRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const orderRouter = require('./routes/orderRoutes');

// middlewares
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

app.set('trust proxy', 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 60,
  })
);

app.use(helmet());
app.use(cors()); //to enable sharing of resources on different domain
app.use(xss());
app.use(mongoSanitize());
//app.use(morgan('tiny')) //only needed in development not product

//have access to json data
app.use(express.json());
//use to get the cookies coming back from the browser.... cookies available on req.cookies or req.signedCookies 
app.use(cookieParser(process.env.JWT_SECRET));

app.use(express.static('./public')); //to use static resourcss
app.use(fileUpload());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/orders', orderRouter);

app.use(notFoundMiddleware); 

app.use(errorHandlerMiddleware); //middleware is usually last... it is invoke in existing route

const port = process.env.PORT || 5000;
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
