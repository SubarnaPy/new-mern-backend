import crypto from 'crypto';
import fs from 'fs.promises';
import otpGenerator from 'otp-generator';

import cloudinary from 'cloudinary';

import asyncHandler from '../middlewares/asyncHandler.middleware.js';
import AppError from '../utils/AppError.js';
import User from '../models/user.model.js';
import sendMail from '../utils/sendMail.js';
import OTP from '../models/otp.model.js';
import Profile from '../models/profile.model.js';

import { json } from 'express';

const cookieOptions ={
    secure: process.env.NODE_ENV ==='production' ? true : false,
    maxAge: new Date(Date.now() +3* 24 * 60 * 60 * 1000), // 3 day
    httpOnly:true,
}

//send otp

export const sendOtp = asyncHandler(async (req, res, next) => {
    try {
        const {email} = req.body;
        console.log("Email in senOtp controller",email)
        const existingUser = await User.findOne({email});

        if(existingUser){
            return res.status(401).json({
                success:false,
                message: "Email already exists"
            })
        }

        let otp = otpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });
        

        let result = await OTP.findOne({otp:otp});

        while (result) {
            otp = otpGenerator.generate(6,{
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false,
            });
            result = OTP.findOne({otp:otp});
        }
        console.log("OTP generated", otp);


        const createdOtp = await OTP.create({
            email,
            otp
        })
        if(!createdOtp){
            return next(new AppError('Failed to create OTP',400));
        }

        return res.status(200).json({
            success:true,
            message: "OTP created!",
            createdOtp
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
  });
  
    


// register function

export const registerUser = asyncHandler(async (req, res, next) => {
    
    console.log(req.body)
   

    console.log("Incoming request data:", req.body); // Debugging
   

    // if (!fullName || !email || !password || !otp || !role) {
    //     return next(new AppError('All fields are required', 400));
    // }
    if (!req.body.signupData.fullName ) {
        console.log("name", req.body.fullName)
        return next(new AppError('fullname required', 400));
    }
    if ( !req.body.signupData.email ) {
        return next(new AppError('email are required', 400));
    }
    if ( !req.body.signupData.password ) {
        console.log(password)
        return next(new AppError('passwordare required', 400));
        
    }
    if ( !req.body.otp ) {
        return next(new AppError('otp are required', 400));
    }
    if ( !req.body.signupData.accountType) {
        return next(new AppError('roleare required', 400));
    }
   const email = req.body.signupData.email;
   const fullName = req.body.signupData.fullName;
    const password = req.body.signupData.password;
    const role = req.body.signupData.accountType;
    const otp = req.body.otp;


    // Check if the user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        return next(new AppError('Email already exists', 400));
    }

    // Find the most recent OTP
    const recentOtp = await OTP.findOne({ email }).sort({ createdAt: -1 }).limit(1);

    console.log("my otp is: ", otp);
    console.log("resent otp is: ", recentOtp);

    if (!recentOtp) {
        return next(new AppError('OTP not found', 401));
    }

    // Compare the OTPs (convert to string for comparison)
    if (recentOtp.otp.toString() !== otp.toString()) {
        console . log("i am otp")
        return next(new AppError('Invalid OTP', 401));
    }

    // Create profile details
    const profileDetails = await Profile.create({
        gender: null,
        dateOfBirth: null,
        about: null,
        contact: null,
    });
    console.log("user",profileDetails)    // Create new user
    console.log("user iam -60")    // Create new user
  console.log (fullName,
  email,
  password,
  role,
   profileDetails._id,)
//  try{
    const user = await User.create({
        fullName,
        email,
        password,
        role,
        additionalDetails: profileDetails._id,
        avatar: {
            public_id: 'https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg',
            secure_url: 'https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg',
        },
    })
// } catch (err) {
//     // Handle errors like duplicate emails, validation errors, etc.
//     console.error(err);
//     throw new Error('User creation failed');
//   }
    console.log("user iam -70")    // Create new user
     
    console.log("user",user);
    if (!user) {
        return next(new AppError('Failed to create user', 500));
    }

   console.log("user",user);

if (req.file) {
    console.log("uplooading to cloudinary")
    try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
            folder: 'lms3',
            width: 250,
            height: 250,
        });
        console.log("file uploaded successfully",result)

        // Assign uploaded image URL to the course
        if (result) {
            user.avatar.public_id = result.public_id;
            user.avatar.secure_url = result.secure_url;
        }
        if(!result){
            console.log("Error uploading file to cloudinary")
            return next(new AppError('Failed to upload file to cloudinary', 500));
        }

        // Clean up uploaded file from local uploads directory
        await fs.rm(req.file.path);
        console.log("file deleted successfully")
    } catch (error) {
        // Cleanup in case of an error
        try {
            const files = await fs.readdir('uploads/');
            for (const file of files) {
                await fs.unlink(path.join('uploads', file));
            }
        } catch (cleanupError) {
            return next(new AppError('Error cleaning up files', 500));
        }

        return next(new AppError('File not uploaded, please try again', 400));
    }
}

