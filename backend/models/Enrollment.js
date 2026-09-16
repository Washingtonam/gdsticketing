const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    courseId: { type: String, required: true },
    paymentReference: { type: String, default: '' },
    paymentProvider: { type: String, default: 'paystack' },
    status: {
      type: String,
      enum: ['pending_payment', 'paid_pending_approval', 'approved', 'failed', 'rejected'],
      default: 'pending_payment',
    },
    paid: { type: Boolean, default: false },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);
