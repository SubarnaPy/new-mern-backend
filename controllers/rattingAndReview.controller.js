import RatingAndReview from "../models/ratingAndReview.model.js"
import Course from "../models/course.model.js"
import mongoose from "mongoose";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import AppError from "../utils/AppError.js";

// Add a new rating and review

export const addRatingAndReview = asyncHandler(async (req, res, next) => {
    const { courseId, rating, review } = req.body;
    const userId = req.user.id;

    if (!courseId || !rating || !review) {
        return next(new AppError("All fields are required", 400));
    }

    const course = await Course.findOne(
        { _id:courseId,
            studentEnrolled:{$elemMatch:{$eq:userId}}
        },

    ); 
    if (!course) {
        return next(new AppError("student not found in this course", 404));
    }

    const existingRating = await RatingAndReview.findOne({
        course: courseId,
        user: req.user.id,
    });

    if (existingRating) {
        return next(new AppError("You have already reviewed this course", 400));
    }

    const newRatingAndReview = await RatingAndReview.create({
        course: courseId,
        user: req.user.id,
        rating,
        review,
    });

    const pushRating=await Course.findByIdAndUpdate(courseId, {
        $push: { ratingAndReviews: newRatingAndReview._id },
    });
    // const updateCourseById = await Course.findByIdAndUpdate(courseId,{
    //     $push:{ ratingsAndReviews: newRatingAndReview._id}
    // })
    console.log('pushRating------------------------------',pushRating)
    if(!pushRating){
        return next(new AppError("not found", 400));

    }
    res.status(201).json({
        status: "success",
        data: newRatingAndReview,
    });
    next();
});

// Get all ratings and reviews for a course

export const getRatingAndReviewsByCourseId = asyncHandler(async (req, res, next) => {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
        return next(new AppError("Course not found", 404));
    }

    res.status(200).json({
        status: "success",
        data: course.ratingAndReviews,
    });
});

//get average rating

export const getAverageRatingByCourseId = asyncHandler(async (req, res, next) => {
    const { courseId } = req.body;


    const result =await RatingAndReview.aggregate([
       {
        $match: { course: new mongoose.Types.ObjectId(courseId) },
       },
       {
        $group: { _id: null, averageRating: { $avg: "$rating" } }
       }
    ]);

   
    if (result.length>0){
        return res.status(200).json({
            status: "success",
            averageRating: result[0].averageRating,
        });
      
    }

    return res.status(200).json({
        status: "success",
        message:"no ratting",
        averageRating: 0,
    });





    // const course = await Course.findById(courseId);

    // if (!course) {
    //     return next(new AppError("Course not found", 404));
    // }

    // const totalRatings = course.ratingAndReviews.length;
    // const totalSumOfRatings = course.ratingAndReviews.reduce((acc, review) => acc + review.rating, 0);

    // res.status(200).json({
    //     status: "success",
    //     data: totalSumOfRatings / totalRatings,
    // });
});

//get all ratings

export const getAllRatings = asyncHandler(async (req, res, next) => {
    const ratings = await RatingAndReview.find({}).sort({rating:"desc"}).populate({
        path:"user",
        select:"fullName email avatar"
    }).populate({
        path:"course",
        select:"title"
    }).exec();

    res.status(200).json({
        status: "success",
        data: ratings,
    });
});

    