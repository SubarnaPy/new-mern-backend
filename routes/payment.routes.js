// import { Router } from "express";
// import{
//     getRazorpayApikey,
//   //  buySubscription,
//     verifySubscription,
//     cancelSubscription,
//     allPayments,
// } from '../controllers/payment.controller.js';
// import {
//     authorizeRoles,
//     authorizeSubscribers,
//     isLoggedIn,
// } from '../middlewares/auth.middleware.js';

// const router = Router();

// router.route('/subscribe').post(isLoggedIn, buySubscription);
// router.route('/verify').post(isLoggedIn,verifySubscription);
// router.route('/unsubscribe').post(isLoggedIn, authorizeSubscribers, cancelSubscription);
// router.route('/razorpay-key').get(isLoggedIn,getRazorpayApikey);
// router.route('/').get(isLoggedIn, authorizeRoles('ADMIN'),allPayments);


//  export default router;

// // razorpay configration
import { Router } from "express";
const router = Router()
import{
    getRazorpayApikey,
    buyCourse,
    verifypayment,
    cancelSubscription,
    allPayments,
} from '../controllers/payment.controller.js';
import {
    isStudent,
    isLoggedIn,
    isInstructor,
} from '../middlewares/auth.middleware.js';


router.post("/capturePayment", isLoggedIn, buyCourse)
router.post('/razorpay-key',isLoggedIn,getRazorpayApikey);

router.post("/verify",isLoggedIn, verifypayment)
//router.post("/sendPaymentSuccessEmail", isLoggedIn, isStudent, sendPaymentSuccessEmail);///
router.route('/').get(isLoggedIn, isInstructor,allPayments);

export default router;