import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import fs from "fs";

// Derive __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the upload directory
const uploadDir = path.join(__dirname, "uploads");

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const originalName = file.originalname;
    const newName = `${timestamp}-${originalName}`;
    cb(null, newName);
  },
});

// Multer file filter for allowed formats
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Add .wav to the list of allowed file types
  if (![".jpg", ".jpeg", ".webp", ".png", ".mp4", ".pdf", ".wav"].includes(ext)) {
    return cb(new Error(`Unsupported file type: ${ext}`), false);
  }

  cb(null, true);
};

// Initialize multer with file size limits and filter
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max size limit per file
  fileFilter,
});

// Middleware for handling multiple file uploads
export const uploadMultiple = upload.fields([
  { name: "videoFile", maxCount: 1 }, // Accepts 1 video file
  { name: "pdfFile", maxCount: 1 },   // Accepts 1 PDF file
]);

export default upload;