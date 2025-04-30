import crypto from 'crypto';

import asyncHandler from '../middlewares/asyncHandler.middleware.js';
import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';
//  import {razorpayInstance} from '../server.js';
import Payment from '../models/Payment.model.js';
import Course from '../models/course.model.js';
import mongoose from 'mongoose';
import CourseProgress from '../models/courseProgress.model.js';
import SubSection from '../models/subSection.model.js';
import paypalConfig from "../configs/paypul.config.js";
import paypal from "@paypal/checkout-server-sdk";
import Stripe from 'stripe';
// import asyncHandler from '../middleware/asyncHandler.js';
// import AppError from '../utils/AppError.js';
// import Course from '../models/Course.js';
// import User from '../models/User.js';
// import CourseProgress from '../models/CourseProgress.js';

// import paypalConfig from "../config/paypalConfig.js";
// import paypal from "@paypal/checkout-server-sdk";
// import asyncHandler from "express-async-handler";
// import Course from "../models/courseModel.js";
// import CourseProgress from "../models/courseProgressModel.js";
// import User from "../models/userModel.js";
// import AppError from "../utils/AppError.js";

// const paypal = require("../../helpers/paypal");

// todo activate subscription

// import asyncHandler from 'express-async-handler';
// import AppError from '../utils/AppError.js'; // Ensure you have an AppError utility
// import Course from '../models/Course.js'; // Import the Course model
import Razorpay from 'razorpay'; // Import Razorpay

// Initialize Razorpay instance
// const razorpayInstance = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// export const buyCourse = asyncHandler(async (req, res, next) => {
//   const { courses } = req.body;
//   const userId = req.user.id;

//   // Validate if courses are provided
//   if (!courses || courses.length === 0) {
//     return next(new AppError('No course ID found', 403));
//   }

//   let totalAmount = 0;

//   // Validate courses and calculate totalAmount
//   for (const courseId of courses) {
//     try {
//       const course = await Course.findById(courseId);

//       // Check if the course exists
//       if (!course) {
//         return next(new AppError(`Course not found with ID: ${courseId}`, 404));
//       }

//       // Check if the user is already enrolled in the course
//       if (course.studentEnrolled.includes(userId)) {
//         return next(new AppError(`Student is already enrolled in course: ${courseId}`, 400));
//       }

//       // Add the course price to the total amount
//       totalAmount += parseInt(course.price, 10);
//     } catch (error) {
//       console.error(`Error fetching course with ID: ${courseId}`, error);
//       return res.status(500).json({
//         success: false,
//         message: error.message || 'Internal Server Error',
//       });
//     }
//   }

//   // const options = {
//   //   amount: totalAmount * 100, // Convert to paisa
//   //   currency,
//   //   receipt: `receipt_${Date.now()}`, // Ensure this doesn't contain emojis
//   //   notes: {
//   //     courses: JSON.stringify(courses).replace(/[^\x00-\x7F]/g, ""), // Remove emojis
//   //     userId,
//   //   },
//   // };
  

//   // Create Razorpay order
//   const currency = 'INR';
// const removeEmojis = (str) => str.replace(/[^\x00-\x7F]/g, ""); // Function to remove emojis

// const options = {
//   amount: totalAmount * 100, // Convert to paisa
//   currency,
//   receipt: `receipt_${Date.now()}`,
//   notes: {
//     courses: JSON.stringify(courses).replace(/[^\x00-\x7F]/g, ""), // Remove emojis from courses data
//     userId: removeEmojis(userId.toString()), // Ensure userId has no emojis
//   },
// };


//   try {
//     // Create the Razorpay order
//     const paymentResponse = await razorpayInstance.orders.create(options);
//     console.log('Payment Response:', paymentResponse);

//     // Return the payment response to the client
//     return res.status(200).json({
//       success: true,
//       paymentResponse,
//     });
//   } catch (error) {
//     console.error('Error creating Razorpay order:', error);

//     // Handle specific Razorpay errors
//     if (error.error && error.error.description) {
//       return res.status(400).json({
//         success: false,
//         message: `Razorpay Error: ${error.error.description}`,
//       });
//     }

//     // Handle generic errors
//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Could not initiate order',
//     });
//   }
// });


