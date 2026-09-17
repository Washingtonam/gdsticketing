const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true },
    options: { type: [String], default: [] },
    answerIndex: { type: Number, min: 0, default: 0 },
  },
  { _id: true }
);

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    moduleId: { type: String, default: '' },
    type: { type: String, enum: ['video', 'guide', 'pdf', 'text', 'quiz', 'assignment'], default: 'video' },
    contentUrl: { type: String, default: '' },
    contentMimeType: { type: String, default: '' },
    resourceTitle: { type: String, default: '' },
    terminalInstructions: { type: String, default: '' },
    week: { type: Number, min: 1, default: 1 },
    day: { type: Number, min: 1, default: 1 },
    duration: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isPreview: { type: Boolean, default: false },
    required: { type: Boolean, default: true },
    questions: { type: [quizQuestionSchema], default: [] },
  },
  { _id: true }
);

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
    unlockMode: { type: String, enum: ['immediate', 'scheduled'], default: 'immediate' },
    unlockAfterDays: { type: Number, min: 0, default: 0 },
    lessons: { type: [lessonSchema], default: [] },
    requiredLessonIds: { type: [String], default: [] },
    assessmentRequired: { type: Boolean, default: false },
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
    targetAudience: { type: String, default: '' },
    pricingTier: { type: String, default: '' },
    groupDiscountPercent: { type: Number, min: 0, max: 100, default: 0 },
    introVideoUrl: { type: String, default: '' },
    syllabusUrl: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'published', 'paused', 'archived'], default: 'draft' },
    featured: { type: Boolean, default: false },
    thumbnailUrl: { type: String, default: '' },
    lessons: [lessonSchema],
    modules: { type: [moduleSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Course || mongoose.model('Course', courseSchema);
