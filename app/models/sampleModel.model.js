const mongoose = require('mongoose');
const { Schema } = mongoose;





const SampleModelSchema = new Schema({
  user: { type: String },
  totalPoints: { type: Number },
},
{
  timestamps: true,
  toJSON: {
    virtuals: true,
  },
});




module.exports = mongoose.model('SampleModel', SampleModelSchema);

