import Section from '../models/section.model.js';
import SubSection from '../models/subSection.model.js';
import Course from '../models/course.model.js';
import asyncHandler from '../middlewares/asyncHandler.middleware.js';
import AppError from '../utils/AppError.js';
import cloudinary from 'cloudinary';
// import fs from 'fs.promises';
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { getVideoDurationInSeconds } from "get-video-duration";




export const createSubSection = asyncHandler(async (req, res, next) => {
  const { title, description, sectionId, courseId, isFree } = req.body;

  if (!title || !description || !sectionId || !courseId) {
    return res.status(400).json({ success: false, message: "Title and description are required" });
  }

  const ifsection = await Section.findById(sectionId);
  if (!ifsection) {
    return res.status(404).json({ success: false, message: "Section not found" });
  }

  let lectureData = {};
  let pdfData = {};
  let timeDuration = 0; // Default duration in seconds

  try {
    if (req.files?.videoFile) {
      console.log("Extracting video duration...");
      const filePath = req.files.videoFile[0].path;

      try {
        timeDuration = Math.floor(await getVideoDurationInSeconds(filePath)); // Get duration in seconds
        console.log("Video Duration (seconds):", timeDuration);
      } catch (durationErr) {
        console.error("Error extracting video duration:", durationErr);
      }

      // **Upload to Cloudinary**
      console.log("Uploading video...");
      const videoResult = await cloudinary.v2.uploader.upload(filePath, {
        folder: "lms3",
        resource_type: "video",
      });

      lectureData = {
        public_id: videoResult.public_id,
        secure_url: videoResult.secure_url,
        isFree: isFree,
      };
    }

    if (req.files?.pdfFile) {
      console.log("Uploading PDF...");
      const pdfResult = await cloudinary.v2.uploader.upload(req.files.pdfFile[0].path, {
        folder: "lms3",
        resource_type: "raw",
        format: "pdf",
        use_filename: true,
        unique_filename: false,
      });

      pdfData = {
        public_id: pdfResult.public_id,
        secure_url: pdfResult.secure_url,
      };
    }

    console.log("File upload complete");

    // **Delete uploaded files from local storage**
    try {
      for (const fileKey in req.files) {
        for (const file of req.files[fileKey]) {
          if (fs.existsSync(file.path)) {
            await fs.promises.unlink(file.path);
          }
        }
      }
    } catch (err) {
      console.error("Error deleting files:", err);
    }
  } catch (e) {
    console.error("Error processing files:", e);
    return res.status(500).json({ success: false, message: e.message || "File upload failed" });
  }

  // **Create SubSection**
  const SubSectionDetails = await SubSection.create({
    title,
    description,
    lecture: lectureData,
    pdf: pdfData,
    timeDuration, // Store extracted duration
  });

  if (!SubSectionDetails) {
    return res.status(500).json({ success: false, message: "Failed to create subsection" });
  }

  console.log("Subsection created successfully", SubSectionDetails);

  // **Update the section with the new subsection**
  const updatedSection = await Section.findByIdAndUpdate(
    sectionId,
    { $push: { subSection: SubSectionDetails._id } },
    { new: true }
  ).populate("subSection");

  if (!updatedSection) {
    return res.status(404).json({ success: false, message: "Failed to update section" });
  }

  console.log("Updated section", updatedSection);

  // **Populate the course with all related content**
  const course = await Course.findById(courseId).populate({
    path: "courseContent",
    populate: { path: "subSection" },
  });

  if (!course) {
    return res.status(404).json({ success: false, message: "Course not found" });
  }

  res.status(201).json({
    success: true,
    data: course,
  });
});




 //todo get all subsections by section id
 export const getAllSubSectionsBySectionId=asyncHandler(async(req, res, next)=>{
    const {sectionId}=req.params;

    const section = await Section.findById(sectionId).populate('subSections');

    if(!section){
        return next(new AppError('Section not found',404));
    }

    res.status(200).json({
        status:'success',
        subSection:section.subSection,
    });
 });




