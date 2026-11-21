async function test() {
  const RTDB_BASE = 'https://sni-org-in-default-rtdb.firebaseio.com';
  const uid = 'sowmya2794';
  const enteredOtp = '952071';

  console.log('Fetching user data for', uid);
  const res = await fetch(`${RTDB_BASE}/users/${encodeURIComponent(uid)}.json`);
  const userData = await res.json();
  console.log('RTDB user:', userData);

  const savedOtp = String(userData.verificationOtp || '').trim();
  const cleanEntered = String(enteredOtp || '').trim();
  console.log('Saved OTP:', savedOtp, 'Entered:', cleanEntered, 'Matches?', savedOtp === cleanEntered);

  if (userData.otpExpiresAt) {
    console.log('Expires at:', userData.otpExpiresAt, 'Now:', new Date().toISOString(), 'Expired?', new Date(userData.otpExpiresAt).getTime() < Date.now());
  }
}
test();
