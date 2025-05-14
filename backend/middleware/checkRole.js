// backend/middleware/checkRole.js

// Middleware to check user role
const checkRole = (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ msg: 'Not authorized' });
      }
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ msg: 'Not authorized for this action' });
      }
      
      next();
    };
  };
  
  module.exports = checkRole;