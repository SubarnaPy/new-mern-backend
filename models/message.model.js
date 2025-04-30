import mongoose, { model, Schema } from 'mongoose';

const messageSchema = new Schema(
  {
    questions:[{
      type:String
    }],
    reply:[{
      type:String
    }
    ]

  },
  {
    timestamps: true,
  }
);

const Message = model('Message', messageSchema);

export default Course;
