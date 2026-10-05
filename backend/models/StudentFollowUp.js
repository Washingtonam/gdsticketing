const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema(
  {
    channel: { type: String, enum: ['whatsapp', 'email'], required: true },
    template: { type: String, required: true },
    adminId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const studentFollowUpSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['new', 'contacted', 'responded', 'onboarded'],
      default: 'new',
    },
    interactions: { type: [interactionSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.models.StudentFollowUp || mongoose.model('StudentFollowUp', studentFollowUpSchema);
