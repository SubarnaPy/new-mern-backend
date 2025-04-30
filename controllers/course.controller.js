import fs from 'fs.promises';
import path from 'path';
import cloudinary from 'cloudinary';
import asyncHandler from '../middlewares/asyncHandler.middleware.js';
import AppError from '../utils/AppError.js';

import Course from '../models/course.model.js';
import User from '../models/user.model.js';
import Section from '../models/section.model.js';
import SubSection from '../models/subSection.model.js';
import CourseProgress from '../models/courseProgress.model.js';



//todo all courses

export const searchCourses = async (req, res, next) => {
    try {
      const { searchQuery } = req.query;
      console.log('Received searchQuery:', searchQuery); // Log the search query value
  
      if (!searchQuery || typeof searchQuery !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid search query' });
      }
  
      // Perform search by title, description, and category
      const courses = await Course.find({
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search on title
         // { description: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search on description
          { category: { $regex: searchQuery, $options: 'i' } } // Case-insensitive search on category
        ]
      }).exec();
  
      console.log('Courses found:', courses); // Log found courses
  
      res.status(200).json({ success: true, courses });
    } catch (error) {
      console.error('Error during searchCourses:', error);
      next(error); // Pass errors to the error handling middleware
    }
  };
  
  
  export const getTopCourses = async (req, res, next) => {
    try {
        // Fetch top 5 courses based on enrollments or ratings (modify as needed)
        const topCourses = await Course.find()
            .sort({ enrolledStudents: -1 }) // Sort by highest enrollments (descending)
            .limit(5) // Get only 5 courses
            .exec();

        res.status(200).json({
            success: true,
            courses: topCourses
        });

    } catch (error) {
        console.error("Error fetching top courses:", error);
        next(error); // Pass the error to middleware
    }
};


// export const getAllCourses = asyncHandler(async(req, res, next)=>{
//     const courses= await Course.find({status:Published},{
//         // title: true,
//         // price: true,
//         // thumbnail: true,
//         // instructor: true,
//         // ratingAndReviews: true,
//         // studentsEnrolied: true,
//     }).populate("instructor").exec();

//     if(!courses){
//         throw new AppError('No courses found', 404);
//     }
//     console.log(courses)

//     res.status(200).json({
//         status:'success',
//         results:courses.length,
//         courses,
//     });
// });

//todo create courses

export const getAllCourses = asyncHandler(async (req, res, next) => {
    const Published = "Published"; // or replace with your constant or variable

    const courses = await Course.find({  }, {
        // title: true,
        // price: true,
        // thumbnail: true,
        // instructor: true,
        // ratingAndReviews: true,
        // studentsEnrolled: true,
    }).populate("instructor")
    .populate("category")
    .populate({path:'ratingAndReviews'})
    .exec();;
    console.log(courses)

    if (courses.length === 0) {
        throw new AppError('No courses found', 404);
    }
    
    console.log(courses);

    res.status(200).json({
        status: 'success',
        results: courses.length,
        courses,
    });
});

