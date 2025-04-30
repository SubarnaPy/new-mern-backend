import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import Assignment from "../models/assignment.model.js";
import CourseProgress from "../models/courseProgress.model.js";
import Quiz from "../models/quize.model.js";
import SubSection from "../models/subSection.model.js";

//course progress add course in courseProgress
export const updateCourseProgress  = asyncHandler(async (req, res, next) => {
    const {courseId, subSectionId} = req.body;
    const userId = req.user.id;
    console.log(req.body)

    try {
        const subSection = await SubSection.findById(subSectionId);

        if(!subSection){
            return res.status(405).json({
                error:"Invalid SubSection"
            })
        }

        let courseProgress = await CourseProgress.findOne({
            courseID:courseId,
            userId:userId
        })

        if (!courseProgress) {
            return res.status(406).json({
                error:"Course Progress does not exist"
            })
        }
        else{
            if (courseProgress.completedVideos.includes(subSectionId)) {
                return res.status(200).json({
                    success:false,
                    message:"Video already completed"
                })
            }

            courseProgress.completedVideos.push(subSectionId);
            console.log("Copurse Progress Push Done");
        }
        await courseProgress.save();
        console.log("Copurse Progress",courseProgress)
        const completedVideos = courseProgress.completedVideos;
        console.log("Course Progress Save call Done");
        return res.status(200).json({
            success:true,
            completedVideos,
            message:"Course Progress Updated Successfully",
        })
    } catch (error) {
        console.error(error);
        return res.status(400).json({error:"Internal Server Error"});
    }


});



// 📌 Update Course Progress for Assignments
export const updateAssignmentProgress = asyncHandler(async (req, res) => {
    console.log(req.body)
    const { courseId, assignmentId } = req.body;
    console.log("65678900987654",req.user.id)
    const userId = req.user.id;
    console.log("65678900987654")

    try {
        const assignment = await Assignment.findById(assignmentId);
        
        if (!assignment) {
            return res.status(404).json({ error: "Invalid Assignment" });
        }
        console.log("65678900987654")


        let courseProgress = await CourseProgress.findOne({
            courseID: courseId,
            userId: userId
        });
        console.log("65678900987655")

        if (!courseProgress) {
            return res.status(404).json({ error: "Course Progress not found" });
        }
        console.log("656789009876546")

        if (courseProgress.completedAssignments.includes(assignmentId)) {
            return res.status(200).json({
                success: false,
                message: "Assignment already completed"
            });
        }
        console.log("656789009876547")

        courseProgress.completedAssignments.push(assignmentId);
        await courseProgress.save();
        console.log("656789009876548")

        return res.status(200).json({
            success: true,
            message: "Assignment progress updated successfully",
            completedAssignments: courseProgress.completedAssignments
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// 📌 Update Course Progress for Quizzes
export const updateQuizProgress = asyncHandler(async (req, res) => {
    const { courseId, quizId } = req.body;
    const userId = req.user.id;

    try {
        const quiz = await Quiz.findById(quizId);

        if (!quiz) {
            return res.status(404).json({ error: "Invalid Quiz" });
        }

        let courseProgress = await CourseProgress.findOne({
            courseID: courseId,
            userId: userId
        });

        if (!courseProgress) {
            return res.status(404).json({ error: "Course Progress not found" });
        }

        if (courseProgress.completedQuizzes.includes(quizId)) {
            return res.status(200).json({
                success: false,
                message: "Quiz already completed"
            });
        }

        courseProgress.completedQuizzes.push(quizId);
        await courseProgress.save();

        return res.status(200).json({
            success: true,
            message: "Quiz progress updated successfully",
            completedQuizzes: courseProgress.completedQuizzes
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});




