const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    
    // Check if user still exists
    const user = await User.findById(decoded.user.id);
    if (!user) {
      return res.status(401).json({ msg: 'User no longer exists' });
    }
    
    next();
  } catch (err) {
    console.error('Token is not valid:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
