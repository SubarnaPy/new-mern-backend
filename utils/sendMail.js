import nodemailer from 'nodemailer';

const sendMail =async(email,subject,htmlTamplate)=>{
  try {
   // console.log('Sending mail',email,subject,massage,process.env.SMTP_HOST,process.env.SMTP_PORT,);
    let transporter=nodemailer.createTransport({
        host:process.env.SMTP_HOST,
        port:process.env.SMTP_PORT,
        secure:false,
        service:'gmail',
        auth:{
            user:process.env.SMTP_USERNAME ||"mondalsubarna29@gmail.com",
            
            pass:process.env.SMTP_PASSWORD ||"jbqv uybn zbzi ltlc"
        },
        timeout: 60000, // Increase timeout to 60 seconds (default is 10 seconds)

    });

    let info=await transporter.sendMail({
        from:process.env.SMTP_FROM_EMAIL,
        to:email,
        subject:subject,
        html:htmlTamplate
    });
    console.log('Email sent:', info);
    return info;  // return the sent email info for further use, like tracking the email ID or other details
    
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');  // re-throw the error for the asyncHandler middleware to catch and return to the client
    
  }


};

export default sendMail;