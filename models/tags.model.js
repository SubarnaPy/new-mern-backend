import mongoose, { model, Schema } from 'mongoose';

const tagsSchema = new Schema(
  {
    name:{
        type: String,
      //  req trim: true,
        //unique: true,uired: [true, 'Subsection name is required'],
    },
    description:{
        type: String,
        //  req trim: true,
        //  unique: true,uired: [true, 'Description is required'],
    },
    course:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        //required: [true, 'Course is required'],
    }
  
  },
  {
    timestamps: true,
  }
);

const Tag = model('Tag', tagsSchema);

export default Tag;
