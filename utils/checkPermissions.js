const CustomError = require('../errors');

//restrict authenticated users to access some routes 
const chechPermissions = (requestUser, resourceUserId) => {
  // console.log(requestUser);
  // console.log(resourceUserId);
  // console.log(typeof resourceUserId);
  
  //close function if user role is admin
  if (requestUser.role === 'admin') return;
  //close function if a user is accessing its content.
  if (requestUser.userId === resourceUserId.toString()) return;
  //throw error 
  throw new CustomError.UnauthorizedError(
    'Not authorized to access this route'
  );
};

module.exports = chechPermissions;
