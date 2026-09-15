const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, default: '' },
    institution: { type: String, default: '' },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    passwordHash: { type: String, required: true },
    enrolledCourses: [{ type: String, default: [] }],
    paymentStatus: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
