import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import Course from "../models/course.model.js";
import User from '../models/user.model.js';
import AppError from "../utils/AppError.js";
import sendMail from "../utils/sendMail.js";


////todo contact us

export const contactUs = asyncHandler(async (req, res, next) => {
    const { name, email, message } = req.body;

    if (!name ||!email ||!message) {
        return next(new AppError("All fields are required", 400));
    }

    try {

        const subject='contact us';
        const textMessage =`${name}- ${email} <br /> ${message}`;

        await sendMail(process.env.CONTACT_US_EMAIL, subject, textMessage);
        
    } catch (error) {
        next(new AppError("Failed to send message. Please try again later.", 500));
    }

    res.status(200).json({
        success: true,
        message: "Message sent successfully",
    });
});

////todo user status admin

export const userStats = asyncHandler(async (req, res, next) => {
    try {
        const allUserCount = await User.countDocuments({ role: 'STUDENT' });

        const instructorId = req.user.id; // Ensure req.user is populated
        const courseData = await Course.find({ instructor: instructorId });

        let totalRevenue = 0;
        let uniqueStudents = new Set(); // To track unique student IDs

        const courseDetails = courseData.map((course) => {
            const enrolledStudents = course?.studentEnrolled || [];
            console.log(enrolledStudents);

            enrolledStudents.forEach((studentId) => uniqueStudents.add(studentId.toString())); // Convert to string
                   console.log("-------------",uniqueStudents);
            const revenue = (course?.price || 0) * enrolledStudents.length;
            totalRevenue += revenue;

            return {
                _id: course._id,
                courseName: course.title,
                totalStudents: enrolledStudents.length,
                totalRevenue: revenue,
            };
        });

        console.log("===============================================", allUserCount, totalRevenue, uniqueStudents);

        return res.status(200).json({
            success: true,
            message: "User data fetched successfully",
            data: {
                allUserCount,
                totalRevenue,
                totalUniqueStudents: uniqueStudents.size, // Unique student count
                courses: courseDetails,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
