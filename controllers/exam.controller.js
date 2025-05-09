import Exam from '../models/exam.model.js'; // Import the Exam model

// Create a new exam
export const createExam = async (req, res) => {
  try {
    const {
      title,
      instructions,
      duration,
      passingScore,
      questions,
      courseId,
      instructorId,
    } = req.body;

    const exam = new Exam({
      title,
      instructions,
      duration,
      passingScore,
      questions,
      courseId,
      instructorId,
      isLive: false,
    });

    await exam.save();
    res.status(201).json({ message: 'Exam created successfully', exam });
  } catch (error) {
    res.status(400).json({ message: 'Error creating exam', error });
  }
};

// Update an existing exam
export const updateExam = async (req, res) => {
  const { examId } = req.params;
  try {
    const exam = await Exam.findByIdAndUpdate(examId, req.body, { new: true });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.status(200).json({ message: 'Exam updated successfully', exam });
  } catch (error) {
    res.status(400).json({ message: 'Error updating exam', error });
  }
};

// Delete an exam
export const deleteExam = async (req, res) => {
  const { examId } = req.params;
  try {
    const exam = await Exam.findByIdAndDelete(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.status(200).json({ message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting exam', error });
  }
};

// Get all exams
export const getExams = async (req, res) => {
  try {
    const exams = await Exam.find();
    res.status(200).json(exams);
  } catch (error) {
    res.status(400).json({ message: 'Error fetching exams', error });
  }
};

// Get exams by instructorId (user)
export const getExamsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const exams = await Exam.find({ instructorId: userId });

    if (!exams.length) {
      return res.status(404).json({ message: 'No exams found for this user.' });
    }

    res.status(200).json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get exams by courseId
export const getExamsByCourseId = async (req, res) => {
  try {
    const { courseId } = req.params;
    const exams = await Exam.find({ courseId });

    if (!exams.length) {
      return res.status(404).json({ message: 'No exams found for this course.' });
    }

    res.status(200).json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
