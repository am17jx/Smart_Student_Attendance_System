import logger from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {

  /**
   * Send email via Brevo REST API (port 443 - never blocked by cloud providers)
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      logger.error('BREVO_API_KEY is not set in environment variables');
      throw new Error('Email service not configured');
    }

    const payload = {
      sender: {
        name: process.env.EMAIL_FROM_NAME || 'نظام الحضور الإلكتروني',
        email: process.env.EMAIL_FROM || 'ameerahmed0780@gmail.com',
      },
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.html,
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`Brevo API error: ${response.status} - ${errorBody}`);
      throw new Error('Failed to send email');
    }

    logger.info(`✅ Email sent to ${options.to} via Brevo API`);
  }

  /**
   * Send welcome email to new student
   */
  async sendWelcomeEmail(studentEmail: string, studentName: string, temporaryPassword: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { padding: 20px; line-height: 1.8; }
          .password-box { background: #f8f9fa; border-right: 4px solid #667eea; padding: 15px; margin: 20px 0; font-family: monospace; font-size: 18px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 مرحباً بك في نظام الحضور الذكي</h1>
          </div>
          <div class="content">
            <h2>مرحباً ${studentName}،</h2>
            <p>تم إنشاء حسابك بنجاح في نظام الحضور الإلكتروني.</p>
            
            <p><strong>كلمة المرور المؤقتة:</strong></p>
            <div class="password-box">
              ${temporaryPassword}
            </div>
            
            <p style="color: #d9534f; font-weight: bold;">⚠️ يجب عليك تغيير كلمة المرور عند تسجيل الدخول الأول</p>
            
            <p><strong>البريد الإلكتروني:</strong> ${studentEmail}</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/student/login" class="button">تسجيل الدخول الآن</a>
            
            <p>إذا لم تقم بإنشاء هذا الحساب، يرجى تجاهل هذه الرسالة.</p>
          </div>
          <div class="footer">
            <p>نظام الحضور الإلكتروني - Privacy-Preserving Student Attendance</p>
            <p>هذا البريد تم إرساله تلقائياً، يرجى عدم الرد عليه</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: studentEmail,
      subject: '🎓 مرحباً بك - كلمة المرور المؤقتة',
      html,
    });
  }

  /**
   * Send temporary password notification
   */
  async sendTempPasswordEmail(email: string, name: string, temporaryPassword: string, isNewAccount: boolean = false): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { padding: 20px; line-height: 1.8; }
          .password-box { background: #f8f9fa; border-right: 4px solid #667eea; padding: 15px; margin: 20px 0; font-family: monospace; font-size: 18px; text-align: center; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isNewAccount ? '🎉 مرحباً بك في نظامنا' : '🔐 تحديث كلمة المرور'}</h1>
          </div>
          <div class="content">
            <h2>مرحباً ${name}،</h2>
            <p>${isNewAccount ? 'تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول باستخدام البيانات التالية:' : 'تم تعيين كلمة مرور مؤقتة جديدة لحسابك بناءً على طلب المسؤول:'}</p>
            
            <div class="password-box">
              <strong>كلمة المرور:</strong> ${temporaryPassword}
            </div>
            
            <p style="color: #d9534f; font-weight: bold;">⚠️ يرجى تغيير كلمة المرور فور تسجيل الدخول للحفاظ على أمان حسابك.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/login" class="button">تسجيل الدخول</a>
          </div>
          <div class="footer">
            <p>نظام الحضور والغياب الذكي</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: isNewAccount ? '🎉 بيانات حسابك الجديد' : '🔐 إشعار تعيين كلمة مرور جديدة',
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(studentEmail: string, studentName: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/student/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { padding: 20px; line-height: 1.8; }
          .button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border-right: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 إعادة تعيين كلمة المرور</h1>
          </div>
          <div class="content">
            <h2>مرحباً ${studentName}،</h2>
            <p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
            
            <p>انقر على الزر أدناه لإعادة تعيين كلمة المرور:</p>
            
            <a href="${resetUrl}" class="button">إعادة تعيين كلمة المرور</a>
            
            <div class="warning">
              <strong>⏰ تنبيه:</strong> هذا الرابط صالح لمدة 30 دقيقة فقط
            </div>
            
            <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة. حسابك آمن.</p>
            
            <p style="color: #666; font-size: 12px;">إذا لم يعمل الزر، انسخ الرابط التالي والصقه في المتصفح:<br>
            <code style="background: #f4f4f4; padding: 5px; display: block; margin-top: 10px;">${resetUrl}</code></p>
          </div>
          <div class="footer">
            <p>نظام الحضور الإلكتروني - Privacy-Preserving Student Attendance</p>
            <p>هذا البريد تم إرساله تلقائياً، يرجى عدم الرد عليه</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: studentEmail,
      subject: '🔐 إعادة تعيين كلمة المرور',
      html,
    });
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(studentEmail: string, studentName: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/student/verify-email?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { padding: 20px; line-height: 1.8; }
          .button { display: inline-block; background: #00f2fe; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✉️ تأكيد البريد الإلكتروني</h1>
          </div>
          <div class="content">
            <h2>مرحباً ${studentName}،</h2>
            <p>شكراً لتسجيلك في نظام الحضور الإلكتروني!</p>
            
            <p>يرجى تأكيد بريدك الإلكتروني بالنقر على الزر أدناه:</p>
            
            <a href="${verificationUrl}" class="button">تأكيد البريد الإلكتروني</a>
            
            <p>بعد التأكيد، ستتمكن من استخدام جميع ميزات النظام.</p>
          </div>
          <div class="footer">
            <p>نظام الحضور الإلكتروني - Privacy-Preserving Student Attendance</p>
            <p>هذا البريد تم إرساله تلقائياً، يرجى عدم الرد عليه</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: studentEmail,
      subject: '✉️ تأكيد البريد الإلكتروني',
      html,
    });
  }

  /**
   * Send login notification email
   */
  async sendLoginNotification(studentEmail: string, studentName: string, loginTime: Date, ipAddress?: string): Promise<void> {
    const changePasswordUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/student/change-password`;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { padding: 20px; line-height: 1.8; }
          .info-box { background: #e7f3ff; border-right: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 تنبيه تسجيل دخول جديد</h1>
          </div>
          <div class="content">
            <h2>مرحباً ${studentName}،</h2>
            <p>تم تسجيل دخول جديد إلى حسابك:</p>
            
            <div class="info-box">
              <p><strong>⏰ الوقت:</strong> ${loginTime.toLocaleString('ar-IQ')}</p>
              ${ipAddress ? `<p><strong>🌐 عنوان IP:</strong> ${ipAddress}</p>` : ''}
            </div>
            
            <p>إذا لم تكن أنت من قام بتسجيل الدخول، يرجى تغيير كلمة المرور فوراً:</p>
            
            <a href="${changePasswordUrl}" class="button">تغيير كلمة المرور</a>
            
            <p style="color: #666; font-size: 14px;">💡 نوصي بتغيير كلمة المرور بشكل دوري للحفاظ على أمان حسابك.</p>
          </div>
          <div class="footer">
            <p>نظام الحضور الإلكتروني - Privacy-Preserving Student Attendance</p>
            <p>هذا البريد تم إرساله تلقائياً، يرجى عدم الرد عليه</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: studentEmail,
      subject: '🔔 تنبيه: تسجيل دخول جديد إلى حسابك',
      html,
    });
  }
}

export default new EmailService();
