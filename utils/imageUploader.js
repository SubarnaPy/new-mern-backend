import cloudinary from 'cloudinary';

const uploadImageIntoCloudinary = async (file, folder, height, width) => {
  try {
    const options = { folder };

    if (height) {
      options.height = height;
    }

    if (width) {
      options.width = width;
    }

    console.log('Uploading file from path:', file.path);

    const result = await cloudinary.v2.uploader.upload(file.path, options);

    console.log('Upload result:', result);
    return result;

  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');  // re-throw the error for the asyncHandler middleware to catch and return to the client
  }
};

export default uploadImageIntoCloudinary;
