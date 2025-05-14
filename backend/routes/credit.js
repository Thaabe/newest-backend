// backend/routes/credit.js

const express = require('express');
const router = express.Router();
const CreditRecord = require('../models/CreditRecord');
const User = require('../models/User');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// @route   POST api/credit
// @desc    Add a credit record
// @access  Private/Lender
router.post('/', auth, checkRole('lender'), async (req, res) => {
  const { consumerId, loanType, amount, dueDate } = req.body;
  
  try {
    // Check if consumer exists
    const consumer = await User.findById(consumerId);
    if (!consumer || consumer.role !== 'consumer') {
      return res.status(404).json({ msg: 'Consumer not found' });
    }
    
    const creditRecord = new CreditRecord({
      consumer: consumerId,
      lender: req.user.id,
      loanType,
      amount,
      dueDate,
      paymentStatus: 'Outstanding',
      paymentHistory: [
        {
          date: Date.now(),
          status: 'Outstanding',
          amount: 0
        }
      ]
    });
    
    await creditRecord.save();
    res.json(creditRecord);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/credit/consumer/:id
// @desc    Get credit records for a specific consumer
// @access  Private/Lender or Consumer (if own records)
router.get('/consumer/:id', auth, async (req, res) => {
  try {
    // Check if requester is admin, the consumer themselves, or a lender
    if (
      req.user.role !== 'admin' && 
      req.user.id !== req.params.id &&
      req.user.role !== 'lender'
    ) {
      return res.status(403).json({ msg: 'Not authorized to view these records' });
    }
    
    const creditRecords = await CreditRecord.find({ consumer: req.params.id })
      .populate('lender', 'name')
      .sort({ createdAt: -1 });
    
    res.json(creditRecords);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/credit/lender
// @desc    Get credit records added by the logged-in lender
// @access  Private/Lender
router.get('/lender', auth, checkRole('lender'), async (req, res) => {
  try {
    const creditRecords = await CreditRecord.find({ lender: req.user.id })
      .populate('consumer', 'name email idNumber')
      .sort({ createdAt: -1 });
    
    res.json(creditRecords);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/credit/:id/status
// @desc    Update payment status of a credit record
// @access  Private/Lender
router.put('/:id/status', auth, checkRole('lender'), async (req, res) => {
  const { paymentStatus, paymentAmount } = req.body;
  
  try {
    const creditRecord = await CreditRecord.findById(req.params.id);
    
    if (!creditRecord) {
      return res.status(404).json({ msg: 'Credit record not found' });
    }
    
    // Only the lender who created the record can update it
    if (creditRecord.lender.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this record' });
    }
    
    // Update payment status
    creditRecord.paymentStatus = paymentStatus;
    
    // Add to payment history
    creditRecord.paymentHistory.push({
      date: Date.now(),
      status: paymentStatus,
      amount: paymentAmount || 0
    });
    
    await creditRecord.save();
    res.json(creditRecord);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/credit/score/:id
// @desc    Calculate credit score for a consumer
// @access  Private/Lender or Consumer (if own score)
router.get('/score/:id', auth, async (req, res) => {
  try {
    // Check if requester is admin, the consumer themselves, or a lender
    if (
      req.user.role !== 'admin' && 
      req.user.id !== req.params.id &&
      req.user.role !== 'lender'
    ) {
      return res.status(403).json({ msg: 'Not authorized to view this score' });
    }
    
    const creditRecords = await CreditRecord.find({ consumer: req.params.id });
    
    if (creditRecords.length === 0) {
      return res.json({ score: 700, message: 'No credit history available' });
    }
    
    // Simple credit score calculation
    // Start with base score
    let score = 700;
    
    // Count late payments and defaults
    let latePayments = 0;
    let defaults = 0;
    let outstandingDebt = 0;
    
    creditRecords.forEach(record => {
      // Count late payments in history
      record.paymentHistory.forEach(payment => {
        if (payment.status === 'Late') latePayments++;
        if (payment.status === 'Defaulted') defaults++;
      });
      
      // Add current outstanding debt
      if (record.paymentStatus === 'Outstanding') {
        outstandingDebt += record.amount;
      }
    });
    
    // Deduct points for late payments (-10 points each)
    score -= latePayments * 10;
    
    // Deduct points for defaults (-50 points each)
    score -= defaults * 50;
    
    // Deduct points for high outstanding debt (1 point per $1000)
    score -= Math.floor(outstandingDebt / 1000);
    
    // Ensure score doesn't go below 300 or above 850
    score = Math.max(300, Math.min(score, 850));
    
    // Determine credit rating
    let rating = 'Excellent';
    if (score < 580) rating = 'Poor';
    else if (score < 670) rating = 'Fair';
    else if (score < 740) rating = 'Good';
    else if (score < 800) rating = 'Very Good';
    
    res.json({
      score,
      rating,
      factors: {
        latePayments,
        defaults,
        outstandingDebt,
        totalRecords: creditRecords.length
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;