const nodemailer = require("nodemailer");

let _transporter = null;

/**
 * Returns a configured Nodemailer transporter.
 * Prioritizes EMAIL_USER / EMAIL_PASS (e.g. Gmail App Password), then SMTP_*,
 * falling back to Ethereal dev account if not configured or using placeholder.
 */
const getTransporter = async () => {
  if (_transporter) return _transporter;

  const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || "").trim();
  const emailPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || "").trim();
  const smtpHost  = (process.env.SMTP_HOST || "").trim();

  const isPlaceholder = !emailUser || emailUser.includes("your-gmail-address");

  if (!isPlaceholder && emailPass) {
    const cleanPass = emailPass.replace(/\s+/g, "");
    const isGmail = emailUser.toLowerCase().includes("@gmail.com") || smtpHost.includes("gmail");

    if (isGmail) {
      console.log(`[Nodemailer] Configured Gmail SMTP for: ${emailUser}`);
      _transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailUser,
          pass: cleanPass,
        },
      });
      return _transporter;
    }

    console.log(`[Nodemailer] Configured SMTP server: ${smtpHost || "smtp.gmail.com"} (${emailUser})`);
    _transporter = nodemailer.createTransport({
      host:   smtpHost || "smtp.gmail.com",
      port:   Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === "true" || (!process.env.SMTP_PORT || process.env.SMTP_PORT === "465"),
      auth: {
        user: emailUser,
        pass: cleanPass,
      },
    });
    return _transporter;
  }

  // Dev fallback: Ethereal test account
  if (isPlaceholder && emailUser) {
    console.log(
      "[Nodemailer] Notice: EMAIL_USER is currently 'your-gmail-address@gmail.com'. " +
      "Replace with your actual Gmail account in server/.env to enable live email delivery."
    );
  }

  try {
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host:   "smtp.ethereal.email",
      port:   587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log(
      "[Nodemailer] Using Ethereal test account:",
      testAccount.user,
      "\n  Preview emails at: https://ethereal.email"
    );
  } catch (err) {
    console.error("[Nodemailer] Ethereal fallback account creation failed:", err.message);
  }

  return _transporter;
};

module.exports = { getTransporter };
