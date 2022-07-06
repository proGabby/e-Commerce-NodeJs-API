const CustomError = require('../errors');
const { isTokenValid } = require('../utils');

const authenticateUser = async (req, res, next) => {
  //get signed cookie from frontend
  const token = req.signedCookies.token;
  //if no token throw error
  if (!token) {
    throw new CustomError.UnauthenticatedError('Authentication Invalid');
  }

  try {
    //destructure payload 
    const { name, userId, role } = isTokenValid({ token });
    //set new req prop. ie req.user
    req.user = { name, userId, role };
    //transfer to the next middleware
    next();
  } catch (error) {
    throw new CustomError.UnauthenticatedError('Authentication Invalid');
  }
};

const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    //throw error if users role is not include the rest array ie argument passed to the func 
    if (!roles.includes(req.user.role)) {
      throw new CustomError.UnauthorizedError(
        'Unauthorized to access this route'
      );
    }
    //transfer to the next middleware
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizePermissions,
};
