const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    schoolDept: { type: String, default: '' },
    source: { type: String, default: 'Landing_Page' },
    emailSentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Lead || mongoose.model('Lead', leadSchema);
