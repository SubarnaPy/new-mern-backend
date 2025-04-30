 import jwt from 'jsonwebtoken';

import AppError from '../utils/AppError.js';
import asyncHandler from './asyncHandler.middleware.js';
import { promisify } from 'util';

//import jwt from 'jsonwebtoken';

const verifyToken = promisify(jwt.verify.bind(jwt));
//console.log(verifyToken)


export const isLoggedIn = asyncHandler(async (req, res, next) => {
    const token = req.cookies.token || req.body.token || req.header("Authorization")?.replace("Bearer ", "");
    // console.log("token is :",token);

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to access this route.', 401));
    }

    try {
        // console.log("inside verify token",process.env.JWT_SECRET);
        const decode = await verifyToken(token, process.env.JWT_SECRET);

        //console.log("decode is :",decode);

        if (!decode.id) {
            return next(new AppError('Your session has expired! Please log in again.', 401));
        }
        //console.log("decode id is :",decode.id);

        // const user = await redis.get(decode.id);
        // if (!user) {
        //     return next(new AppError('User not found', 404));
        // }
       

        req.user =   decode ;
        next();
    } catch (error) {
        return next(new AppError('Invalid or expired token. Please log in again.', 402));
    }
});

// export const isLoggedIn=asyncHandler(async(req,_res,next)=>{
//     //extrac token from cookie
//     const {token}=req.cookies;

//     //if token not found, return forbidden
//     if(!token){
//         return next(new AppError('You are not logged in! Please log in to access this route.',401));
//     }

//     //decording the token using verify methode
//     //const decode=await jwt.verify(token,process.env.JWT_SECRET);
//     const decode= await jwt.verify(token,process.env.JWT_SECRET);
//     //if token is expired, return unauthorized
//     if(!decode.id){
//         return next(new AppError('Your session has expired! Please log in again.',401));
//     }

//     //if token is valid, add user to req body
//     req.user=decode;

//     next();
// });

//middleware to check if the user is admin or not

// export const authorizeRoles=(...roles) =>{
//     return asyncHandler(async(req, _res, next)=>{
//         if(!roles.includes(req.user.role)){
//             return next(new AppError('You are not authorized to perform this action.',403));
//         }
//         next();
//     });

// };

export const isStudent= asyncHandler(async(req, res, next)=>{
    try {
        if(req.user.role!=='STUDENT'){
            return next(new AppError('You are not a student! You can not access this route.',403));
        }
        next();
    } catch (error) {
        console.error(error);
        return next(new AppError('Error occurred while checking user role.', 500));
        
    }
});

export const isInstructor= asyncHandler(async(req, res, next)=>{
   try {
    if(req.user.role!=='INSTRUCTOR'){
        return next(new AppError('You are not a teacher! You can not access this route.',403));
    }
    next();
    
   } catch (error) {
    console.error(error);
    return next(new AppError('Error occurred while checking user role.', 500));
    
   }
})

export const isAdmin= asyncHandler(async(req, res, next)=>{
    try {
        if(req.user.role!=='ADMIN'){
            return next(new AppError('You are not an admin! You can not access this route.',403));
        }
        next();
    } catch (error) {
        console.error(error);
        return next(new AppError('Error occurred while checking user role.', 500));
        
    }
})


// Middleware to check if user has an active subscription or not
export const authorizeSubscribers = asyncHandler(async (req, _res, next) => {
    // If user is not admin or does not have an active subscription then error else pass
    if (req.user.role !== "ADMIN" || req.user.subscription.status !== "active") {
      return next(new AppError("Please subscribe to access this route.", 403));
    }
  
    next();
  });