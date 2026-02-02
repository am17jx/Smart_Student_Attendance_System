
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    try {
        console.log('🚀 Launching Puppeteer...');
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        console.log('📄 Creating new page...');
        const page = await browser.newPage();

        console.log('📝 Setting content (Arabic test)...');
        await page.setContent(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head><meta charset="UTF-8"><style>body{font-family:sans-serif;}</style></head>
      <body><h1>مرحباً بكم</h1><p>تجرية توليد ملف PDF باللغة العربية.</p></body>
      </html>
    `);

        console.log('🖨️  Generating PDF...');
        const pdfBuffer = await page.pdf({ format: 'A4' });

        await browser.close();

        const outputPath = path.join(__dirname, 'test-output.pdf');
        fs.writeFileSync(outputPath, pdfBuffer);

        console.log(`✅ Success! PDF saved to: ${outputPath}`);
        console.log(`📦 Size: ${pdfBuffer.length} bytes`);

    } catch (error) {
        console.error('❌ Error testing puppeteer:', error);
        process.exit(1);
    }
})();
