require('dotenv').config();

const apiKey = process.env.BREVO_API_KEY;
const fromEmail = process.env.EMAIL_FROM;

console.log('Testing Brevo API...');
console.log('API Key starts with:', apiKey ? apiKey.substring(0, 15) + '...' : 'NOT SET');
console.log('From email:', fromEmail);

fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'api-key': apiKey,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    sender: { name: 'Smart Attendance', email: fromEmail },
    to: [{ email: fromEmail }],
    subject: 'Brevo API Test - System Attendance',
    htmlContent: '<h2>Test Success!</h2><p>Brevo API is working correctly.</p>',
  }),
})
.then(r => r.json())
.then(data => {
  console.log('Response:', JSON.stringify(data));
  if (data.messageId) {
    console.log('SUCCESS - Email sent! MessageID:', data.messageId);
  } else {
    console.log('FAILED - No messageId in response');
  }
})
.catch(err => console.error('Error:', err.message));
