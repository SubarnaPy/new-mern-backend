import Announcement from "../models/announcement.model.js";

// 📌 Get all announcements
// import Announcement from "../models/announcementModel.js";
import Course from "../models/course.model.js";

// Get all announcements for a specific course
export const getAnnouncementsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Validate CourseId
    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    // Check if Course Exists
    const courseExists = await Course.exists({ _id: courseId });
    if (!courseExists) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Fetch Announcements for the Course
    const announcements = await Announcement.find({ courseId }).sort({ createdAt: -1 });

    res.status(200).json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
};

 
// 📌 Create a new announcement (Instructor only)
export const createAnnouncement = async (req, res) => {
  try {
    const { message,username, courseId,isLive,roomId } = req.body;

    if (!message.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    // Validate Course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Ensure only the course instructor can create announcements
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the course instructor can post announcements" });
    }

    const newAnnouncement = new Announcement({
      message,
      authorId: req.user.id,
      authorName: username,
      courseId,
      isLive,
      roomId: isLive ? roomId : null,
    });

    await newAnnouncement.save();

    // Add announcement ID to the course
    course.announcements.push(newAnnouncement._id);
    await course.save();

    res.status(201).json(newAnnouncement);
  } catch (error) {
    res.status(500).json({ message: "Error creating announcement" });
  }
};
