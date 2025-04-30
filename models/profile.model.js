import { model, Schema } from 'mongoose';

const profileSchema = new Schema(
  {
   gender:{
     type: String,
    
   },
   dateOfBirth:{
     type: String,
   },
   about:{
     type: String,
   },
   contact:{
     type:Number,
   }
  },
  {
    timestamps: true,
  }
);

const Profile = model('Profile', profileSchema);

export default Profile;
