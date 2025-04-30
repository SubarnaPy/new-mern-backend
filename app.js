

import express from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import errorMiddleware from './middlewares/error.middleware.js';
import cloudinary from 'cloudinary';

// Import routes
import chatRoutes from './routes/chat.routes.js';
import userRoutes from './routes/user.routes.js';
import courseRoutes from './routes/course.routes.js';
import ProfileRoutes from './routes/profile.routes.js';
import miscRoutes from './routes/miscellaneous.routes.js';
import payments from './routes/payment.routes.js';
import announcementRoutes from "./routes/announcement.routes.js";
import upload from './middlewares/multer.middleware.js';


// Load environment variables
config();

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
// const allowedOrigins = [
//   "https://lms4-q82npnle3-subs-projects-2c8f37ee.vercel.app",
//   "https://lms4-kappa.vercel.app",
//   "http://localhost:5173/"
// ];
const allowedOrigins = [

  "http://localhost:5173/"
];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//   })
// );

app.use(
    cors({
        origin: [ process.env.CLIENT_URL   || 'http://localhost:5173'],
        credentials: true,
    })
);


// app.use(
//     corrs({
//         origin: [ process.env.CLIENT_URL   || 'http://localhost:5173'],
//         credentials: true,
//     })
// );
app.options("*", cors()); // ✅ Allow preflight requests globally

app.use(morgan('dev'));
app.use(cookieParser());

// Server status check
app.get('/', (req, res) => {
  res.send('Server is running...');
});

// Routes

app.use("/api/v1/announcements", announcementRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/profile', ProfileRoutes);
app.use('/api/v1/payments', payments);
app.use('/api/v1/miscellaneous', miscRoutes);
app.use('/api/v1/chat', chatRoutes);
// app.post("/api/v1/upload", upload.single("image"), async (req, res) => {
//   try {
//     console.log("Uploaded file:", req.file); // Debugging: Log the uploaded file

//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     // Read the file from disk
//     const filePath = req.file.path;
//     const fileData = fs.readFileSync(filePath);

//     // Convert the file to a base64 string
//     const base64String = `data:${req.file.mimetype};base64,${fileData.toString("base64")}`;

//     // Upload image to Cloudinary
//     const result = await cloudinary.v2.uploader.upload(base64String, {
//       folder: "chat_images", // Optional: Organize images in a folder
//     });

//     // Delete the file from disk after uploading to Cloudinary
//     fs.unlinkSync(filePath);

//     res.json({ imageUrl: result.secure_url });
//   } catch (error) {
//     console.error("Error uploading image:", error);
//     res.status(500).json({ message: "Failed to upload image" });
//   }
// });
// import fs from "fs";

app.post("/api/v1/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("Uploaded file:", req.file); // Debugging: Log the uploaded file

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Read the file from disk
    const filePath = req.file.path;
    const fileData = fs.readFileSync(filePath);

    // Convert the file to a base64 string
    const base64String = `data:${req.file.mimetype};base64,${fileData.toString("base64")}`;

    // Upload file to Cloudinary
    const result = await cloudinary.v2.uploader.upload(base64String, {
      folder: "uploads", // Optional: Organize files in a folder
      resource_type: "auto", // Automatically detect the file type (image, PDF, audio, etc.)
    });

    // Delete the file from disk after uploading to Cloudinary
    fs.unlinkSync(filePath);

    res.json({ fileUrl: result.secure_url });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Failed to upload file" });
  }
});
app.get('/get-duration', async (req, res) => {
  const { videoUrl } = req.query;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Video URL is required' });
  }

  console.log('Fetching duration for video:', videoUrl);

  try {
    // Download the video to a temporary file
    const tempFilePath = `temp-${Date.now()}.mp4`;
    const response = await axios({
      url: videoUrl,
      responseType: 'stream',
    });

    response.data.pipe(fs.createWriteStream(tempFilePath))
      .on('finish', () => {
        // Use ffprobe to get video metadata
        ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
          if (err) {
            console.error('Error fetching video metadata:', err);
            return res.status(500).json({ error: 'Failed to fetch video duration' });
          }

          // Delete the temporary file
          fs.unlinkSync(tempFilePath);

          const duration = metadata.format.duration;
          res.json({ duration });
        });
      })
      .on('error', (err) => {
        console.error('Error downloading video:', err);
        res.status(500).json({ error: 'Failed to download video' });
      });
  } catch (error) {
    console.error('Error fetching video duration:', error);
    res.status(500).json({ error: 'Failed to fetch video duration' });
  }
});

// Custom error handling
app.use(errorMiddleware);

export default app;