// lib/email.ts

import nodemailer from 'nodemailer';

// Configure email transporter
const createTransporter = () => {
  // For production, use actual SMTP details
  if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT) || 587,
      secure: process.env.EMAIL_SERVER_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });
  }
  
  // For development, use Ethereal (fake SMTP service)
  return nodemailer.createTestAccount().then(account => {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    });
  });
};

export async function sendVerificationEmail(email: string, name: string, verificationUrl: string) {
  try {
    const transporter = await createTransporter();
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Mentarie Support" <no-reply@mentarie.com>',
      to: email,
      subject: 'Verify Your Email Address - Mentarie',
      text: 
`Hello ${name},

Thank you for registering with Mentarie. Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you did not create an account, please ignore this email.

Best regards,
The Mentarie Team`,
      html: 
`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <div style="width: 80px; height: 80px; background-color: #e0e0e0; margin: 0 auto; border-radius: 5px;"></div>
  </div>
  
  <h2 style="color: #4a3728; text-align: center;">Verify Your Email Address</h2>
  
  <p style="color: #4a3728;">Hello ${name},</p>
  
  <p style="color: #4a3728;">Thank you for registering with Mentarie. Please verify your email address by clicking the button below:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${verificationUrl}" style="background-color: #4a3728; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold;">Verify Email Address</a>
  </div>
  
  <p style="color: #4a3728;">This link will expire in 24 hours.</p>
  
  <p style="color: #4a3728;">If the button doesn't work, you can also copy and paste the following link into your browser:</p>
  
  <p style="color: #4a3728; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 14px;">${verificationUrl}</p>
  
  <p style="color: #4a3728;">If you did not create an account, please ignore this email.</p>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Mentarie. All rights reserved.</p>
  </div>
</div>`
    };
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Verification email sent:', info.messageId);
    
    // If using Ethereal in development, log the preview URL
    if (info.messageId && !process.env.EMAIL_SERVER) {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error };
  }
}