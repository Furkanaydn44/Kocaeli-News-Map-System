const mongoose = require('mongoose');

const geoCacheSchema = new mongoose.Schema({
  locationText: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  formattedAddress: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30 // 30 gün sonra otomatik sil
  }
});

const GeoCache = mongoose.model('GeoCache', geoCacheSchema);

module.exports = GeoCache;
