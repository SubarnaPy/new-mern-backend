import crypto from 'crypto';
import CourseProgress from './courseProgress.model.js';
import mongoose, { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Name is required'],
     // minlength: [5, 'Name must be at least 5 characters'],
     // lowercase: true,
     // trim: true, // Removes unnecessary spaces
    },
    email: {
      type: String,
      // required: [true, 'Email is required'],
      unique: true,
      //lowercase: true,
      // match: [
      //    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      //  'Please fill in a valid email address',
      // ], // Matches email against regex
    },
    password: {
      type: String,
      // required: [true, 'Password is required'],
      //minlength: [8, 'Password must be at least 8 characters'],
     // select: false, // Will not select password upon looking up a document
    },
    
    subscription: {
      id: String,
      status: {
        type: String, // e.g., 'active', 'pending', 'completed', 'cancelled'
        enum: ['active', 'pending', 'completed', 'cancelled'],
        default: 'pending',
      },
    },
    additionalDetails: {
      type:mongoose.Schema.ObjectId,
      ref:"Profile"
    },

    courses: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Course',
      }
    ],
    courseProgress:[
      {
      
          type: mongoose.Schema.ObjectId,
          ref: 'CourseProgress',
        },
      
      
    ],
  
      
    avatar: {
      public_id: {
        type: String,
      },
      secure_url: {
        type: String,
      },
    },
    role: {
      type: String,
      enum: ['STUDENT', 'ADMIN','INSTRUCTOR'],
      default: 'STUDENT',
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
  },
  {
    timestamps: true,
  }
);

// Hashes password before saving to the database
userSchema.pre('save', async function (next) {
  // If password is not modified then do not hash it
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 10);
  console.log('password', this.password);
  
});
// userSchema.pre('save', async function(next) {
//   if (!this.email || this.email === null) {
//     return next(new Error('Email cannot be null or undefined'));
//   }
  
//   // Ensure email is unique
//   const userWithEmail = await User.findOne({ email: this.email });
//   if (userWithEmail) {
//     return next(new Error('Email already exists'));
//   }
  
//   // If password is not modified, hash it
//   if (this.isModified('password')) {
//     this.password = await bcrypt.hash(this.password, 10);
//   }

//   next();
// });


userSchema.methods = {
  // method which will help us compare plain password with hashed password and returns true or false
  comparePassword: async function (plainPassword) {
    console.log(bcrypt.compare(plainPassword, this.password))
    return await bcrypt.compare(plainPassword, this.password);
  },

  // Will generate a JWT token with user id as payload
  generateJWTToken: async function () {
    return await jwt.sign(
      { id: this._id, role: this.role,email:this.email },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRY||'1d',
      }
    );
  },

  // This will generate a token for password reset
  generatePasswordResetToken: async function () {
    // creating a random token using node's built-in crypto module
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Again using crypto module to hash the generated resetToken with sha256 algorithm and storing it in database
    this.forgotPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Adding forgot password expiry to 15 minutes
    this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000;
    console.log(resetToken);

    return resetToken;
  },
};

const User = model('User', userSchema);

export default User;
