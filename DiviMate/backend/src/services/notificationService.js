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

// ===============================
// 📨 Send Group Invite Email
// ===============================
export const sendGroupInviteEmail = async (email, groupName, inviterName, userExists) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const subject = userExists
      ? `You've been added to "${groupName}" on DiviMate`
      : `${inviterName} invited you to join DiviMate`;

    const text = userExists
      ? `Hi! ${inviterName} added you to the group "${groupName}" on DiviMate. Log in to view your expenses: ${frontendUrl}/login`
      : `Hi! ${inviterName} wants to split expenses with you in "${groupName}" on DiviMate.\n\nSign up here to get started: ${frontendUrl}/register`;

    const mailOptions = {
      from: `"DiviMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📨 Invite email sent to ${email}`);
  } catch (err) {
    console.error("❌ Invite email error:", err.message);
  }
};

// ===============================
// 📊 Send Weekly Summary Email
// ===============================
export const sendWeeklySummaryEmail = async (email, name, totalOwe, totalGetBack, details) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    let detailsText = "";
    if (details?.length > 0) {
      detailsText = "\n\nBreakdown:\n" + details.map(d =>
        `  • ${d.groupName}: You owe ₹${d.owe.toFixed(2)} | Get back ₹${d.getBack.toFixed(2)}`
      ).join("\n");
    }

    const mailOptions = {
      from: `"DiviMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `DiviMate Weekly Summary — You owe ₹${totalOwe.toFixed(2)}`,
      text: `Hi ${name}!\n\nHere's your weekly DiviMate summary:\n\n💸 Total you owe: ₹${totalOwe.toFixed(2)}\n💰 Total you get back: ₹${totalGetBack.toFixed(2)}${detailsText}\n\nSettle up here: ${frontendUrl}/settlements\n\nCheers,\nDiviMate`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📊 Weekly summary sent to ${email}`);
  } catch (err) {
    console.error("❌ Weekly summary email error:", err.message);
  }
};

// ===============================
// 🔐 Send Phone OTP via Email
// ===============================
export const sendPhoneOtpEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"DiviMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your DiviMate phone verification code",
      text: `Your OTP to verify your phone number is ${otp}. This code will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`🔐 Phone OTP email sent to ${email}`);
  } catch (err) {
    console.error("❌ Phone OTP email error:", err.message);
  }
};
