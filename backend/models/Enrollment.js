const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    courseId: { type: String, required: true },
    paymentReference: { type: String, default: '' },
    paymentProvider: { type: String, default: 'paystack' },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    paid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);
