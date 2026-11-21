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
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function getFirestoreUsers() {
  return new Promise((resolve, reject) => {
    https.get('https://firestore.googleapis.com/v1/projects/sni-org-in/databases/(default)/documents/users?key=AIzaSyB0ZL4r72-G6XCapKvjA-cbOWJbjC9dNuI', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  const rtdb = await getRtdbUsers();
  console.log('RTDB Users Count:', rtdb ? Object.keys(rtdb).length : 0);
  if (rtdb) {
    Object.keys(rtdb).forEach(k => console.log('RTDB user:', k, rtdb[k].role, rtdb[k].fullName || rtdb[k].name));
  }
  const fs = await getFirestoreUsers();
  console.log('Firestore Users Count:', fs && fs.documents ? fs.documents.length : 0);
  if (fs && fs.documents) {
    fs.documents.forEach(d => {
      const id = d.name.split('/').pop();
      const role = d.fields && d.fields.role ? d.fields.role.stringValue : 'none';
      const name = d.fields && (d.fields.fullName || d.fields.name) ? (d.fields.fullName || d.fields.name).stringValue : id;
      console.log('Firestore user:', id, role, name);
    });
  }
}

run();
