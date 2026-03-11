import nodemailer from "nodemailer";
import schedule from "node-schedule";

// ===============================
// 📧 Email Transporter (Gmail)
// ===============================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,   // forextrauseidjava@gmail.com
    pass: process.env.EMAIL_PASS,   // Gmail App Password
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error.message);
  } else {
    console.log("✅ Email transporter is ready to send emails");
  }
});

// ===============================
// 🎨 Email Template Base
// ===============================
const getEmailTemplate = (content, title = "DiviMate") => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">💰 DiviMate</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Split expenses, not friendships</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #6c757d; font-size: 12px;">© ${new Date().getFullYear()} DiviMate. All rights reserved.</p>
              <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 11px;">This is an automated message. Please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ===============================
// 🔐 Send Registration OTP Email
// ===============================
export const sendRegistrationOtpEmail = async (email, otp, name) => {
  try {
    const content = `
      <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Hi${name ? ` ${name}` : ''}! 👋<br><br>
        Welcome to DiviMate! Use the OTP below to complete your registration:
      </p>
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 25px; text-align: center; margin: 25px 0;">
        <span style="font-size: 36px; font-weight: bold; color: #ffffff; letter-spacing: 8px;">${otp}</span>
      </div>
      <p style="color: #888; font-size: 14px; margin: 20px 0 0 0;">
        ⏰ This OTP is valid for <strong>10 minutes</strong>.<br>
        🔒 Never share this OTP with anyone.
      </p>
    `;

    const mailOptions = {
      from: `"DiviMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🔐 Your DiviMate Verification Code: ${otp}`,
      text: `Your DiviMate verification code is: ${otp}. This code is valid for 10 minutes.`,
      html: getEmailTemplate(content, "Email Verification"),
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Registration OTP sent to ${email}`);
    return true;
  } catch (err) {
    console.error("❌ Registration OTP email error:", err.message);
    return false;
  }
};

// ===============================
// 🎉 Send Welcome Email
// ===============================
export const sendWelcomeEmail = async (email, name) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const content = `
      <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Welcome to DiviMate! 🎉</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Hi ${name}! 👋<br><br>
        Your account has been successfully created. You're now ready to split expenses with friends and family!
      </p>
      <div style="background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">🚀 Get Started:</h3>
        <ul style="color: #555; padding-left: 20px; margin: 0;">
          <li style="margin-bottom: 10px;">Create your first expense group</li>
          <li style="margin-bottom: 10px;">Add friends by email</li>
          <li style="margin-bottom: 10px;">Track and split expenses easily</li>
          <li style="margin-bottom: 10px;">Settle up with one click</li>
        </ul>
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${frontendUrl}/login" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Start Splitting →</a>
      </div>
    `;

    const mailOptions = {
      from: `"DiviMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎉 Welcome to DiviMate, ${name}!`,
      text: `Welcome to DiviMate, ${name}! Your account is ready. Start splitting expenses at ${frontendUrl}`,
      html: getEmailTemplate(content, "Welcome"),
    };

    await transporter.sendMail(mailOptions);
    console.log(`🎉 Welcome email sent to ${email}`);
    return true;
  } catch (err) {
    console.error("❌ Welcome email error:", err.message);
    return false;
  }
};

// ===============================
// 🔑 Send Password Reset OTP
// ===============================
export const sendPasswordResetOtpEmail = async (email, otp, name) => {
  try {
    const content = `
      <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Hi${name ? ` ${name}` : ''}! 👋<br><br>
        We received a request to reset your password. Use the OTP below to proceed:
      </p>
      <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); border-radius: 10px; padding: 25px; text-align: center; margin: 25px 0;">
        <span style="font-size: 36px; font-weight: bold; color: #ffffff; letter-spacing: 8px;">${otp}</span>
      </div>
      <p style="color: #888; font-size: 14px; margin: 20px 0 0 0;">
        ⏰ This OTP is valid for <strong>10 minutes</strong>.<br>
        🔒 If you didn't request this, please ignore this email.
      </p>
    `;

    const mailOptions = {
      from: `"DiviMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🔑 DiviMate Password Reset Code: ${otp}`,
      text: `Your DiviMate password reset code is: ${otp}. This code is valid for 10 minutes. If you didn't request this, ignore this email.`,
      html: getEmailTemplate(content, "Password Reset"),
    };

    await transporter.sendMail(mailOptions);
    console.log(`🔑 Password reset OTP sent to ${email}`);
    return true;
  } catch (err) {
    console.error("❌ Password reset OTP email error:", err.message);
    return false;
  }
};