console.log("user iam -80")    // Create new user

    // await user.save();
    
    console.log("user iam -90")    // Create new user

    const token = await user.generateJWTToken();
    console.log("user iam -95")    // Create new user

    res.cookie('token', token, cookieOptions);
    console.log("user iam -100")    // Create new user

    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user,
    });
});


export const loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    console.log(req.body);
    console.log("user iam -10")    // Create new user

    if (!email || !password) {
        return next(new AppError('Email and password fields are required', 400));
    }
    console.log("user iam -20")    // Create new user

    const user = await User.findOne({ email }).select('+password').populate('additionalDetails');
    if (!user) {
        return next(new AppError('User not found', 404));
    }   
     console.log("user iam -30")    // Create new user

try{
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password is valid:', isPasswordValid);
    if (!isPasswordValid) {
        // return next(new AppError('Email or Password is incorrect', 202));
        return next(new AppError('password is incorrect', 400));
    }
    } catch (err) {
    // Handle errors like duplicate emails, validation errors, etc.
    console.error(err);
    throw new Error('User creation failed');
  }
    console.log("user iam -40")    // Create new user

    const token = await user.generateJWTToken();

  

    user.password = undefined;

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
        success:true,
         message:'user logged in successfully',
         user,
         token,
    });
});




//logout


export const logoutUser =asyncHandler(async(req,res,next)=>{

    
    console.log("user is",req.user);
    res.cookie('token','null',{
        secure:process.env.NODE_ENV ==='production' ? true : false,
        maxAge:0,
        httpOnly:true,
    });

    res.status(200).json({
        success:true,
        message:'user logged out successfully',
          
    });



});

    //logedin user details



