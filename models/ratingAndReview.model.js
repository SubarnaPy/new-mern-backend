import { model, Schema } from 'mongoose';

const ratingAndReviewsSchema = new Schema(
  {
  user:{
    type: Schema.Types.ObjectId,
    ref: 'User',
    
  },
  course:{
    type: Schema.Types.ObjectId,
    ref: 'Course',
    // required: [true, 'Course is required'],
    // unique: true,

  },
  rating:{
    type: Number,
    min: 1,
    max: 5,
    
  },
  review:{
    type: String,
   // required: [true, 'Review is required'],
   // maxlength: [200, 'Review must not exceed 200 characters'],
  },
  
  },
  {
    timestamps: true,
  }
);

const RatingAndReview = model('RatingAndReview', ratingAndReviewsSchema);

export default RatingAndReview;
