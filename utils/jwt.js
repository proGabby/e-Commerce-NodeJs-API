const jwt = require('jsonwebtoken');

//create jwt token
const createJWT = ({ payload }) => {
  //sign token
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });
  return token;
};

//verify token and get payload
const isTokenValid = ({ token }) => jwt.verify(token, process.env.JWT_SECRET);

//setup and attach cookie 
const attachCookiesToResponse = ({ res, user }) => {
  //create jwt token
  const token = createJWT({ payload: user });
  //calc 24hrs in ms
  const oneDay = 1000 * 60 * 60 * 24;

  res.cookie('token', token, {
    httpOnly: true,
    expires: new Date(Date.now() + oneDay), //set cookie expiring time
    secure: process.env.NODE_ENV === 'production', //will send cookie over https in production
    signed: true,
  });
};

module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
};