// import Stripe from 'stripe';
// import asyncHandler from '../middleware/asyncHandler.js';
// import AppError from '../utils/AppError.js';
// import Course from '../models/Course.js';
// import User from '../models/User.js';
// import CourseProgress from '../models/CourseProgress.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const buyCourse = asyncHandler(async (req, res, next) => {
  const { courses } = req.body;
  const userId = req.user.id;
  console.log("==================",courses);

  if (!courses || courses.length === 0) {
    return next(new AppError('No course ID found', 403));
  }

  let totalAmount = 0;
  let lineItems = [];
  console.log("60%");
  for (const courseId of courses) {
    console.log(courseId);}

    console.log("60%");

  for (const courseId of courses) {
    try {
      console.log("10%");

      const course = await Course.findById(courseId);
      console.log("20%");

      if (!course) {
        return next(new AppError(`Course not found with ID: ${courseId}`, 404));
      }
      console.log("30%");


      if (course.studentEnrolled.includes(userId)) {
        return next(new AppError(`Already enrolled in course: ${courseId}`, 400));
      }
      console.log("40%");

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: course.title,
          },
          unit_amount: Math.round(course.price * 100),
        },
        quantity: 1,
      });
      console.log("60%");

      totalAmount += parseFloat(course.price);
    } catch (error) {
      console.error(`Error fetching course with ID: ${courseId}`, error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `http://localhost:5173/payment-return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/payment-cancel`,
      metadata: { userId, courses: JSON.stringify(courses) },
    });

    res.status(201).json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    res.status(500).json({ success: false, message: 'Error while creating a Stripe payment !' });
  }
});

const processedSessions = new Set();

