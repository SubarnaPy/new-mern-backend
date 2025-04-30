import mongoose, { model, Schema } from 'mongoose';
import sendMail from '../utils/sendMail.js';
import path from 'path';
import ejs from 'ejs';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const otpSchema = new Schema(
  {
    email:{
        type: String,
        
    },
    otp:{
        type: Number,
       
    },
    createdAt:{
        type: Date,
        default: Date.now(),
        expires: 60 * 60 * 1000, // 1 hour
    }
  
  },
  {
    timestamps: true,
  }
);

//send otp to mail
async function sendVerificationMail(email,otp){
    try {
        console.log('sendVerificationMail',email,otp)

         // Path to the EJS email template
         const pathToTemplate = path.join(__dirname,'../template/otpTemplate.ejs');
         const emailContent = await ejs.renderFile(pathToTemplate, {
           
           otp: otp,
           year: new Date().getFullYear(),
       });

        const mailResponse = await sendMail(email,"verification mail",emailContent);
        
    } catch (error) {
        console.error('Error sending mail:', error);
        throw new Error('Failed to send OTP');
        
    }
}

otpSchema.post('save', async function() {
    await sendVerificationMail(this.email, this.otp);
   
 });
 
 



const OTP = model('OTP', otpSchema);

export default OTP;