export const createCourse = asyncHandler(async (req, res, next) => {  
//    console.log(req)
    console.log("createCourse------------------------------------------------------",req.body)
    const { title, description,tags,instructions,whatYouWillLearn, category, price } = req.body;
    // console.log("created course is :",req.body);
    // console.log(req)

    // Check for required fields
    if (!price) {
        return next(new AppError('All price fields are required', 400));
    }
   
    if (!category ) {
        return next(new AppError('All category fields are required', 400));
    }
    if ( !description ) {
        return next(new AppError('All desc fields are required', 400));
    }
    if (!title ) {
        return next(new AppError('All title fields are required', 400));
    }
    if (!whatYouWillLearn ) {
        return next(new AppError('All whatYouWillLearn fields are required', 400));
    }

    const userID = req.user.id;
    const instructorDetails = await User.findById(userID);
    
    if (!instructorDetails) {
        return next(new AppError('Instructor not found', 403));
    }

    // Create the course
    const course = await Course.create({
        title,
        description,
        category,
        tags,
        price,
        instructions,
        whatYouWillLearn,
        instructor: instructorDetails._id,
        avatar: {
            public_id:'https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg',
            
            secure_url:
              'https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg',
          },
    });
    if(course){
        console.log("course is created")
    }

    if (!course) {
        return next(new AppError('Failed to create course', 500));
    }

    // Handle thumbnail upload if a file is provided
    if (req.file) {
        console.log("uplooading to cloudinary")
        try {
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms3',
                    width: 250,
                    height: 250,
                    timeout: 520000, // 120 seconds
                });
                console.log("File uploaded successfully to Cloudinary:", result);

                  // Assign uploaded image URL to the course
            if (result) {
                course.thumbnail.public_id = result.public_id;
                course.thumbnail.secure_url = result.secure_url;
            }
            if(!result){
                console.log("Error uploading file to cloudinary")
                return next(new AppError('Failed to upload file to cloudinary', 500));
            }
            } catch (error) {
                console.error("Error uploading to Cloudinary:", error);
                return next(new AppError('Cloudinary upload failed', 500));
            }
            console.log("File uploaded successfully-50")

            // console.log("file uploaded successfully",result)

          
            console.log("File uploaded successfully-60")
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
    console.log("File uploaded successfully-70")

    // Add the newly created course to the instructor's course list
   const instructor= await User.findByIdAndUpdate(
        { _id: instructorDetails._id },
        { $push: { courses: course._id } },
        { new: true }
    );
    if(instructor){
        console.log("instructor is updated")
    }
    if(!instructor){
        return next(new AppError('Instructor not found', 403));
    }
    console.log("File uploaded successfully-80")

    await course.save();

    res.status(200).json({
        status: 'success',
        data:course,
    });
});


  //get coursedetails
  export const getCourseDetailsById = asyncHandler(async(req, res, next)=>{
    const { courseId}=req.body;
    // const course = await Course.find(
    //     {_id: courseId})
    //     .populate(
    //         {
    //             path: 'instructor',
    //             populate:{
    //                 path:"additionalDetails",
    //             }
    //         }
    //     )
    //     .populate({
    //         path: 'ratingAndReviews',
    //         populate: {
    //           path: 'user', // Populate the user details in ratingAndReviews
              
    //         },
    //       })
    //     .populate(
    //         {
    //             path: 'courseContent',
    //             populate: {
    //                 path: 'subSection',
                    
    //             }
    //         }
    //     ).exec();
        

    const course = await Course.find({ _id: courseId })
    .populate({
      path: 'instructor',
      populate: {
        path: "additionalDetails",
      }
    })
    .populate({
      path: 'ratingAndReviews',
      populate: {
        path: 'user', // Populate the user details in ratingAndReviews
      },
    })
    .populate({
      path: 'courseContent',
      populate: [
        { path: 'subSection' },      // Populate subSection
        { path: 'assignments' },     // Populate assignments
        { path: 'quizzes' }          // Populate quizzes
      ]
    })
    .exec();
  
    
    console.log(course);
    
    if(!course){
        return next(new AppError('Course not found',404));
    }
    res.status(200).json({
        status:'success',
        course
    });
});

//  ////////////todo get lectures by course id

//  export const getLecturesByCourseId = asyncHandler(async(req, res, next)=>{
//     const {id}=req.params;


//     const course = await Course.findById(id).populate('lectures');

//     console.log(course);
    
//     if(!course){
//         return next(new AppError('Course not found',405));
//     }
//     console.log(course.lectures);

//     res.status(200).json({
//         status:'success',
//         lectures:course.lectures,
//         course
//     });
//  });

//  ////////////todo add lecture
//  export const addLectureToCourseById= asyncHandler(async(req, res, next)=>{
//     const {id}=req.params;
//     const {title, description}=req.body;

//     let lectureData={};

//     if(!title ||!description){
//         return next(new AppError('Title and description are required',400));
//     }

//     const course =await Course.findById(id);

//     if(!course){
//         return next(new AppError('Course not found',404));
//     }

