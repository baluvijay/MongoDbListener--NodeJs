const mongoose = require('mongoose');

const { Schema } = mongoose;

const TrackerSchema = new Schema({
  varName: { type: String, unique: true },
  varType: { type: String, required: false },
  varValue: Schema.Types.Mixed,
}, {
  timestamps: true,
});

module.exports = mongoose.model('Tracker', TrackerSchema);