// ===============================
// ✅ Send Password Changed Confirmation
// ===============================
export const sendPasswordChangedEmail = async (email, name) => {
  try {
    const content = `
      <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Password Changed Successfully ✅</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Hi ${name}! 👋<br><br>
        Your DiviMate password has been successfully changed.
      </p>
      <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 10px; padding: 20px; margin: 20px 0;">
        <p style="color: #155724; margin: 0; font-size: 14px;">
          🔐 If you made this change, no further action is needed.<br><br>
          ⚠️ If you didn't change your password, please contact support immediately.
        </p>
      </div>
    `;

    const mailOptions = {
      from: `"DiviMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ DiviMate Password Changed Successfully`,
      text: `Your DiviMate password has been changed. If you didn't make this change, please contact support.`,
      html: getEmailTemplate(content, "Password Changed"),
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password changed email sent to ${email}`);
    return true;
  } catch (err) {
    console.error("❌ Password changed email error:", err.message);
    return false;
  }
};

// ===============================
// 📩 Send Payment Reminder
// ===============================
export const sendPaymentReminder = async (email, groupName, amount, payerName) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const content = `
      <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Payment Reminder 💸</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Hi there! 👋<br><br>
        This is a friendly reminder about your pending payment.
      </p>
      <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 10px; padding: 20px; margin: 20px 0;">
        <p style="color: #856404; margin: 0; font-size: 16px;">
          <strong>Group:</strong> ${groupName}<br>
          <strong>Amount:</strong> ₹${amount}<br>
          <strong>Pay to:</strong> ${payerName}
        </p>
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${frontendUrl}/settlements" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Settle Up Now →</a>
      </div>
    `;

    const mailOptions = {
      from: `"DiviMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `💸 Payment Reminder: ₹${amount} for ${groupName}`,
      text: `Hi! You owe ₹${amount} to ${payerName} for your recent group expense in "${groupName}". Please settle soon.`,
      html: getEmailTemplate(content, "Payment Reminder"),
    };

    await transporter.sendMail(mailOptions);
    console.log(`📩 Payment reminder sent to ${email}`);
    return true;
  } catch (err) {
    console.error("❌ Payment reminder email error:", err.message);
    return false;
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

    const content = userExists
      ? `
        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">You've Joined a Group! 🎉</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
          Hi there! 👋<br><br>
          <strong>${inviterName}</strong> has added you to the group "<strong>${groupName}</strong>" on DiviMate.
        </p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${frontendUrl}/login" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">View Group →</a>
        </div>
      `
      : `
        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">You're Invited! 🎉</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
          Hi there! 👋<br><br>
          <strong>${inviterName}</strong> wants to split expenses with you in "<strong>${groupName}</strong>" on DiviMate.
        </p>
        <div style="background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <p style="color: #555; margin: 0; font-size: 14px;">
            DiviMate makes it easy to track shared expenses and settle up with friends.
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${frontendUrl}/register" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Join Now →</a>
        </div>
      `;

    const mailOptions = {
      from: `"DiviMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text: userExists
        ? `Hi! ${inviterName} added you to the group "${groupName}" on DiviMate. Log in to view your expenses: ${frontendUrl}/login`
        : `Hi! ${inviterName} wants to split expenses with you in "${groupName}" on DiviMate. Sign up here: ${frontendUrl}/register`,
      html: getEmailTemplate(content, "Group Invitation"),
    };

    await transporter.sendMail(mailOptions);
    console.log(`📨 Invite email sent to ${email}`);
    return true;
  } catch (err) {
    console.error("❌ Invite email error:", err.message);
    return false;
  }
};

// ===============================
// 📊 Send Weekly Summary Email
// ===============================
export const sendWeeklySummaryEmail = async (email, name, totalOwe, totalGetBack, details) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    
    let detailsHtml = "";
    if (details?.length > 0) {
      detailsHtml = `
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; color: #333;">Group</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6; color: #e74c3c;">You Owe</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6; color: #27ae60;">You Get Back</th>
            </tr>
          </thead>
          <tbody>
            ${details.map(d => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #dee2e6; color: #555;">${d.groupName}</td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6; color: #e74c3c;">₹${d.owe.toFixed(2)}</td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6; color: #27ae60;">₹${d.getBack.toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    }

    const content = `
      <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Your Weekly Summary 📊</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Hi ${name}! 👋<br><br>
        Here's your weekly expense summary from DiviMate:
      </p>
      <div style="display: flex; gap: 20px; margin: 25px 0;">
        <div style="flex: 1; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); border-radius: 10px; padding: 20px; text-align: center;">
          <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">You Owe</p>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 28px; font-weight: bold;">₹${totalOwe.toFixed(2)}</p>
        </div>
        <div style="flex: 1; background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%); border-radius: 10px; padding: 20px; text-align: center;">
          <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">You Get Back</p>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 28px; font-weight: bold;">₹${totalGetBack.toFixed(2)}</p>
        </div>
      </div>
      ${detailsHtml}
      <div style="text-align: center; margin-top: 30px;">
        <a href="${frontendUrl}/settlements" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Settle Up Now →</a>
      </div>
    `;

    const mailOptions = {
      from: `"DiviMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `📊 DiviMate Weekly Summary — You owe ₹${totalOwe.toFixed(2)}`,
      text: `Hi ${name}! Here's your weekly DiviMate summary:\n\n💸 Total you owe: ₹${totalOwe.toFixed(2)}\n💰 Total you get back: ₹${totalGetBack.toFixed(2)}\n\nSettle up here: ${frontendUrl}/settlements`,
      html: getEmailTemplate(content, "Weekly Summary"),
    };

    await transporter.sendMail(mailOptions);
    console.log(`📊 Weekly summary sent to ${email}`);
    return true;
  } catch (err) {
    console.error("❌ Weekly summary email error:", err.message);
    return false;
  }
};

// ===============================
// 📱 Send Phone OTP via Email
// ===============================
export const sendPhoneOtpEmail = async (email, otp) => {
  try {
    const content = `
      <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Phone Verification OTP</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Use the OTP below to verify your phone number:
      </p>
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 25px; text-align: center; margin: 25px 0;">
        <span style="font-size: 36px; font-weight: bold; color: #ffffff; letter-spacing: 8px;">${otp}</span>
      </div>
      <p style="color: #888; font-size: 14px; margin: 20px 0 0 0;">
        ⏰ This OTP is valid for <strong>10 minutes</strong>.
      </p>
    `;

    const mailOptions = {
      from: `"DiviMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `📱 Phone Verification OTP: ${otp}`,
      text: `Your phone verification OTP is: ${otp}. Valid for 10 minutes.`,
      html: getEmailTemplate(content, "Phone Verification"),
    };

    await transporter.sendMail(mailOptions);
    console.log(`📱 Phone OTP sent to ${email}`);
    return true;
  } catch (err) {
    console.error("❌ Phone OTP email error:", err.message);
    return false;
  }
};

// ===============================
// 💰 Send Settlement Notification
// ===============================
export const sendSettlementEmail = async (payerEmail, payerName, receiverEmail, receiverName, amount, groupName) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    
    // Email to receiver (the one getting paid)
    const receiverContent = `
      <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Payment Received! 💰</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Hi ${receiverName}! 👋<br><br>
        Great news! <strong>${payerName}</strong> has settled up with you.
      </p>
      <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="color: #155724; margin: 0; font-size: 14px;">Amount Received</p>
        <p style="color: #155724; margin: 10px 0 0 0; font-size: 32px; font-weight: bold;">₹${amount}</p>
        <p style="color: #155724; margin: 10px 0 0 0; font-size: 14px;">From: ${payerName} • Group: ${groupName}</p>
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${frontendUrl}/settlements" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">View Details →</a>
      </div>
    `;

    // Email to payer (the one paying)
    const payerContent = `
      <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Payment Confirmed! ✅</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Hi ${payerName}! 👋<br><br>
        Your payment to <strong>${receiverName}</strong> has been recorded.
      </p>
      <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="color: #0c5460; margin: 0; font-size: 14px;">Amount Paid</p>
        <p style="color: #0c5460; margin: 10px 0 0 0; font-size: 32px; font-weight: bold;">₹${amount}</p>
        <p style="color: #0c5460; margin: 10px 0 0 0; font-size: 14px;">To: ${receiverName} • Group: ${groupName}</p>
      </div>
    `;

    await Promise.all([
      transporter.sendMail({
        from: `"DiviMate" <${process.env.EMAIL_USER}>`,
        to: receiverEmail,
        subject: `💰 ${payerName} paid you ₹${amount}`,
        text: `${payerName} has paid you ₹${amount} for ${groupName}.`,
        html: getEmailTemplate(receiverContent, "Payment Received"),
      }),
      transporter.sendMail({
        from: `"DiviMate" <${process.env.EMAIL_USER}>`,
        to: payerEmail,
        subject: `✅ Payment of ₹${amount} to ${receiverName} confirmed`,
        text: `Your payment of ₹${amount} to ${receiverName} for ${groupName} has been recorded.`,
        html: getEmailTemplate(payerContent, "Payment Confirmed"),
      }),
    ]);

    console.log(`💰 Settlement emails sent to ${payerEmail} and ${receiverEmail}`);
    return true;
  } catch (err) {
    console.error("❌ Settlement email error:", err.message);
    return false;
  }
};

// ===============================
// 🧾 Send New Expense Notification
// ===============================
export const sendNewExpenseEmail = async (email, name, expenseTitle, amount, paidBy, groupName, yourShare) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const content = `
      <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">New Expense Added 🧾</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        Hi ${name}! 👋<br><br>
        A new expense has been added to <strong>${groupName}</strong>.
      </p>
      <div style="background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%;">
          <tr>
            <td style="color: #666; padding: 8px 0;">Expense:</td>
            <td style="color: #333; font-weight: 600; text-align: right;">${expenseTitle}</td>
          </tr>
          <tr>
            <td style="color: #666; padding: 8px 0;">Total Amount:</td>
            <td style="color: #333; font-weight: 600; text-align: right;">₹${amount}</td>
          </tr>
          <tr>
            <td style="color: #666; padding: 8px 0;">Paid by:</td>
            <td style="color: #333; font-weight: 600; text-align: right;">${paidBy}</td>
          </tr>
          <tr>
            <td style="color: #666; padding: 8px 0; border-top: 1px solid #dee2e6; padding-top: 16px;">Your Share:</td>
            <td style="color: #e74c3c; font-weight: 700; text-align: right; font-size: 20px; border-top: 1px solid #dee2e6; padding-top: 16px;">₹${yourShare}</td>
          </tr>
        </table>
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${frontendUrl}/groups" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">View Expense →</a>
      </div>
    `;

    const mailOptions = {
      from: `"DiviMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🧾 New Expense: ${expenseTitle} (₹${amount}) in ${groupName}`,
      text: `New expense "${expenseTitle}" of ₹${amount} added to ${groupName}. Your share: ₹${yourShare}. Paid by: ${paidBy}`,
      html: getEmailTemplate(content, "New Expense"),
    };

    await transporter.sendMail(mailOptions);
    console.log(`🧾 New expense email sent to ${email}`);
    return true;
  } catch (err) {
    console.error("❌ New expense email error:", err.message);
    return false;
  }
};
