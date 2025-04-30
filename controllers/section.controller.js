import Section from '../models/section.model.js';
import Course from '../models/course.model.js';
import asyncHandler from '../middlewares/asyncHandler.middleware.js';
import AppError from '../utils/AppError.js';
import SubSection from '../models/subSection.model.js'



export const createSection =asyncHandler(async(req, res, next)=>{  
    console.log(req.body)
    const {title, courseId}=req.body;
    const courseid=courseId
    


    if(!title ){
        return next(new AppError('All title fields are required',400));
    }
    if(!courseId ){
        return next(new AppError('All courseid fields are required',400));
    }


    const section = await Section.create({
        title,

    });
    console.log(section)

     await Course.findByIdAndUpdate(courseid,
        {
            $push: { courseContent: section._id },
        },
        { new: true }
    ).populate(
    "courseContent"
        

    )
    .exec();

    const course= await Course.findById(courseid).populate('courseContent');
    

  
    await course.save();

    res.status(200).json({
        status:'success',
         course,
    });
  });

  //update section
  export const updateSection = asyncHandler(async(req, res, next)=>{
   
    const {title,sectionId, courseId}=req.body;
    console.log(title,sectionId,courseId);

    if(!title ||!sectionId){
        return next(new AppError('All fields are required',400));
    }
    const section = await Section.findByIdAndUpdate(sectionId,
        {title},
        {new: true}
    );
    console.log(section);
    if(!section){
        return next(new AppError('Section not found',404));
    }
    const updatedCourse = await Course.findById(courseId)
    .populate({
      path: 'courseContent', // populate courseContent (sections)
      populate: {
        path: 'subSection', // populate the subSections inside each section
      },
    });
		

    res.status(200).json({
        status:'success',
        data:updatedCourse,
    });



  });

  //delete section
  export const deleteSection = asyncHandler(async(req, res, next)=>{
    const {sectionId,courseId}=req.body;
    console.log(req.body)

    const sectionDetails = await Section.findById(sectionId);
    if(!sectionDetails){
        return next(new AppError('Section not found',404));
    }
    sectionDetails?.subSection.forEach( async (ssid)=>{
        console.log(ssid);
        await SubSection.findByIdAndDelete(ssid);
    })


    const section = await Section.findByIdAndDelete(sectionId);
    if(!section){
        return next(new AppError('Section not found',404));
    }
        const updatedCourse = await Course.findById(courseId)
        .populate({
          path: 'courseContent', // populate courseContent (sections)
          populate: {
            path: 'subSection', // populate the subSections inside each section
          },
        });;

              console.log("updated course is: ", updatedCourse);
    res.status(200).json({
        status:'success',
        data:updatedCourse ,
        message:'Section deleted successfully',
        
    });


  });