export const verifypayment = asyncHandler(async (req, res, next) => {
    const { session_id } = req.body;
    const userId = req.user.id;

    console.log("Received Session ID:", session_id);

    if (!session_id) {
        return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    // Check if the session has already been processed
    if (processedSessions.has(session_id)) {
        return res.status(400).json({ success: false, message: 'Duplicate request: Payment already verified' });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status !== 'paid') {
            return res.status(400).json({ success: false, message: 'Payment verification failed' });
        }

        // console.log("Stripe Session Retrieved:", session);


        const courses = JSON.parse(session.metadata.courses);
        console.log("Stripe Session Retrieved:", courses);

        // Mark session as processed before making DB changes
        processedSessions.add(session_id);

        for (const courseId of courses) {

          const existingEnrollment = await Course.findOne({ _id: courseId, studentEnrolled: userId });
          if (existingEnrollment) {
            return res.status(400).json({ success: false, message: 'Course already enrolled'
              });
            }

            const updatedCourse = await Course.findByIdAndUpdate(courseId, { $push: { studentEnrolled: userId } }, { new: true });

            if (!updatedCourse) {
                return next(new AppError('No course found with this ID', 403));
            }
            const existingProgress = await CourseProgress.findOne({ courseID: courseId, userId });
             if (existingProgress) {
              return res.status(400).json({ success: false, message: 'Course progress already exists' });
             }

            const courseProgress = await CourseProgress.create({ courseID: courseId, userId, completedVideos: [] });
            await User.findByIdAndUpdate(userId, { $push: { courses: courseId, courseProgress: courseProgress._id } }, { new: true });
        }

        const updatedUser = await User.findById(userId);
        return res.status(200).json({ success: true, message: 'Payment verified and enrollment completed', updatedUser });

    } catch (error) {
        console.error('Error verifying Stripe payment:', error);
        return res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
});


//todo cancel subscription

export const cancelSubscription=asyncHandler(async(req,res,next)=>{
    const {id} =req.user;
    //const {razorpay_subscription_id}=req.body;

    

    const user=await User.findById(id);

    if(!user){
        return next(new AppError('User not found',404));
    }

    if(user.role =='ADMIN'){
        return next(new AppError('Admins cannot cancel subscription',403));
    }

    const subscriptionId=user.subscription.id;

    try{
        const subscription=await razorpay.subscription.cancle(
            subscriptionId
        );

        user.subscription.status=subscription.status;

        await user.save();

    }catch(error){
        return next(new AppError(`Failed to cancel subscription${error.error.description}`,500));
    }

    const payment =await Payment.findOne({
        razorpay_subscription_id:subscriptionId
    });

    const timeSinceSubscription=Date.now() - payment.createdAt;

    const refundPeriod=14*24*60*60*1000;

    if(timeSinceSubscription >= refundPeriod){
        return next(new AppError(  'Refund period is over, so there will not be any refunds provided.',400));
    }

    await razorpay.payments.refund(payment.razorpay_payment_id,{
        speed: 'optimum',
    });

    user.subscription.id=null;
    user.subscription.status='cancelled';

    await user.save();
    await payment.remove();

    res.status(200).json({
        success:true,
        message:'Subscription cancelled successfully',
        user,
    });
        
})

//todo get razorpay id api key

export const getRazorpayApikey = asyncHandler(async (_req, res, _next) => {
    res.status(200).json({
      success: true,
      message: 'Razorpay API key',
      key: process.env.RAZORPAY_KEY_ID,
    });
  });

//todo get all payments


// export const allPayments = asyncHandler(async (req, res, _next) => {
//     const { count, skip } = req.query;
//     console.log(req.query)
//     // console.log("i am hare-----------",razorpayInstance.payments.fetch())

//     //  console.log("i am hare-----------",razorpayInstance.getPaymentCount(count))
//     // Find all subscriptions from razorpay
//     const allPayments = await razorpayInstance.payments.all({
//       count: count ? count : 10, // If count is sent then use that else default to 10
//       skip: skip ? skip : 0, // If skip is sent then use that else default to 0
//     });
//      console.log(allPayments)
//     const monthNames = [
//       'January',
//       'February',
//       'March',
//       'April',
//       'May',
//       'June',
//       'July',
//       'August',
//       'September',
//       'October',
//       'November',
//       'December',
//     ];
  
//     const finalMonths = {
//       January: 0,
//       February: 0,
//       March: 0,
//       April: 0,
//       May: 0,
//       June: 0,
//       July: 0,
//       August: 0,
//       September: 0,
//       October: 0,
//       November: 0,
//       December: 0,
//     };
  
//     const monthlyWisePayments = allPayments.items.map((payment) => {
//       // We are using payment.start_at which is in unix time, so we are converting it to Human readable format using Date()
//       const monthsInNumbers = new Date(payment.start_at * 1000);
  
//       return monthNames[monthsInNumbers.getMonth()];
//     });
  
//     monthlyWisePayments.map((month) => {
//       Object.keys(finalMonths).forEach((objMonth) => {
//         if (month === objMonth) {
//           finalMonths[month] += 1;
//         }
//       });
//     });
  
//     const monthlySalesRecord = [];
  
//     Object.keys(finalMonths).forEach((monthName) => {
//       monthlySalesRecord.push(finalMonths[monthName]);
//     });
  
//     res.status(200).json({
//       success: true,
//       message: 'All payments',
//       allPayments,
//       finalMonths,
//       monthlySalesRecord,
//     });
//   });
// export const allPayments = asyncHandler(async (req, res) => {
//   const { count, skip } = req.query;

//   // Default count and skip values
//   const limit = count && !isNaN(count) ? parseInt(count, 10) : 10;
//   const offset = skip && !isNaN(skip) ? parseInt(skip, 10) : 0;

//   try {
//     // Fetch payments from Razorpay
//     const allPayments = await razorpayInstance.payments.all({
//       count: limit,
//       skip: offset,
//     });
//     //console.log(allPayments.items)

//     const monthNames = [
//       'January',
//       'February',
//       'March',
//       'April',
//       'May',
//       'June',
//       'July',
//       'August',
//       'September',
//       'October',
//       'November',
//       'December',
//     ];

//     // Initialize monthly sales record
//     const finalMonths = monthNames.reduce((acc, month) => {
//       acc[month] = 0;
//       return acc;
//     }, {});

//     // Process payments to calculate monthly sales
//     allPayments.items.forEach((payment) => {
//       const createdAt = payment.created_at; // Unix timestamp
//       if (createdAt) {
//         const paymentDate = new Date(createdAt * 1000);
//         console.log(paymentDate)
//         const monthName = monthNames[paymentDate.getMonth()];
//         finalMonths[monthName] += 1;
//       }
//     });

//     const monthlySalesRecord = Object.values(finalMonths);

//     res.status(200).json({
//       success: true,
//       message: 'All payments',
//       allPayments,
//       finalMonths,
//       monthlySalesRecord,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch payments',
//       error: error.message,
//     });
//   }
// });


export const allPayments = asyncHandler(async (req, res) => {
  const { count, skip } = req.query;

  // Default count and skip values
  const limit = count && !isNaN(count) ? parseInt(count, 10) : 10;
  const offset = skip && !isNaN(skip) ? parseInt(skip, 10) : 0;

  try {

    const courseDetails = await Course.find({ instructor: req.user.id })

    const courseData = courseDetails.map((course) => {
      const totalStudentsEnrolled = course.studentEnrolled.length
      const totalAmountGenerated = totalStudentsEnrolled * course.price

      // Create a new object with the additional fields
      const courseDataWithStats = {
        _id: course._id,
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        // Include other course properties as needed
        totalStudentsEnrolled,
        totalAmountGenerated,
      }

      return courseDataWithStats
    })
    // Define the start date (8th January 2025) in Unix timestamp
    const startDate = new Date('2025-01-08').getTime() / 1000;

    // Fetch payments from Razorpay
    const allPayments = await razorpayInstance.payments.all({
      // count: limit,
      // skip: offset,
      from: startDate, // Filter payments from 8th January 2025
    });

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    // Initialize monthly sales record
    const finalMonths = monthNames.reduce((acc, month) => {
      acc[month] = 0;
      return acc;
    }, {});

    console.log(allPayments)
    const totalPayments=

    // Process payments to calculate monthly sales
    allPayments.items.forEach((payment) => {
      const createdAt = payment.created_at; // Unix timestamp
      if (createdAt) {
        const paymentDate = new Date(createdAt * 1000);
        const monthName = monthNames[paymentDate.getMonth()];
        finalMonths[monthName] += 1;
      }
    });

    const monthlySalesRecord = Object.values(finalMonths);

    res.status(200).json({
      success: true,
      message: 'All payments from 8th January 2025',
      allPayments,
      finalMonths,
      monthlySalesRecord,
      courseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message,
    });
  }
});