//     if(req.file){
//         try{
//             const result = await cloudinary.v2.uploader.upload(req.file.path, {
//                     folder: 'lms3',
//                     chunk_size:50000000,
//                     resource_type:'video',

//                 });

//                 if(result){
//                     lectureData.public_id=result.public_id;
//                     lectureData.secure_url=result.secure_url;
//                 }

//                 const success=fs.rm(req.file.path);

//                 if(success){
//                     console.log('File deleted successfully');
//                 }

//         }catch(e){
//             for (const file of await fs.readdir('uploads/')) {
//                 await fs.unlink(path.join('uploads/', file));
//               }

//               return next(
//                 new AppError(
//                   JSON.stringify(error) || 'File not uploaded, please try again',
//                   400
//                 )
//               );
//         }
//     }


//     course.lectures.push({
//         title,
//         description,
//        lecture:lectureData,
//     });

//     course.numberOfLectures = course.lectures.length;

//     await course.save();

//     res.status(201).json({
//         status:'success',
//         course
//     });
//  });


//  ////////////////////////todo/remove lecture

//  export  const removeLectureFromCourse = asyncHandler(async(req, res, next)=>{
//     const {courseId, lectureId}=req.query;

//     console.log(courseId);

//     if(!courseId){
//         return next(new AppError('Course id is required',400));
//     }

//     if(!lectureId){
//         return next(new AppError('Lecture id is required',400));
//     }

//     const course =await Course.findById(courseId);
    
//     if(!course){
//         return next(new AppError('Course not found',404));
//     }

//     const lectureIndex =  course.lectures.findIndex(
//         (lecture)=> lecture._id.toString()===lectureId.toString()
//     );

//     if(lectureIndex === -1){
//         return next(new AppError('Lecture not found in this course',404));
//     }

//     await cloudinary.v2.uploader.destroy(
//         course.lectures[lectureIndex].lecture.public_id,
//         {
//             resource_type:'video',
//         }
//     );

//     course.lectures.splice(lectureIndex, 1);

//     course.numberOfLectures = course.lectures.length;

//     await course.save();

//     res.status(200).json({
//         status:'success',
//         course
//     });
//  });


//  //////////////todo get course by instructor id

