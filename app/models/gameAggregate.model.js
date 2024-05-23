const mongoose = require('mongoose');



const { Schema, SchemaTypes: { ObjectId } } = mongoose;



const GameAggregateSchema = new Schema({
  user: { type: ObjectId, ref: 'Member', required: true },
  timezone: { type: String },
  totalPoints: { type: Number },
  qualifierPassed: { type: Boolean, required: true, default: false },

},
{
  timestamps: true,
  toJSON: {
    virtuals: true,
  },
});




module.exports = mongoose.model('GameAggregate', GameAggregateSchema);

