import nodemailer from "nodemailer";
import schedule from "node-schedule";

// ===============================
// 📧 Email Transporter (Gmail)
// ===============================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,   // example: lavish@gmail.com
    pass: process.env.EMAIL_PASS,   // Gmail App Password
  },
});

// ===============================
// 📩 Send Email Now
// ===============================
export const sendPaymentReminder = async (email, groupName, amount, payerName) => {
  try {
    const mailOptions = {
      from: `"DiviMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Payment Reminder for ${groupName}`,
      text: `Hi! You owe ₹${amount} to ${payerName} for your recent group expense in "${groupName}". Please settle soon.`
    };

    await transporter.sendMail(mailOptions);
    console.log(`📩 Email sent to ${email}`);
  } catch (err) {
    console.error("❌ Email sending error:", err.message);
  }
};

// ===============================
// ⏰ Schedule Reminder (1 hour later)
// ===============================
export const schedulePaymentReminder = (email, groupName, amount, payerName) => {
  const runAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour later

  schedule.scheduleJob(runAt, () => {
    sendPaymentReminder(email, groupName, amount, payerName);
  });

  console.log(`⏰ Reminder scheduled for ${email} at ${runAt}`);
};
