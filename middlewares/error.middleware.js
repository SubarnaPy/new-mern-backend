import AppError from "../utils/AppError.js";

const errorMiddleware = (err, _req, res, _next) => {
    // Set default error properties
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Something went wrong'; // Corrected 'massage' to ''

    //wrong mongodb id
    if(err.name=='CastError'){
      const message = `resourse not . Invalid: ${err.path}`;
      err= new AppError(message,400);
    }

    //duplicate key error
    if(err.code===11000){
      const message = `Duplicate key error: ${err.keyValue.email}`;
      err= new AppError(message,400);
    }

    //wrong jwt error
    if(err.name==='JsonWebTokenError'){
      const message = 'Invalid token. Please log in again.';
      err= new AppError(message,401);
    }
    
    //expired jwt error
    if(err.name==='TokenExpiredError'){
      const message = 'Your session has expired! Please log in again.';
      err= new AppError(message,401);
    }
  
    // Send error response
    res.status(err.statusCode).json({
      message: err.message, // Corrected here as well
      error: err,
      success: false,
      stack: err.stack,
    });
  };
  
  export default errorMiddleware;
  