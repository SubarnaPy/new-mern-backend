import Assignment from "../models/assignment.model.js";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import cloudinary from "cloudinary";
import AppError from "../utils/AppError.js";
import fs from 'fs.promises';
import Section from "../models/section.model.js";
import Course from "../models/course.model.js";

// ✅ Create Assignment
export const createAssignment = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  const { title, description, dueDate, courseId, sectionId, totalMarks } = req.body;

  // Create the assignment first
  const assignment = await Assignment.create({
      title,
      description,
      dueDate,
      courseId,
      section: sectionId,
      totalMarks,
      uploadedFiles: [],  // Initialize the array properly
  });

  // ✅ Handle single file upload with Multer
  if (req.file) {
      console.log("Uploading to Cloudinary...");
      try {
          const result = await cloudinary.v2.uploader.upload(req.file.path, {
              folder: 'lms3',
              width: 250,
              height: 250,
              timeout: 520000, // 120 seconds
          });

          console.log("File uploaded successfully to Cloudinary:", result);

          if (result) {
              // ✅ Push the result into the uploadedFiles array
              assignment.uploadedFiles.push({
                  public_id: result.public_id,
                  secure_url: result.secure_url,
              });

              // Save the assignment with the uploaded files
              await assignment.save();
          } else {
              console.log("Error uploading file to Cloudinary");
              return next(new AppError('Failed to upload file to Cloudinary', 500));
          }

          // Clean up uploaded file from local uploads directory
          await fs.rm(req.file.path);
      } catch (error) {
          console.error("Error uploading to Cloudinary:", error);
          return next(new AppError('Cloudinary upload failed', 500));
      }
  }

  // ✅ Update the section with the new assignment ID
  const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      { $push: { assignments: assignment._id } },
      { new: true }
  ).populate("subSection");

  if (!updatedSection) {
      return res.status(404).json({ success: false, message: "Failed to update section" });
  }

  console.log(assignment);

  // ✅ Populate the course details
  const course = await Course.findById(courseId)
      .populate({
          path: "courseContent",
          populate: [
              { path: "subSection" },
              { path: "assignments" },
              { path: "quizzes" }
          ]
      });

  console.log(course);

  res.status(201).json({
      success: true,
      data: course,
  });
});



