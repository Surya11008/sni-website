const fs = require('fs');

const file = 'C:/Users/Zion/.gemini/antigravity/scratch/star-galaxy/src/data/initialData.js';
const content = fs.readFileSync(file, 'utf8');
const startIdx = content.indexOf('"users": [');
const endIdx = content.indexOf('],\n  "managerPermissions":');

if (startIdx !== -1 && endIdx !== -1) {
  const adminObj = `"users": [
  {
    "id": "surya11008",
    "nickname": "Admin",
    "username": "surya11008",
    "status": "approved",
    "name": "Admin (Surya)",
    "password": "Suri742766.",
    "pin": "1234",
    "place": "Headquarters Admin",
    "personalPin": "742766",
    "phone": "surya11008",
    "hasSetPersonalPin": true,
    "moreDetails": "Headquarters Admin",
    "createdAt": "2026-10-01",
    "contact": "surya11008",
    "role": "ADMIN",
    "contactVerified": true,
    "isVerified": true
  }
`;
  const newContent = content.substring(0, startIdx) + adminObj + content.substring(endIdx);
  fs.writeFileSync(file, newContent, 'utf8');
  console.log('Successfully updated initialData.js users array!');
} else {
  console.log('Could not find start or end index:', startIdx, endIdx);
}
