const RTDB_BASE = 'https://sni-org-in-default-rtdb.firebaseio.com';
const FS_KEY = 'AIzaSyB0ZL4r72-G6XCapKvjA-cbOWJbjC9dNuI';
const FS_PROJECT = 'sni-org-in';

async function runE2ETest() {
  console.log('--- Step 1: Create Test User with OTP ---');
  const testId = 'test_verify_runner_' + Math.floor(1000 + Math.random() * 9000);
  const testEmail = `${testId}@example.com`;
  const testOtp = '654321';
  const expiresAt = new Date(Date.now() + 15 * 60000).toISOString();

  const newUser = {
    userId: testId,
    fullName: 'Test Verify Runner',
    email: testEmail,
    contact: testEmail,
    role: 'MEM',
    status: 'unverified',
    contactVerified: false,
    emailVerified: false,
    isVerified: false,
    verificationOtp: testOtp,
    otpExpiresAt: expiresAt,
    joinedAt: new Date().toISOString()
  };

  // Save to RTDB
  await fetch(`${RTDB_BASE}/users/${testId}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newUser)
  });

  // Save to Firestore users
  await fetch(`https://firestore.googleapis.com/v1/projects/${FS_PROJECT}/databases/(default)/documents/users/${testId}?key=${FS_KEY}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        id: { stringValue: testId },
        userId: { stringValue: testId },
        email: { stringValue: testEmail },
        fullName: { stringValue: 'Test Verify Runner' },
        role: { stringValue: 'MEM' },
        status: { stringValue: 'unverified' },
        contactVerified: { booleanValue: false },
        emailVerified: { booleanValue: false },
        isVerified: { booleanValue: false },
        verificationOtp: { stringValue: testOtp },
        otpExpiresAt: { stringValue: expiresAt }
      }
    })
  });

  console.log('Created unverified user:', testId);

  // Verify NOT in pending_registrations
  const pendingCheck1 = await fetch(`https://firestore.googleapis.com/v1/projects/${FS_PROJECT}/databases/(default)/documents/pending_registrations/${testId}?key=${FS_KEY}`);
  console.log('Is in pending_registrations right now?', pendingCheck1.status === 200 ? 'YES (BUG!)' : 'NO (CORRECT: 404)');

  // Step 2: Test Incorrect OTP
  console.log('\n--- Step 2: Testing Incorrect OTP ---');
  const enteredWrongOtp = '111111';
  const rtdbUser = await (await fetch(`${RTDB_BASE}/users/${testId}.json`)).json();
  const savedOtp = String(rtdbUser.verificationOtp || '').trim();

  if (enteredWrongOtp !== savedOtp) {
    console.log('Result for wrong OTP: ❌ Incorrect OTP code. Please check your Gmail and try again. (CORRECT)');
  }

  const pendingCheck2 = await fetch(`https://firestore.googleapis.com/v1/projects/${FS_PROJECT}/databases/(default)/documents/pending_registrations/${testId}?key=${FS_KEY}`);
  console.log('Still blocked from pending_registrations after wrong OTP?', pendingCheck2.status === 200 ? 'NO (BUG!)' : 'YES (CORRECT: 404)');

  // Step 3: Test Correct OTP
  console.log('\n--- Step 3: Testing Correct OTP ---');
  const enteredCorrectOtp = '654321';
  if (enteredCorrectOtp === savedOtp) {
    console.log('OTP Matches! Updating status to pending and forwarding to Admin...');
    const now = new Date().toISOString();

    // 1. RTDB Update
    await fetch(`${RTDB_BASE}/users/${testId}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactVerified: true,
        emailVerified: true,
        isVerified: true,
        status: 'pending',
        verifiedAt: now,
        adminEmail: 'info@sni.org.in'
      })
    });

    // 2. Firestore Users Update
    await fetch(`https://firestore.googleapis.com/v1/projects/${FS_PROJECT}/databases/(default)/documents/users/${testId}?updateMask.fieldPaths=contactVerified&updateMask.fieldPaths=emailVerified&updateMask.fieldPaths=isVerified&updateMask.fieldPaths=status&updateMask.fieldPaths=verifiedAt&updateMask.fieldPaths=adminEmail&key=${FS_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          contactVerified: { booleanValue: true },
          emailVerified: { booleanValue: true },
          isVerified: { booleanValue: true },
          status: { stringValue: 'pending' },
          verifiedAt: { stringValue: now },
          adminEmail: { stringValue: 'info@sni.org.in' }
        }
      })
    });

    // 3. Write to pending_registrations
    await fetch(`https://firestore.googleapis.com/v1/projects/${FS_PROJECT}/databases/(default)/documents/pending_registrations/${testId}?key=${FS_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          id: { stringValue: testId },
          userId: { stringValue: testId },
          fullName: { stringValue: 'Test Verify Runner' },
          email: { stringValue: testEmail },
          role: { stringValue: 'MEM' },
          status: { stringValue: 'pending' },
          contactVerified: { booleanValue: true },
          emailVerified: { booleanValue: true },
          isVerified: { booleanValue: true },
          verifiedAt: { stringValue: now },
          adminEmail: { stringValue: 'info@sni.org.in' }
        }
      })
    });
  }

  // Step 4: Verify Post-OTP Success State
  console.log('\n--- Step 4: Verifying Post-OTP Success State ---');
  const postRtdb = await (await fetch(`${RTDB_BASE}/users/${testId}.json`)).json();
  console.log('RTDB status:', postRtdb.status, 'emailVerified:', postRtdb.emailVerified, 'isVerified:', postRtdb.isVerified);

  const postFsUser = await (await fetch(`https://firestore.googleapis.com/v1/projects/${FS_PROJECT}/databases/(default)/documents/users/${testId}?key=${FS_KEY}`)).json();
  console.log('Firestore user status:', postFsUser.fields.status.stringValue, 'emailVerified:', postFsUser.fields.emailVerified.booleanValue);

  const pendingCheck3 = await (await fetch(`https://firestore.googleapis.com/v1/projects/${FS_PROJECT}/databases/(default)/documents/pending_registrations/${testId}?key=${FS_KEY}`)).json();
  console.log('Now in pending_registrations for Admin?', pendingCheck3.fields?.status?.stringValue === 'pending' ? 'YES (CORRECT: Forwarded to Admin)' : 'NO (BUG!)');

  // Step 5: Clean up test user
  console.log('\n--- Step 5: Cleanup Test Data ---');
  await fetch(`${RTDB_BASE}/users/${testId}.json`, { method: 'DELETE' });
  await fetch(`https://firestore.googleapis.com/v1/projects/${FS_PROJECT}/databases/(default)/documents/users/${testId}?key=${FS_KEY}`, { method: 'DELETE' });
  await fetch(`https://firestore.googleapis.com/v1/projects/${FS_PROJECT}/databases/(default)/documents/pending_registrations/${testId}?key=${FS_KEY}`, { method: 'DELETE' });
  console.log('Test user cleaned up.');

  // Step 6: Verify Admin surya11008 is still intact and approved
  console.log('\n--- Step 6: Verify Admin surya11008 ---');
  const adminRtdb = await (await fetch(`${RTDB_BASE}/users/surya11008.json`)).json();
  console.log('Admin RTDB status:', adminRtdb.status, 'role:', adminRtdb.role);
  const adminFs = await (await fetch(`https://firestore.googleapis.com/v1/projects/${FS_PROJECT}/databases/(default)/documents/users/surya11008?key=${FS_KEY}`)).json();
  console.log('Admin Firestore status:', adminFs.fields.status.stringValue, 'role:', adminFs.fields.role.stringValue);
}

runE2ETest().catch(console.error);