export const updateSubSectionById = asyncHandler(async (req, res, next) => {
  console.log("Request received:", req.body.isFree);

  const { subSectionId, title, sectionId, description, courseId, isFree } = req.body;
  let lecture = {};
  let updatedFields = {}; // Collect fields to update
  let videoDuration = 0; // Store video duration

  try {
    const subSection = await SubSection.findById(subSectionId);
    if (!subSection) return next(new AppError("Subsection not found", 404));

    // Update fields only if provided
    if (title) updatedFields.title = title;
    if (description) updatedFields.description = description;
    if (isFree !== undefined) updatedFields["lecture.isFree"] = isFree;

    // Handle file upload
    if (req.file) {
      try {
        const filePath = req.file.path;

        // **Get video duration using get-video-duration**
        videoDuration = await getVideoDurationInSeconds(filePath);
        videoDuration = Math.floor(videoDuration); // Convert to seconds

        console.log("Extracted Video Duration:", videoDuration);

        // Upload to Cloudinary
        const result = await cloudinary.v2.uploader.upload(filePath, {
          folder: "lms3",
          chunk_size: 50000000,
          resource_type: "video",
        });

        if (result) {
          lecture = {
            public_id: result.public_id,
            secure_url: result.secure_url,
            isFree: isFree,
          };
        }

        await fs.rm(req.file.path);
        console.log("File deleted successfully");
      } catch (error) {
        console.error("File upload error:", error);
        return next(new AppError("File upload failed, please try again", 400));
      }
    }

    // Merge lecture updates if a file was uploaded
    if (req.file) updatedFields.lecture = lecture;

    // Update the subsection
    const updatedSubSection = await SubSection.findByIdAndUpdate(
      subSectionId,
      updatedFields,
      { new: true }
    );

    if (!updatedSubSection) return next(new AppError("Failed to update subsection", 500));

    // Update totalDuration in the course
    const course = await Course.findById(courseId).populate({
      path: "courseContent",
      populate: { path: "subSection" },
    });

    if (course) {
      let totalDuration = course.courseContent.reduce((sum, section) => {
        return sum + section.subSection.reduce((subSum, subSec) => {
          return subSum + (subSec.lecture?.duration || 0);
        }, 0);
      }, 0);

      if (videoDuration) totalDuration += videoDuration; // Add new video duration

      course.totalDuration = totalDuration;
      await course.save();
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error("Update subsection error:", error);
    return next(new AppError("Failed to update subsection", 500));
  }
});


    //delete subsection
    export const deleteSubSectionById=asyncHandler(async(req, res, next)=>{
        const {subSectionId,courseId} = req.body;
        console.log(req.body);
		const sectionId=req.body.sectionId;
   if(!subSectionId || !sectionId){
		return res.status(404).json({
            success: false,
            message: "all fields are required",
        });
	}
	const ifsubSection = await SubSection.findById({_id:subSectionId});
	const ifsection= await Section.findById({_id:sectionId});
	if(!ifsubSection){
		return res.status(404).json({
            success: false,
            message: "Sub-section not found",
        });
	}
	if(!ifsection){
		return res.status(404).json({
            success: false,
            message: "Section not found",
        });
    }
    try {
      await SubSection.findByIdAndDelete(subSectionId);
	await Section.findByIdAndUpdate({_id:sectionId},{$pull:{subSection:subSectionId}},{new:true});
	//const updatedCourse = await Course.findById(courseId).populate({ path: "courseContent", populate: { path: "subSection" } });
  const updatedCourse = await Course.findById(courseId)
        .populate({
          path: 'courseContent', // populate courseContent (sections)
          populate: {
            path: 'subSection', // populate the subSections inside each section
          },
        }); 
        console.log("updated courseContent",updatedCourse)
	
	
        res.status(200).json({
            success:true,
            message:'Subsection deleted successfully',
            data:updatedCourse

        });
      
    } catch (error) {
      return next(new AppError('Failed to delete subsection', 510));
      
    }
	
    });
