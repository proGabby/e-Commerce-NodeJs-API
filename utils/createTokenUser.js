const createTokenUser = (user) => {
  //object to create token for user
  return { name: user.name, userId: user._id, role: user.role };
};

module.exports = createTokenUser;
