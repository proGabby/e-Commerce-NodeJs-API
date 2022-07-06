const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const {
  createTokenUser,
  attachCookiesToResponse,
  checkPermissions,
} = require('../utils');

const getAllUsers = async (req, res) => {
  // console.log(req.user);
  //find users with roles as user and password field filter out
  const users = await User.find({ role: 'user' }).select('-password');
  res.status(StatusCodes.OK).json({ users });
};

const getSingleUser = async (req, res) => {
  //find one user, filter out password
  const user = await User.findOne({ _id: req.params.id }).select('-password');
  // throw error if no user
  if (!user) {
    throw new CustomError.NotFoundError(`No user with id : ${req.params.id}`);
  }
  //ensuring only admin or owner of the resources can access
  checkPermissions(req.user, user._id);

  res.status(StatusCodes.OK).json({ user });
}; 

const showCurrentUser = async (req, res) => {
  //NB this route hit after authentication. therefore, req.user is available
  //we return req.user which we made from the payload instead of querying the db
  res.status(StatusCodes.OK).json({ user: req.user });
};

// update user with user.save()
const updateUser = async (req, res) => {  
  //get user email and name from request 
  const { email, name } = req.body;
  if (!email || !name) {
    throw new CustomError.BadRequestError('Please provide all values');
  }

  //geting the user using its id
  const user = await User.findOne({ _id: req.user.userId });

  //manually updating the value
  user.email = email;
  user.name = name;

  //saving the details with the presave hook
  //Note: trigering the hook will also resalt the password.
  //  therefore, write a ismodified logic to prevent this when the password isn't updated
  await user.save();

  const tokenUser = createTokenUser(user);
  //create token for user
  attachCookiesToResponse({ res, user: tokenUser });

  res.status(StatusCodes.OK).json({ user: tokenUser });
};


// update user with findOneAndUpdate
// const updateUser = async (req, res) => {
//   const { email, name } = req.body;
//   if (!email || !name) {
//     throw new CustomError.BadRequestError('Please provide all values');
//   }
//   const user = await User.findOneAndUpdate(
//     { _id: req.user.userId },
//     { email, name },
//     { new: true, runValidators: true }
//   );
//   const tokenUser = createTokenUser(user);
//   attachCookiesToResponse({ res, user: tokenUser });
//   res.status(StatusCodes.OK).json({ user: tokenUser });
// };

 
const updateUserPassword = async (req, res) => {
  //get old and new password from req.body
  const { oldPassword, newPassword } = req.body;
  //throw error if one is missing
  if (!oldPassword || !newPassword) {
    throw new CustomError.BadRequestError('Please provide both values');
  }
  //NB: no need to check if user exist as user already passed authentication middleware, hence user exist and token check or created
  //find the user from db
  const user = await User.findOne({ _id: req.user.userId });
  //compare password
  const isPasswordCorrect = await user.comparePassword(oldPassword);

  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError('Invalid Credentials');
  }
  //set user password prop. to new password
  user.password = newPassword;
  //save user NOTE: .save pre-hook ensure new password is hashed
  await user.save();
  res.status(StatusCodes.OK).json({ msg: 'Success! Password Updated.' });
};

module.exports = {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
};


