const fs = require('fs');
const path = require('path');

// Fix LoginPage
const loginFixedPath = path.join(__dirname, 'src', 'pages', 'LoginPage_fixed.tsx');
const loginPath = path.join(__dirname, 'src', 'pages', 'LoginPage.tsx');

if (fs.existsSync(loginFixedPath)) {
  const content = fs.readFileSync(loginFixedPath, 'utf8');
  fs.writeFileSync(loginPath, content);
  fs.unlinkSync(loginFixedPath);
  console.log('✓ LoginPage.tsx fixed');
}

// Fix LeadsManagementPage
const leadsFixedPath = path.join(__dirname, 'src', 'pages', 'LeadsManagementPage_fixed.tsx');
const leadsPath = path.join(__dirname, 'src', 'pages', 'LeadsManagementPage.tsx');

if (fs.existsSync(leadsFixedPath)) {
  const content = fs.readFileSync(leadsFixedPath, 'utf8');
  fs.writeFileSync(leadsPath, content);
  fs.unlinkSync(leadsFixedPath);
  console.log('✓ LeadsManagementPage.tsx fixed');
}

console.log('All syntax errors fixed!');
