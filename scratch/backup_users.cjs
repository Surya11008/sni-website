const fs = require('fs');
const path = require('path');
const https = require('https');

async function getRtdbUsers() {
  return new Promise((resolve, reject) => {
    https.get('https://sni-org-in-default-rtdb.firebaseio.com/users.json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

async function getFirestoreUsers() {
  return new Promise((resolve, reject) => {
    https.get('https://firestore.googleapis.com/v1/projects/sni-org-in/databases/(default)/documents/users?pageSize=300&key=AIzaSyB0ZL4r72-G6XCapKvjA-cbOWJbjC9dNuI', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

async function backup() {
  const rtdb = await getRtdbUsers();
  const firestore = await getFirestoreUsers();

  const backupData = {
    timestamp: new Date().toISOString(),
    rtdbUsers: rtdb,
    firestoreUsers: firestore
  };

  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const backupFile = path.join(backupDir, `users_backup_${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
  console.log(`Successfully backed up users to: ${backupFile}`);
  console.log(`RTDB count: ${rtdb ? Object.keys(rtdb).length : 0}, Firestore count: ${firestore?.documents?.length || 0}`);
}

backup();