export const getLoggedInUserDetails=asyncHandler(async(req,res,next)=>{
    //console.log("asdfghjkjhgfdsfghjk",req.user.id)
    const userId = req.user.id || req.user._id

    console.log("user isssssssssssssssssss",userId)
    const user=await User.findById(userId);
    
   // console.log(user);
    if(!user){
        return next(new AppError('User not found',404));
    }

    res.status(200).json({
        success:true,
        user,
        message:'user details',
    });
});



    // forgot password

    export const forgotPassword=asyncHandler(async(req,res,next)=>{
        const {email}=req.body;

        if(!email){
            return next(new AppError('Email is required',400));
        }

        const user =await User.findOne({email});

        if(!user){
            return next(new AppError('User not found with this email',404));
        }

        const resetToken =await user.generatePasswordResetToken();

        await user.save();
        console.log(process.env.FRONTENED_URL);


        const resetPassword =`${process.env.FRONTENED_URL}/RESET-PASSWORD/${resetToken}`;


        const subject='reset password';
        const massage =`you can reset your password by clicking a href=${resetPassword}`;


        try{
            await sendMail(email,subject,massage);

            res.status(200).json({
                resetToken,
                resetPassword,
                success:true,
                massage:`Reset password link sent to your email ${email}`,
            });
        }  catch(err){
            user.forgotPasswordToken=null;
            user.forgotPasswordExpiry=null;

            await user.save();

            return next(new AppError('Failed to send email',500));
        }


    });



    //  todo reset password

    export const resetPassword=asyncHandler(async(req,res,next)=>{
        const {resetToken} = req.body;
        console.log(resetToken);
        if(!resetToken){
            return next(new AppError('Token is required',400));
        }


        const{password,
            confirmPassword, } = req.body;
            if(confirmPassword != password){
                return next(new AppError('Passwords do not match',400));
            }


        const forgotPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
       console.log(forgotPasswordToken);
        if(!password){
            return next(new AppError('Password is required',400));
        };

        console.log(forgotPasswordToken);

        const user = await User.findOne({
            forgotPasswordToken,
            forgotPasswordExpiry:{$gt:Date.now()},// $gt will help us check for greater than value, with this we can check if token is valid or expired
  
        });


        if(!user){
            return next(new AppError('Invalid token or expired token',400));
        }

        user.password=password;
        user.forgotPasswordToken=null;
        user.forgotPasswordExpiry=null;
        console.log(user);
        console.log(user.password);

        await user.save();

        res.status(200).json({
            success:true,
            massage:'password reset successfully',
        });

    });


    //todo   change password

export const changePassword =asyncHandler(async(req,res,next)=>{
    console.log(req.user)
    const{oldPassword, newPassword} = req.body;
    const userId=req.user.id;

    if(!oldPassword ||!newPassword){
        return next(new AppError('All fields are required',400));
    }

    const user =await User.findById(userId).select('+password');

    if(!user ||!(await user.comparePassword(oldPassword))){
        return next(new AppError('user not exist or Invalid old password',401));
    }

    //const isPasswordValid = await user.comparePassword(oldPassword);

    user.password=newPassword;

    await user.save();

    res.status(200).json({
        success:true,
        massage:'password changed successfully',
        password: user.password,
    });

});


export const updateUser = asyncHandler(async(req,res,next)=>{
    const {fullName}=req.body;
    //const {id}=req.params;
    const id= req.user._id
    const  newuser= req.user;
    console.log("new user",newuser)

    const user = await User.findById(id);

    if(!user){
        return next(new AppError('User not found',404));
    }

    if(fullName){
        user.fullName=fullName;
    }


    if(req.file){
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);

        try{

            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms', // Save files in a folder named lms
                width: 250,
                height: 250,
                gravity: 'faces', // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
                crop: 'fill',
              });

              if(result){

                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;

                fs.rm(`uploads/${req.file.filename}`);

              }

        } catch(e){
            return next(new AppError('Failed to upload avatar ',500));
        }
    }

    await user.save();
      // Update Redis cache
      try {
        await redis.set(user.id, JSON.stringify(user));
        console.log('User updated in Redis');
    } catch (error) {
        console.error('Error updating user in Redis:', error);
    }

    res.status(200).json({
        success: true,
        user,
        message: 'User updated successfully',
    });
});

export const socialAuth = asyncHandler(async (req, res, next) => {
    const { fullName, email } = req.body;

    // Check if the user already exists
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
        // Create a new user if not found
        user = await User.create({ fullName, email });
        isNewUser = true;
    }

    // Generate JWT token
    const token = await user.generateJWTToken();

    // Store user data in Redis
    try {
        await redis.set(user.id, JSON.stringify(user));
        console.log('User stored in Redis');
    } catch (err) {
        console.error('Error interacting with Redis:', err);
    }

    // Remove sensitive fields before sending the response
    user.password = undefined;

    // Set JWT in cookies
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Send the response
    res.status(200).json({
        success: true,
        message: 'User logged in successfully',
        user,
        isNewUser, // Helps the frontend know if this is a new user
        token,
    });
});