// ✅ Get Assignment by Section (IDs in body)
export const getAssignment  = asyncHandler(async (req, res) => {
  console.log("76543456789===============================================================")
  
    const {courseId, sectionId, assignmentId } = req.body;
  
    try {
      const assignment = await Assignment.findOne({
        _id: assignmentId,
       
        section:sectionId,
      });
  
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
  
      res.status(200).json(assignment);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });

// ✅ Submit Assignment (IDs in body)
// export const submitAssignment = asyncHandler(async (req, res) => {
//   const { assignmentId, studentId } = req.body;

//   if (!assignmentId || !studentId) {
//     throw new AppError("Assignment ID and Student ID are required", 400);
//   }

//   let submittedFiles = [];

//   if (req.files?.submittedFiles) {
//     for (const file of req.files.submittedFiles) {
//       const result = await cloudinary.v2.uploader.upload(file.path, {
//         folder: "submissions",
//       });

//       submittedFiles.push({
//         public_id: result.public_id,
//         secure_url: result.secure_url,
//       });
//       console.log("--------------------------------------",submittedFiles)
//       await assignment.save();

//     }
//   }

//   const assignment = await Assignment.findById(assignmentId);

//   if (!assignment) {
//     throw new AppError("Assignment not found", 404);
//   }

//   assignment.submissions.push({
//     studentId,
//     submittedFiles,
//   });

//   await assignment.save();

//   res.status(201).json({
//     success: true,
//     message: "Assignment submitted successfully",
//   });
// });

// ✅ Grade Assignment (IDs in body)
// export const gradeAssignment = asyncHandler(async (req, res) => {
//   const { submissionId, marksObtained, feedback } = req.body;

//   if (!submissionId) {
//     throw new AppError("Submission ID is required", 400);
//   }

//   const assignment = await Assignment.findOne({
//     "submissions._id": submissionId,
//   });

//   if (!assignment) {
//     throw new AppError("Submission not found", 404);
//   }

//   const submission = assignment.submissions.id(submissionId);

//   submission.marksObtained = marksObtained;
//   submission.feedback = feedback;

//   await assignment.save();

//   res.status(200).json({
//     success: true,
//     message: "Assignment graded successfully",
//   });
// });


// ✅ Delete Assignment
export const deleteAssignment = asyncHandler(async (req, res, next) => {
  console.log(req.body)
  const { assignmentId, sectionId,courseId } = req.body;

  if (!assignmentId || !sectionId) {
    throw new AppError("Assignment ID and Section ID are required", 400);
  }

  // Find the assignment by ID
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  // Delete associated files from Cloudinary
  if (assignment.uploadedFiles && assignment.uploadedFiles.public_id) {
    try {
      await cloudinary.v2.uploader.destroy(assignment.uploadedFiles.public_id);
      console.log("Cloudinary files deleted successfully");
    } catch (error) {
      console.error("Error deleting files from Cloudinary:", error);
      return next(new AppError("Failed to delete files from Cloudinary", 500));
    }
  }

  // Remove the assignment from the section
  const updatedSection = await Section.findByIdAndUpdate(
    sectionId,
    { $pull: { assignments: assignmentId } },
    { new: true }
  );

  if (!updatedSection) {
    return res.status(404).json({
      success: false,
      message: "Failed to update section after assignment deletion",
    });
  }

  // Delete the assignment from the database
  await Assignment.findByIdAndDelete(assignmentId);
  const course = await Course.findById(courseId)
  .populate({
    path: "courseContent",
    populate: [
      { path: "subSection" },       // Populate subSection
      { path: "assignments" },      // Populate assignments
      { path: "quizzes" }           // Populate quizzes
    ]
  });


  res.status(200).json({
    success: true,
    message: "Assignment deleted successfully",
    data:course
  });
});




// import Assignment from "../models/Assignment.js";
// import Section from "../models/Section.js";
// import cloudinary from "../config/cloudinary.js";
// import AppError from "../utils/AppError.js";

// Update Assignment
export const updateAssignment = asyncHandler(async (req, res, next) => {
  console.log("Updating assignment",req.body);
  console.log("Assignment",req.file)
  const {  sectionId, title, description,courseId,dueDate } = req.body;
  const uploadedFile = req.file;  // For Cloudinary file upload

  if ( !sectionId) {
    throw new AppError("Assignment ID and Section ID are required", 400);
  }

  // Find the assignment by ID
  console.log("Finding assignment",req.body.id);
  const assignment = await Assignment.findById(req.body.id);
  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  // Update basic fields
  assignment.title = title || assignment.title;
  assignment.description = description || assignment.description;
  assignment.dueDate = dueDate || assignment.dueDate;

  // Handle file upload replacement
  if (uploadedFile) {
    // Delete old file from Cloudinary
    if (assignment.uploadedFiles && assignment.uploadedFiles.public_id) {
      await cloudinary.v2.uploader.destroy(assignment.uploadedFiles.public_id);
    }

    // Upload new file
    const result = await cloudinary.v2.uploader.upload(uploadedFile.path, {
      folder: "assignments",
    });

    assignment.uploadedFiles = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }

  await assignment.save();
  const course = await Course.findById(courseId)
  .populate({
    path: "courseContent",
    populate: [
      { path: "subSection" },       // Populate subSection
      { path: "assignments" },      // Populate assignments
      { path: "quizzes" }           // Populate quizzes
    ]
  });

  res.status(200).json({
    success: true,
    message: "Assignment updated successfully",
    data:course,
  });
});




export const submitAssignment = async (req, res, next) => {
  try {
    console.log(req.body);

    const { studentId, courseId, sectionId, assignmentId } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found" });
    }

    // ✅ Check if the student has already submitted this assignment
    const alreadySubmitted = assignment.submissions.some(
      (submission) => submission.studentId.toString() === studentId
    );

    if (alreadySubmitted) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted this assignment",
      });
    }

    const submittedFiles = [];

    // ✅ Upload the file to Cloudinary
    if (req.file) {
      console.log("Uploading to Cloudinary...");
      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "lms3",
          width: 250,
          height: 250,
          timeout: 520000, // 120 seconds
        });

        console.log("File uploaded successfully to Cloudinary:", result);

        if (result) {
          // ✅ Add uploaded file to the `submittedFiles` array inside the submission
          submittedFiles.push({
            public_id: result.public_id,
            secure_url: result.secure_url,
          });

          // Clean up uploaded file from local uploads directory
          await fs.rm(req.file.path);
        } else {
          console.log("Error uploading file to Cloudinary");
          return next(new AppError("Failed to upload file to Cloudinary", 500));
        }
      } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        return next(new AppError("Cloudinary upload failed", 500));
      }
    }

    // ✅ Add the submission with the uploaded files
    assignment.submissions.push({
      studentId,
      submittedFiles, // Save uploaded files in submissions
    });

    // ✅ Update the assignment status
    const now = new Date();
    if (now > assignment.dueDate) {
      assignment.assignmentStatus = "overdue";
    } else {
      assignment.assignmentStatus = "completed";
    }

    await assignment.save();

    res.status(201).json({
      success: true,
      message: "Submission uploaded successfully",
      assignment,
    });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to submit assignment" });
  }
};


// ✅ Grade a submission
export const gradeAssignment = async (req, res) => {
  try {
    const { assignmentId, submissionId, grade, verified } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    const submission = assignment.submissions.find(
      (sub) => sub._id.toString() === submissionId
    );

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    submission.marksObtained = grade;
    submission.feedback = verified;

    await assignment.save();

    res.status(200).json({ success: true, message: "Grade updated successfully" });
  } catch (error) {
    console.error("Grading error:", error);
    res.status(500).json({ success: false, message: "Failed to grade submission" });
  }
};


// ✅ Fetch all submissions for an assignment
export const fetchSubmissions = async (req, res) => {
  try {
    console.log("Fetching submissions")
    const { assignmentId } = req.params;

    console.log(assignmentId)
    const assignment = await Assignment.findById(assignmentId).populate(
      "submissions.studentId",
      "name email"
    );

    console.log("------------------------------------------------",assignment)

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    res.status(200).json({ success: true, submissions: assignment.submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch submissions" });
  }
};

