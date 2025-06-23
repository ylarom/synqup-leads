import nodemailer from 'nodemailer';
import { storage } from '../storage';
import { MessageWithDetails } from '@shared/schema';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || 'your-app-password',
      },
    });
  }

  async sendEmail(message: MessageWithDetails): Promise<boolean> {
    try {
      if (message.media !== 'email') {
        throw new Error('Message medium is not email');
      }

      if (!message.person?.email) {
        throw new Error('Person email not available');
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM || 'CRM System <noreply@yourcompany.com>',
        to: message.address || message.person.email,
        subject: message.subject || 'Message from CRM System',
        text: this.stripHtml(message.content),
        html: this.formatEmailContent(message.content, message.person),
      };

      console.log(`Sending email to ${mailOptions.to}: ${mailOptions.subject}`);
      
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('Email sent successfully:', info.messageId);
      
      // Update message status to sent
      await storage.updateMessage(message.id, {
        status: 'sent',
        sentAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Update message status to failed
      await storage.updateMessage(message.id, {
        status: 'failed',
      });
      
      return false;
    }
  }

  private formatEmailContent(content: string, person: any): string {
    // Convert line breaks to HTML
    const htmlContent = content.replace(/\n/g, '<br>');
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Message</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      border-bottom: 2px solid #1976D2;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .content {
      margin-bottom: 30px;
    }
    .footer {
      font-size: 12px;
      color: #666;
      border-top: 1px solid #eee;
      padding-top: 20px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="color: #1976D2; margin: 0;">CRM System</h2>
  </div>
  
  <div class="content">
    ${htmlContent}
  </div>
  
  <div class="footer">
    <p>This message was sent via CRM System. If you'd like to unsubscribe or have questions, please contact us.</p>
  </div>
</body>
</html>
`;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
  }

  async sendPendingEmails(): Promise<void> {
    try {
      console.log('Processing pending email messages...');
      
      const pendingMessages = await storage.getMessagesByStatus('to_send');
      const emailMessages = pendingMessages.filter(msg => msg.media === 'email');
      
      console.log(`Found ${emailMessages.length} email messages to send`);
      
      for (const message of emailMessages) {
        try {
          await this.sendEmail(message);
          console.log(`Successfully sent email to ${message.person?.firstName} ${message.person?.lastName}`);
          
          // Add delay between emails to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Failed to send email to ${message.person?.firstName} ${message.person?.lastName}:`, error);
        }
      }
      
      console.log('Finished processing pending emails');
    } catch (error) {
      console.error('Error processing pending emails:', error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service connection verified');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
