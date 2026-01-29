
import dotenv from 'dotenv';
import emailService from './utils/emailService';

dotenv.config();

console.log('--- STARTING EMAIL TEST ---');
console.log('Current Working Directory:', process.cwd());
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('EMAIL_PASSWORD length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 'MISSING');

async function testEmail() {
    console.log('Attempting to send email...');
    try {
        await emailService.sendEmail({
            to: process.env.EMAIL_FROM as string, // Send to self
            subject: 'Test Email from Student Attendance System ' + new Date().toISOString(),
            html: '<h1>It Works!</h1><p>Expected email sending functionality is operational.</p>'
        });
        console.log('✅✅✅ EMAIL SENT SUCCESSFULLY ✅✅✅');
    } catch (error: any) {
        console.error('❌❌❌ EMAIL FAILED ❌❌❌');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Full Error:', error);
    }
    console.log('--- END EMAIL TEST ---');
}

testEmail();