export const getCourseByInstructorId = asyncHandler(async(req, res, next)=>{
    const instructorId = req.user.id
    
  
      // Find all courses belonging to the instructor
      const instructorCourses = await Course.find({instructor: instructorId}).populate({
        path: "courseContent",
        populate: {
          path: 'subSection', // populate the subSections inside each section
        },
    });
      if (!instructorCourses) {
        return next(new AppError('No courses found for this instructor', 405));
        
      }
     console.log('hi')
  
      // Return the instructor's courses
      res.status(200).json({
        success: true,
        courses:instructorCourses,
      })

})



 ////todo update course by id

 export const updateCourseById = asyncHandler(async(req, res, next)=>{
    console.log("my req.body is",req.body);
    const {courseId}=req.body;
    const course = await Course.findById(courseId);

    if(!course){
        return next(new AppError('Course not found',404));
    }
    if(req.body.title){
        course.title = req.body.title;
    }
    if(req.body.description){
        course.description = req.body.description;
    }
    if(req.body.price){
        course.price = req.body.price;
    }
    if(req.body.category){
        course.category = req.body.category;
    }
    if(req.body.whatYouWillLearn){
        course.whatYouWillLearn = req.body.whatYouWillLearn;
    }
    if(req.body.tags){
        course.tags= req.body.tags;
    }
    if(req.body.status){
        course.status = req.body.status;
    }
    if(req.body.instructions){
        course.instructions = req.body.instructions;
    }
    if(req.file){
        try{
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms3',
                    width:250,
                    height:250,
                });

                if(result){
                    course.thumbnail.public_id=result.public_id;
                    course.thumbnail.secure_url=result.secure_url;
                }

                //fs.rm(`uploads/${req.file.filename}`);
                const success=fs.rm(req.file.path);

        }catch(e) {
            // Empty the uploads directory without deleting the uploads directory
    //         for (const file of await fs.readdir('uploads/')) {
    //               await fs.unlink(path.join('uploads/', file));
    //         }
       

    //    return next(
    //     new AppError(
    //       JSON.stringify(error) || 'File not uploaded, please try again',
    //       400
    //     )
    //   );

    try {
        const files = await fs.readdir('uploads/');
        for (const file of files) {
            await fs.unlink(path.join('uploads', file));
        }
    } catch (e) {
        return next(new AppError('Error cleaning up files', 500));
    }

    return next(new AppError('File not uploaded, please try again', 400));

    }

    //add the new course to instructor schema
    const instructor = await User.findByIdAndUpdate(
        {_id:instructorDetails._id},
         { 
            $push: { 
                courses: course._id 
            } 
        }, 
        { new: true }
    );
    }
    
  await course.save() 


  const updatedCourse = await Course.findById(courseId)
  .populate({
    path: 'courseContent', // populate courseContent (sections)
    populate: {
      path: 'subSection', // populate the subSections inside each section
    },
  });

    res.status(200).json({
        status:'success',
        data:updatedCourse
    });
 });


 ////todo deleate course by id

 export const deleteCourseById = asyncHandler(async(req, res, next)=>{
    try {
        const { courseId } = req.body
        // Find the course
        const course = await Course.findById(courseId)
        if (!course) {
          return res.status(404).json({ message: "Course not found" })
        }
    
        // Unenroll students from the course
        const studentsEnrolled = course.studentEnrolled
        for (const studentId of studentsEnrolled) {
          await User.findByIdAndUpdate(studentId, {
            $pull: { courses: courseId },
          })
        }
    
        // Delete sections and sub-sections
        const courseSections = course.courseContent
        for (const sectionId of courseSections) {
          // Delete sub-sections of the section
          const section = await Section.findById(sectionId)
          if (section) {
            const subSections = section.subSection
            for (const subSectionId of subSections) {
              await SubSection.findByIdAndDelete(subSectionId);
            }
          }
    
          // Delete the section
          await Section.findByIdAndDelete(sectionId)
        }
    
        // Delete the course
        await Course.findByIdAndDelete(courseId)
  
        //Delete course id from Category
       
      
      //Delete course id from Instructor
      await User.findByIdAndUpdate(course.instructor._id, {
          $pull: { courses: courseId },
           })
    
        return res.status(200).json({
          success: true,
          message: "Course deleted successfully",
        })
      } catch (error) {
        console.error(error)
        return res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        })
    }
 });




 // course entire details by corseid
 export const getCourseEntireDetailsById = asyncHandler(async(req, res, next)=>{
    const {courseId}=req.body;
    console.log('courseId is: ',req.body);
    // const userID= req.user.id
    // console.log('userID is: ',userID);
    // console.log('body is: ',req.body);

    try{

        const updatedCourse = await Course.findById(courseId)
        .populate({
          path: 'courseContent', // populate courseContent (sections)
          populate: [
            { path: "subSection" },       // Populate subSection
            { path: "assignments" },      // Populate assignments
            { path: "quizzes" }           // Populate quizzes
          ]
          
        })
        .populate({path:'instructor'})
        .populate({path:'category'}) 
        .populate({
            path: 'ratingAndReviews',
            populate: {
              path: 'user', // Populate the user details in ratingAndReviews
              
            },
          })// populate instructor details
        ;

        console.log("================================",updatedCourse)

    
    
    if(!updatedCourse){
        return next(new AppError('Course not found',404));
    }

    // let courseProgressCount = await CourseProgress.findOne({
    //     courseID: courseId,
    //     userId: userID,
    //   })
  
    //   console.log("courseProgressCount : ", courseProgressCount)
  
    res.status(200).json({
        status:'success',
        data:{updatedCourse,
            
        }
    });
 

} catch(error){
    console.error(error);
    res.status(500).json({
        status:'error',
        message: 'Server error'
    });
}
 });







