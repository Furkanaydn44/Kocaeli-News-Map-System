const mongoose = require('mongoose');

const newsSourceSchema = new mongoose.Schema({
  siteName: { type: String, required: true },
  url: { type: String, required: true }
});

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['trafik_kazasi', 'yangin', 'elektrik_kesintisi', 'hirsizlik', 'kulturel_etkinlik', 'diger']
  },
  locationText: {
    type: String,
    default: ''
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  district: {
    type: String,
    default: ''
  },
  publishDate: {
    type: Date,
    required: true
  },
  sources: {
    type: [newsSourceSchema],
    required: true,
    validate: [arr => arr.length > 0, 'En az bir kaynak gereklidir']
  },
  contentHash: {
    type: String,
    index: true,
    unique: true
  },
  embedding: {
    type: [Number],
    default: []
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for filtering
newsSchema.index({ category: 1 });
newsSchema.index({ district: 1 });
newsSchema.index({ publishDate: -1 });
newsSchema.index({ latitude: 1, longitude: 1 });

const News = mongoose.model('News', newsSchema);

module.exports = News;
