const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const HTML_FILES = [
    'ui_projects',
    'ui_board',
    'ui_backlog',
    'ui_issue_detail',
    'ui_project_members',
    'ui_sprints',
    'ui_sprint_summary',
    'ui_complete_sprint',
    'ui_activity',
    'ui_custom_statuses',
    'ui_project_settings',
    'ui_org_dashboard'
];

async function convertHtmlToPng() {
    console.log('Converting HTML wireframes to PNG images...\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    for (const fileName of HTML_FILES) {
        const htmlFile = `${fileName}.html`;
        const pngFile = `${fileName}.png`;
        const htmlPath = path.join(__dirname, htmlFile);

        if (!fs.existsSync(htmlPath)) {
            console.log(`✗ File not found: ${htmlFile}`);
            continue;
        }

        try {
            const page = await browser.newPage();
            await page.setViewport({ width: 1400, height: 900 });
            await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

            await page.screenshot({
                path: path.join(__dirname, pngFile),
                fullPage: true
            });

            console.log(`✓ Created ${pngFile}`);
            await page.close();
        } catch (error) {
            console.log(`✗ Failed to create ${pngFile}: ${error.message}`);
        }
    }

    await browser.close();
    console.log('\nDone! Check the images directory for PNG files.');
}

convertHtmlToPng().catch(console.error);
