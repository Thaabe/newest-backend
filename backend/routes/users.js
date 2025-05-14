// backend/routes/users.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// @route   GET api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', auth, checkRole('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/stats
// @desc    Get user statistics
// @access  Private/Admin
router.get('/stats', auth, checkRole('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalConsumers = await User.countDocuments({ role: 'consumer' });
    const totalLenders = await User.countDocuments({ role: 'lender' });
    const pendingApprovals = await User.countDocuments({ role: 'lender', isApproved: false });
    
    res.json({
      totalUsers,
      totalConsumers,
      totalLenders,
      pendingApprovals
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/users/approve/:id
// @desc    Approve a lender
// @access  Private/Admin
router.put('/approve/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    if (user.role !== 'lender') {
      return res.status(400).json({ msg: 'Only lender accounts can be approved' });
    }
    
    user.isApproved = true;
    await user.save();
    
    res.json({ msg: 'Lender approved successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/users/:id
// @desc    Delete a user
// @access  Private/Admin
router.delete('/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    await user.remove();
    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/search', auth, checkRole('admin', 'lender'), async (req, res) => {
  try {
    const { email, role } = req.query;
    
    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }
    
    const query = { email };
    if (role) {
      query.role = role;
    }
    
    const user = await User.findOne(query).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


router.get('/pending', auth, checkRole('admin'), async (req, res) => {
  try {
    const pendingLenders = await User.find({ 
      role: 'lender', 
      isApproved: false 
    }).select('-password');
    
    res.json(pendingLenders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
module.exports = router;