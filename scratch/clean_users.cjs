const https = require('https');

const RTDB_BASE = 'https://sni-org-in-default-rtdb.firebaseio.com';
const FS_KEY = 'AIzaSyB0ZL4r72-G6XCapKvjA-cbOWJbjC9dNuI';
const FS_PROJECT = 'sni-org-in';

function request(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOptions = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function cleanUsers() {
  console.log('=== Step 1: Cleaning Realtime Database Users ===');
  const rtdbRes = await request(`${RTDB_BASE}/users.json`);
  if (rtdbRes.data && typeof rtdbRes.data === 'object') {
    const rtdbKeys = Object.keys(rtdbRes.data);
    console.log(`Found ${rtdbKeys.length} users in RTDB.`);
    for (const key of rtdbKeys) {
      const cleanKey = key.trim().toLowerCase();
      if (cleanKey === 'surya11008') {
        console.log(`Preserving RTDB Admin: ${key}`);
        continue;
      }
      console.log(`Deleting RTDB user: ${key}`);
      await request(`${RTDB_BASE}/users/${encodeURIComponent(key)}.json`, { method: 'DELETE' });
    }
  }

  // Ensure Admin is configured correctly in RTDB
  const adminRtdb = {
    userId: 'surya11008',
    fullName: 'Admin (Surya)',
    username: 'surya11008',
    contact: 'surya11008',
    phone: 'surya11008',
    role: 'ADMIN',
    status: 'approved',
    password: 'Suri742766.',
    plainPassword: 'Suri742766.',
    contactVerified: true,
    isVerified: true,
    joinedAt: new Date().toISOString()
  };
  await request(`${RTDB_BASE}/users/surya11008.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  }, adminRtdb);
  console.log('Admin user verified in RTDB: surya11008');

  console.log('\n=== Step 2: Cleaning Cloud Firestore Users ===');
  const fsRes = await request(`https://firestore.googleapis.com/v1/projects/${FS_PROJECT}/databases/(default)/documents/users?pageSize=300&key=${FS_KEY}`);
  if (fsRes.data && Array.isArray(fsRes.data.documents)) {
    console.log(`Found ${fsRes.data.documents.length} users in Firestore.`);
    for (const doc of fsRes.data.documents) {
      const docPath = doc.name; // projects/sni-org-in/databases/(default)/documents/users/<id>
      const docId = docPath.split('/').pop();
      const cleanId = docId.trim().toLowerCase();
      
      // Preserve admin doc
      if (cleanId === 'surya11008') {
        console.log(`Preserving Firestore Admin: ${docId}`);
        continue;
      }

      console.log(`Deleting Firestore user: ${docId}`);
      await request(`https://firestore.googleapis.com/v1/${docPath}?key=${FS_KEY}`, { method: 'DELETE' });
    }
  }

  // Ensure Admin is configured in Firestore
  const adminFirestore = {
    fields: {
      id: { stringValue: 'surya11008' },
      userId: { stringValue: 'surya11008' },
      username: { stringValue: 'surya11008' },
      fullName: { stringValue: 'Admin (Surya)' },
      name: { stringValue: 'Admin (Surya)' },
      role: { stringValue: 'ADMIN' },
      status: { stringValue: 'approved' },
      password: { stringValue: 'Suri742766.' },
      plainPassword: { stringValue: 'Suri742766.' },
      contact: { stringValue: 'surya11008' },
      phone: { stringValue: 'surya11008' },
      contactVerified: { booleanValue: true },
      isVerified: { booleanValue: true },
      createdAt: { stringValue: new Date().toISOString() },
      registeredAt: { stringValue: new Date().toISOString() }
    }
  };

  await request(`https://firestore.googleapis.com/v1/projects/${FS_PROJECT}/databases/(default)/documents/users/surya11008?key=${FS_KEY}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, adminFirestore);
  console.log('Admin user verified in Firestore: surya11008');

  // Also clear pending_registrations collection in Firestore if any
  try {
    const pendingRes = await request(`https://firestore.googleapis.com/v1/projects/${FS_PROJECT}/databases/(default)/documents/pending_registrations?pageSize=300&key=${FS_KEY}`);
    if (pendingRes.data && Array.isArray(pendingRes.data.documents)) {
      console.log(`Cleaning ${pendingRes.data.documents.length} pending_registrations docs...`);
      for (const pDoc of pendingRes.data.documents) {
        await request(`https://firestore.googleapis.com/v1/${pDoc.name}?key=${FS_KEY}`, { method: 'DELETE' });
      }
    }
  } catch(e) {}

  console.log('\n=== Cleanup Complete! Only surya11008 remains in database. ===');
}

cleanUsers().catch(err => {
  console.error('Error during cleanup:', err);
});
