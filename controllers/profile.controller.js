import fs from 'fs.promises';
import path from 'path';
import cloudinary from 'cloudinary';
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import Profile from "../models/profile.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";

// Get user profile by user ID

export const getUserProfile = asyncHandler(async (req, res, next) => {
  //console.log("sdfghjhgfdsdfghj", req.user);
  const userId = req.user.id||req.user._id;
  console.log("userId---------------------------------------------------", userId);

  try {
    const user = await User.findById(userId).populate('additionalDetails').populate('courses').populate('courseProgress').exec();
    //  console.log("------------------------------",user)
    if (!user) {
      return next(new AppError('No user found with that ID', 494));
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(new AppError('Server Error', 500));
  }
});

//update profile

export const updateUserProfile = asyncHandler(async (req, res, next) => {
  console.log(req.file)
  const userId = req.user.id;
  const { gender="",
    dateOfBirth="",
    about="",
    contact,} = req.body;

  try {
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }
  if(req.body.fullName){
    await User.findByIdAndUpdate(userId,{
      fullName:req.body.fullName
    },{new:true})
  }
  const profileID=user.additionalDetails;
  const profile = await Profile.findByIdAndUpdate(profileID, {
    gender,
    dateOfBirth,
    about,
    contact,
    }, { new: true });
    console.log("profile",profile);

   
    await profile.save();



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

  await user.save();
    const newuser= await User.findById(userId).select('+password').populate('additionalDetails');

    console.log("user",newuser);
    res.status(200).json({ success: true,  newuser});
  } catch (error) {
    console.error(error);
    next(new AppError('Server Error', 500));
  }
});



//deleate account

export const deleteAccount = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  if (!userId) {
    return next(new AppError('No user found with that ID', 404));
  }
  const user = await User.findById(userId);

  try {
   
    await Profile.findByIdAndDelete({_id:user.additionalDetails});
    await User.findByIdAndDelete(userId);

    res.status(200).json({ success: true, message: 'User account deleted' });
  } catch (error) {
    console.error(error);
    next(new AppError('Server Error', 500));
  }
});

//get enroled courses

// export const getEnrolledCourses = asyncHandler(async (req, res, next) => {
//   const userId = req.user.id;

//   try {
//    // const user = await User.findById(userId).populate('courses');
//     const user =  await User.findById(userId).populate({
// 		 	path : "courses",
// 				populate : {
// 					path: "courseContent",
// 		}
// 	 }
// 		 ).populate("courseProgress");
//     console.log("user is", user)

//     if (!user) {
//       return next(new AppError('No user found with that ID', 404));
//     }

//     res.status(200).json({ success: true, data: user });
//   } catch (error) {
//     next(new AppError('Server Error', 500));
//   }
// });

export const getEnrolledCourses = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  if (!userId) {
      return next(new AppError('User ID is required', 400));
  }

  try {
      const user = await User.findById(userId)
          .populate({
              path: "courses",
              populate: {
                  path: "courseContent",
                  populate: {
                    path: 'subSection', // populate the subSections inside each section
                  },
              },
             
          })
          .populate("courseProgress");

      if (!user) {
          return next(new AppError('No user found with that ID', 404));
      }

      console.log("user is", user);

      res.status(200).json({ success: true,  user });
  } catch (error) {
      console.error('Error fetching enrolled courses:', error.message);
      next(new AppError('Server Error', 500));
  }
});
