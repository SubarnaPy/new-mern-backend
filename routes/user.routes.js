import {Router} from 'express';
import {
    changePassword,
    forgotPassword,
    getLoggedInUserDetails,
    sendOtp,
    loginUser,
    logoutUser,
    registerUser,
    resetPassword,
    updateUser,
    socialAuth,
} from '../controllers/user.controller.js';

import {isLoggedIn} from '../middlewares/auth.middleware.js';
import upload  from '../middlewares/multer.middleware.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post("/sendotp", sendOtp);
router.get('/me',isLoggedIn, getLoggedInUserDetails);
router.post('/reset',forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password',isLoggedIn, changePassword);
router.post("/update",isLoggedIn,upload.single('avatar'), updateUser);
router.post('/social', socialAuth);

export default router;