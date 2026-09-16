const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ['video', 'guide', 'quiz'], default: 'video' },
    contentUrl: { type: String, default: '' },
    duration: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isPreview: { type: Boolean, default: false },
  },
  { _id: true }
);

const courseSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String, default: '' },
    price: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    level: { type: String, default: 'Beginner' },
    status: { type: String, enum: ['draft', 'published', 'paused', 'archived'], default: 'draft' },
    featured: { type: Boolean, default: false },
    thumbnailUrl: { type: String, default: '' },
    lessons: [lessonSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Course || mongoose.model('Course', courseSchema);
