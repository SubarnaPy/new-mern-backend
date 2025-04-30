import mongoose, { model, Schema } from 'mongoose';

const courseSchema = new Schema(
  {
    title: {
      type: String,
      // required: [true, 'Title is required'],
      // minlength: [8, 'Title must be atleast 8 characters'],
      // maxlength: [50, 'Title cannot be more than 50 characters'],
      // trim: true,
    },
    description: {
      type: String,
      // required: [true, 'Description is required'],
      // minlength: [20, 'Description must be atleast 20 characters long'],
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
    },
    
    category: {
      type: mongoose.Schema.Types.ObjectId,
      // required: true,
      ref: "Category",
    },
    tags: {
      type: [String],
      //required: [true, 'Category is required'],
    },
    instructions: {
      type: [String],
    },
    
    
    thumbnail: {
      public_id: {
        type: String,
      },
      secure_url: {
        type: String,
      },
    },
    // numberOfLectures: {
    //   type: Number,
    //   default: 0,
    // },
    createdBy: {
      type:mongoose.Schema.Types.ObjectId,
      ref: 'User',
      //required: [true, 'Course creator ID is required']
      //required: [true, 'Course instructor name is required'],
    },
    createdAt: {
      type:Date,
      default:Date.now
    },
    whatYouWillLearn:{
      type:String
    },
    courseContent:[
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        // required: [true, 'Lesson ID is required']
        // required: [true, 'Lesson title is required'],
        // required: [true, 'Lesson content is required'],
      }
    ],
    ratingAndReviews:[
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RatingAndReview',
        // required: [true, 'Reviewer ID is required']
        // required: [true, 'Review title is required'],
        // required: [true, 'Review content is required'],
      }
    ],
    price:{
      type: Number,
      // required: [true, 'Price is required'],
      // min: [0, 'Price must be a positive number'],
    },
    studentEnrolled:[
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: [true, 'Student ID is required']
      }
    ],
    instructor:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // required: [true, 'Instructor ID is required']
    },
    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Draft",
    },
    links:[{
      type: String,
      // required: [true, 'Links are required'],
      // minlength: [10, 'Links must be atleast 10 characters long'],
    }],
    suggetions:{
      type: String,
      // required: [true, 'Suggetions are required'],
      // minlength: [10, 'Suggetions must be atleast 10 characters long'],
    },
    message:[{
      type: mongoose.Schema.Types.ObjectId,
      refer:'Message'
      // required: [true, 'Comments are required'],
      // minlength: [10, 'Comments must be atleast 10 characters long'],
    }],
    
    purchased:{
      type: Number,
      default: false,
    },
    announcements: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Announcement",
      },
    ],

  },
  {
    timestamps: true,
  }
);

const Course = model('Course', courseSchema);

export default Course;
