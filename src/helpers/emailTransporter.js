const nodemailer = require("nodemailer");

const transporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVER,
    host: process.env.EMAIL_HOST, // hostname
    port: 587, // port for secure SMTP
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

 
// console.log(transporter);
const mailDetails = ( fromName, subject, mailto, html) => {
  return {
    from: {
      name: fromName,
      address: process.env.EMAIL_USER,
    },
    // to: ["abc123@yopmail.com"],
    to: mailto,
    subject: subject,
    html: html,
  };
};

const sendMail = async (mailDetails) => {
    try {
        await transporter().sendMail(mailDetails);
        console.log("Email has been sent.....")
    } catch (error) {
        console.log(error,"ty")
    }
}
// sendMail(transporter, mailDetails);

module.exports = {
  transporter,
  mailDetails,
  sendMail
};
