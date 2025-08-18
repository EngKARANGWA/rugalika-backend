import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@rugalika.gov.rw';
    this.createTransporter();
  }

  private createTransporter(): void {
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    };

    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
      logger.warn('SMTP credentials not configured. Email functionality will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport(smtpConfig);

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        logger.error('SMTP connection failed:', error);
      } else {
        logger.info('SMTP server is ready to take our messages');
      }
    });
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      logger.error('Email transporter not configured');
      return false;
    }

    try {
      const mailOptions = {
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}. Message ID: ${result.messageId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  /**
   * Send OTP verification email
   */
  async sendOTPEmail(email: string, otpCode: string): Promise<boolean> {
    const subject = 'Rugalika News - Kode ya Kwinjira / Login Code';
    
    const html = `
      <!DOCTYPE html>
      <html lang="rw">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kode ya Kwinjira - Rugalika News</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .otp-code { 
            font-size: 32px; 
            font-weight: bold; 
            color: #2c5aa0; 
            text-align: center; 
            padding: 20px; 
            background-color: white; 
            border: 2px dashed #2c5aa0;
            margin: 20px 0;
            letter-spacing: 5px;
          }
          .warning { 
            background-color: #fff3cd; 
            border: 1px solid #ffeaa7; 
            color: #856404; 
            padding: 15px; 
            margin: 15px 0; 
            border-radius: 4px;
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            color: #666; 
            font-size: 12px; 
          }
          .logo { max-width: 150px; height: auto; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Rugalika News</h1>
            <p>Amakuru ya Rugalika</p>
          </div>
          
          <div class="content">
            <h2>Muraho! / Hello!</h2>
            
            <p><strong>Kinyarwanda:</strong></p>
            <p>Mwakoze gusaba kwinjira muri sisiteme ya Rugalika News. Kode yanyu ya kwinjira ni:</p>
            
            <div class="otp-code">${otpCode}</div>
            
            <div class="warning">
              <strong>Ngurukiko:</strong> Iyi kode irangira mu minota 5. Ntimuyisangire n'undi muntu.
            </div>
            
            <hr style="margin: 30px 0;">
            
            <p><strong>English:</strong></p>
            <p>You have requested to login to Rugalika News system. Your login code is:</p>
            
            <div class="otp-code">${otpCode}</div>
            
            <div class="warning">
              <strong>Important:</strong> This code expires in 5 minutes. Do not share it with anyone.
            </div>
            
            <p>Niba mutasabye iyi kode, reka iyirengagize. / If you didn't request this code, please ignore this email.</p>
          </div>
          
          <div class="footer">
            <p>Rugalika Sector - Official News Portal</p>
            <p>Email: info@rugalika.gov.rw | Phone: +250 788 000 000</p>
            <p>&copy; ${new Date().getFullYear()} Rugalika Sector. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Rugalika News - Kode ya Kwinjira / Login Code
      
      Kinyarwanda:
      Mwakoze gusaba kwinjira muri sisiteme ya Rugalika News.
      Kode yanyu ya kwinjira ni: ${otpCode}
      
      Ngurukiko: Iyi kode irangira mu minota 5. Ntimuyisangire n'undi muntu.
      
      English:
      You have requested to login to Rugalika News system.
      Your login code is: ${otpCode}
      
      Important: This code expires in 5 minutes. Do not share it with anyone.
      
      Niba mutasabye iyi kode, reka iyirengagize.
      If you didn't request this code, please ignore this email.
      
      Rugalika Sector - Official News Portal
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    const subject = 'Murakaza neza muri Rugalika News / Welcome to Rugalika News';
    
    const html = `
      <!DOCTYPE html>
      <html lang="rw">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Murakaza neza - Rugalika News</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .welcome-box { 
            background-color: white; 
            padding: 20px; 
            margin: 20px 0; 
            border-left: 4px solid #2c5aa0;
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Rugalika News</h1>
            <p>Amakuru ya Rugalika</p>
          </div>
          
          <div class="content">
            <div class="welcome-box">
              <h2>Murakaza neza, ${firstName}!</h2>
              <p>Mwakoze kwiyandikisha muri sisiteme ya Rugalika News. Muri ubu mushobora:</p>
              <ul>
                <li>Gusoma amakuru ya Rugalika</li>
                <li>Gutanga ibitekerezo</li>
                <li>Gusaba ubufasha</li>
                <li>Kugirana uruhare mu buzima bwa Rugalika</li>
              </ul>
            </div>
            
            <div class="welcome-box">
              <h2>Welcome, ${firstName}!</h2>
              <p>Thank you for registering with Rugalika News system. You can now:</p>
              <ul>
                <li>Read Rugalika news and updates</li>
                <li>Submit feedback and suggestions</li>
                <li>Request help from departments</li>
                <li>Participate in community discussions</li>
              </ul>
            </div>
            
            <p>Murakoze guhitamo Rugalika News! / Thank you for choosing Rugalika News!</p>
          </div>
          
          <div class="footer">
            <p>Rugalika Sector - Official News Portal</p>
            <p>Email: info@rugalika.gov.rw | Phone: +250 788 000 000</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  /**
   * Send notification email for feedback response
   */
  async sendFeedbackResponseEmail(
    email: string, 
    feedbackTitle: string, 
    adminResponse: string,
    status: string
  ): Promise<boolean> {
    const subject = `Rugalika News - Igisubizo ku bitekerezo / Feedback Response: ${feedbackTitle}`;
    
    const statusText = {
      'approved': { rw: 'Byemejwe', en: 'Approved' },
      'rejected': { rw: 'Byanze', en: 'Rejected' }
    };

    const currentStatus = statusText[status as keyof typeof statusText] || { rw: 'Byahinduwe', en: 'Updated' };

    const html = `
      <!DOCTYPE html>
      <html lang="rw">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Igisubizo ku bitekerezo - Rugalika News</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .response-box { 
            background-color: white; 
            padding: 20px; 
            margin: 20px 0; 
            border-left: 4px solid #2c5aa0;
          }
          .status { 
            display: inline-block; 
            padding: 5px 10px; 
            border-radius: 3px; 
            font-weight: bold;
            background-color: ${status === 'approved' ? '#d4edda' : '#f8d7da'};
            color: ${status === 'approved' ? '#155724' : '#721c24'};
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Rugalika News</h1>
            <p>Igisubizo ku bitekerezo / Feedback Response</p>
          </div>
          
          <div class="content">
            <h2>Ibitekerezo byanyu byasubijwe / Your feedback has been responded to</h2>
            
            <div class="response-box">
              <h3>Umutwe / Title: ${feedbackTitle}</h3>
              <p><strong>Uko bihagaze / Status:</strong> <span class="status">${currentStatus.rw} / ${currentStatus.en}</span></p>
              
              <h4>Igisubizo cy'ubuyobozi / Administrative Response:</h4>
              <p>${adminResponse}</p>
            </div>
            
            <p>Murakoze gutanga ibitekerezo. Dufite icyizere ko bizadufasha guteza imbere serivisi zacu.</p>
            <p>Thank you for your feedback. We hope this helps us improve our services.</p>
          </div>
          
          <div class="footer">
            <p>Rugalika Sector - Official News Portal</p>
            <p>Email: info@rugalika.gov.rw | Phone: +250 788 000 000</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  /**
   * Send help request update notification
   */
  async sendHelpRequestUpdateEmail(
    email: string,
    name: string,
    department: string,
    status: string,
    adminResponse?: string
  ): Promise<boolean> {
    const subject = `Rugalika News - Amakuru ku busabe bw'ubufasha / Help Request Update`;
    
    const statusText = {
      'in_progress': { rw: 'Biracyakozwe', en: 'In Progress' },
      'completed': { rw: 'Byarangiye', en: 'Completed' },
      'cancelled': { rw: 'Byahagaritswe', en: 'Cancelled' }
    };

    const currentStatus = statusText[status as keyof typeof statusText] || { rw: 'Byahinduwe', en: 'Updated' };

    const html = `
      <!DOCTYPE html>
      <html lang="rw">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Amakuru ku busabe - Rugalika News</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .update-box { 
            background-color: white; 
            padding: 20px; 
            margin: 20px 0; 
            border-left: 4px solid #2c5aa0;
          }
          .status { 
            display: inline-block; 
            padding: 5px 10px; 
            border-radius: 3px; 
            font-weight: bold;
            background-color: ${status === 'completed' ? '#d4edda' : status === 'cancelled' ? '#f8d7da' : '#fff3cd'};
            color: ${status === 'completed' ? '#155724' : status === 'cancelled' ? '#721c24' : '#856404'};
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Rugalika News</h1>
            <p>Amakuru ku busabe / Request Update</p>
          </div>
          
          <div class="content">
            <h2>Muraho ${name}!</h2>
            
            <div class="update-box">
              <h3>Busabe bwanyu bw'ubufasha bwahinduwe / Your help request has been updated</h3>
              <p><strong>Ishami / Department:</strong> ${department}</p>
              <p><strong>Uko bihagaze / Status:</strong> <span class="status">${currentStatus.rw} / ${currentStatus.en}</span></p>
              
              ${adminResponse ? `
                <h4>Igisubizo cy'ubuyobozi / Administrative Response:</h4>
                <p>${adminResponse}</p>
              ` : ''}
            </div>
            
            <p>Murakoze gusaba ubufasha. Turagushimira kwitabira ubuzima bwa Rugalika.</p>
            <p>Thank you for requesting help. We appreciate your participation in Rugalika community.</p>
          </div>
          
          <div class="footer">
            <p>Rugalika Sector - Official News Portal</p>
            <p>Email: info@rugalika.gov.rw | Phone: +250 788 000 000</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  /**
   * Send newsletter email
   */
  async sendNewsletterEmail(
    email: string,
    firstName: string,
    newsItems: Array<{ title: string; excerpt: string; url: string }>
  ): Promise<boolean> {
    const subject = 'Rugalika News - Amakuru Mashya / Latest News';
    
    const newsItemsHtml = newsItems.map(item => `
      <div style="border-bottom: 1px solid #eee; padding: 15px 0;">
        <h3 style="color: #2c5aa0; margin: 0 0 10px 0;">${item.title}</h3>
        <p style="margin: 0 0 10px 0;">${item.excerpt}</p>
        <a href="${item.url}" style="color: #2c5aa0; text-decoration: none;">Soma byose / Read more →</a>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="rw">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Amakuru Mashya - Rugalika News</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .news-container { background-color: white; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Rugalika News</h1>
            <p>Amakuru Mashya / Latest News</p>
          </div>
          
          <div class="content">
            <h2>Muraho ${firstName}!</h2>
            <p>Dore amakuru mashya yo muri Rugalika:</p>
            <p>Here are the latest news from Rugalika:</p>
            
            <div class="news-container">
              ${newsItemsHtml}
            </div>
            
            <p>Murakoze gukurikirana Rugalika News!</p>
            <p>Thank you for following Rugalika News!</p>
          </div>
          
          <div class="footer">
            <p>Rugalika Sector - Official News Portal</p>
            <p>Email: info@rugalika.gov.rw | Phone: +250 788 000 000</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('Email connection test failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
