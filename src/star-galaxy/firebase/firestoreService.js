import { db, isFirebaseConfigured } from './firebaseConfig';
import { getPostSortTime } from '../utils/dateUtils';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

/**
 * Sanitize objects to prevent Firestore errors caused by undefined values
 */
export function sanitizeForFirestore(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = Array.isArray(obj) ? [] : {};
  Object.keys(obj).forEach(key => {
    const val = obj[key];
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
        clean[key] = sanitizeForFirestore(val);
      } else {
        clean[key] = val;
      }
    }
  });
  return clean;
}

/**
 * Sync Users Collection
 */
export function subscribeUsers(onUpdate) {
  if (!isFirebaseConfigured() || !db) return () => {};
  try {
    const colRef = collection(db, 'users');
    return onSnapshot(colRef, (snapshot) => {
      const users = [];
      snapshot.forEach(docSnap => users.push({ id: docSnap.id, ...docSnap.data() }));
      onUpdate(users);
    }, (err) => console.error('Firestore users error:', err));
  } catch (e) {
    console.error('Failed to subscribe users:', e);
    return () => {};
  }
}

export async function saveUserToFirestore(user) {
  if (!isFirebaseConfigured() || !db || !user?.id) return false;
  try {
    const cleanUser = sanitizeForFirestore(user);
    await setDoc(doc(db, 'users', user.id), cleanUser, { merge: true });

    // Guarantee manager role in dedicated manager_roles collection
    if (user.role === 'manager') {
      await setDoc(doc(db, 'manager_roles', user.id), {
        id: user.id,
        isManager: true,
        assignedMembers: Array.isArray(user.assignedMembers) ? user.assignedMembers : [],
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } else if (user.role === 'member') {
      await deleteDoc(doc(db, 'manager_roles', user.id)).catch(() => {});
    }

    return true;
  } catch (e) {
    console.error('Error saving user to Firestore:', e);
    return false;
  }
}

export async function saveManagerRoleToFirestore(userId, isManager, assignedMembers = []) {
  if (!isFirebaseConfigured() || !db || !userId) return false;
  try {
    if (isManager) {
      await setDoc(doc(db, 'manager_roles', userId), {
        id: userId,
        isManager: true,
        assignedMembers: Array.isArray(assignedMembers) ? assignedMembers : [],
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } else {
      await deleteDoc(doc(db, 'manager_roles', userId)).catch(() => {});
    }
    return true;
  } catch (e) {
    console.error('Error saving manager role to Firestore:', e);
    return false;
  }
}

export async function removeManagerRoleFromFirestore(userId) {
  return saveManagerRoleToFirestore(userId, false);
}

export function subscribeManagerRoles(onUpdate) {
  if (!isFirebaseConfigured() || !db) return () => {};
  try {
    const colRef = collection(db, 'manager_roles');
    return onSnapshot(colRef, (snapshot) => {
      const mgrList = [];
      snapshot.forEach(docSnap => mgrList.push({ id: docSnap.id, ...docSnap.data() }));
      onUpdate(mgrList);
    }, (err) => console.error('Firestore manager roles subscribe error:', err));
  } catch (e) {
    return () => {};
  }
}

export async function savePendingRegistrationToFirestore(user) {
  if (!isFirebaseConfigured() || !db || !user?.id) return false;
  try {
    // Check if this user is already approved in approved_registrations or users
    const approvedSnap = await getDoc(doc(db, 'approved_registrations', user.id)).catch(() => null);
    if (approvedSnap && approvedSnap.exists()) {
      return false; // Already approved! Do not re-pend!
    }

    const userSnap = await getDoc(doc(db, 'users', user.id)).catch(() => null);
    if (userSnap && userSnap.exists() && userSnap.data()?.status === 'approved') {
      return false;
    }

    const cleanUser = sanitizeForFirestore(user);
    // 1. Save in 'users' collection with status 'pending'
    await setDoc(doc(db, 'users', user.id), cleanUser, { merge: true });
    // 2. Also save in dedicated 'pending_registrations' collection for guaranteed redundancy
    await setDoc(doc(db, 'pending_registrations', user.id), cleanUser, { merge: true });
    return true;
  } catch (e) {
    console.error('Error saving pending registration to Firestore:', e);
    return false;
  }
}

export async function markRegistrationApprovedInFirestore(userId) {
  if (!isFirebaseConfigured() || !db || !userId) return false;
  try {
    // 1. Mark status 'approved' in users collection
    await setDoc(doc(db, 'users', userId), { status: 'approved' }, { merge: true });
    // 2. Permanently record in approved_registrations collection so it can never be re-pended
    await setDoc(doc(db, 'approved_registrations', userId), {
      id: userId,
      status: 'approved',
      approvedAt: new Date().toISOString(),
    }, { merge: true });
    // 3. Delete from pending_registrations
    await deleteDoc(doc(db, 'pending_registrations', userId)).catch(() => {});
    return true;
  } catch (e) {
    console.error('Error marking registration approved in Firestore:', e);
    return false;
  }
}

export function subscribePendingRegistrations(onUpdate) {
  if (!isFirebaseConfigured() || !db) return () => {};
  try {
    const colRef = collection(db, 'pending_registrations');
    return onSnapshot(colRef, (snapshot) => {
      const pendingList = [];
      snapshot.forEach(docSnap => pendingList.push({ id: docSnap.id, ...docSnap.data() }));
      onUpdate(pendingList);
    }, (err) => console.error('Firestore pending registrations error:', err));
  } catch (e) {
    console.error('Failed to subscribe pending registrations:', e);
    return () => {};
  }
}

export async function removePendingRegistrationFromFirestore(userId) {
  if (!isFirebaseConfigured() || !db || !userId) return false;
  try {
    await deleteDoc(doc(db, 'pending_registrations', userId)).catch(() => {});
    await setDoc(doc(db, 'approved_registrations', userId), {
      id: userId,
      status: 'approved',
      approvedAt: new Date().toISOString(),
    }, { merge: true }).catch(() => {});
    return true;
  } catch (e) {
    return false;
  }
}

export async function getPendingRegistrationsFromFirestore() {
  if (!isFirebaseConfigured() || !db) return [];
  try {
    const colRef = collection(db, 'pending_registrations');
    const snap = await getDocs(colRef);
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    return list;
  } catch (e) {
    console.error('Error getting pending registrations:', e);
    return [];
  }
}

export async function getAllUsersFromFirestore() {
  if (!isFirebaseConfigured() || !db) return [];
  try {
    const colRef = collection(db, 'users');
    const snap = await getDocs(colRef);
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    return list;
  } catch (e) {
    console.error('Error getting all users:', e);
    return [];
  }
}

export async function deleteUserFromFirestore(userId) {
  if (!isFirebaseConfigured() || !db || !userId) return false;
  try {
    await deleteDoc(doc(db, 'users', userId));
    await deleteDoc(doc(db, 'pending_registrations', userId)).catch(() => {});
    return true;
  } catch (e) {
    console.error('Error deleting user from Firestore:', e);
    return false;
  }
}

/**
 * Sync User-Isolated Activities Data (100% Confidential to Active Member)
 */
export function subscribeUserActivities(userId, onUpdate) {
  if (!isFirebaseConfigured() || !db || !userId) return () => {};
  try {
    const docRef = doc(db, 'activities', userId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data());
      }
    }, (err) => console.error('Firestore user activities error:', err));
  } catch (e) {
    console.error('Failed to subscribe user activities:', e);
    return () => {};
  }
}

export function subscribeAllActivities(onUpdate) {
  if (!isFirebaseConfigured() || !db) return () => {};
  try {
    const colRef = collection(db, 'activities');
    return onSnapshot(colRef, (snapshot) => {
      const allActivities = {};
      snapshot.forEach(docSnap => {
        allActivities[docSnap.id] = docSnap.data();
      });
      onUpdate(allActivities);
    }, (err) => console.error('Firestore activities error:', err));
  } catch (e) {
    console.error('Failed to subscribe all activities:', e);
    return () => {};
  }
}

export async function saveMemberActivitiesToFirestore(memberId, activitiesData) {
  if (!isFirebaseConfigured() || !db || !memberId) return false;
  try {
    await setDoc(doc(db, 'activities', memberId), activitiesData, { merge: true });
    return true;
  } catch (e) {
    console.error('Error saving activities to Firestore:', e);
    return false;
  }
}

/**
 * Sync News Posts
 */
export function subscribeNewsPosts(onUpdate) {
  if (!isFirebaseConfigured() || !db) return () => {};
  try {
    const colRef = collection(db, 'news_posts');
    return onSnapshot(colRef, (snapshot) => {
      const posts = [];
      snapshot.forEach(docSnap => posts.push({ id: docSnap.id, ...docSnap.data() }));
      // Sort news posts latest first (newest at top, oldest at bottom)
      posts.sort((a, b) => {
        const diff = getPostSortTime(b) - getPostSortTime(a);
        if (diff !== 0) return diff;
        return String(b.id || '').localeCompare(String(a.id || ''));
      });
      onUpdate(posts);
    }, (err) => console.error('Firestore news error:', err));
  } catch (e) {
    console.error('Failed to subscribe news:', e);
    return () => {};
  }
}

export async function saveNewsPostToFirestore(post) {
  if (!isFirebaseConfigured() || !db || !post?.id) return false;
  try {
    const derivedTime = getPostSortTime(post);
    const enrichedPost = {
      ...post,
      timestamp: derivedTime > 0 ? derivedTime : (post.timestamp || Date.now()),
      createdAt: post.createdAt || (derivedTime > 0 ? new Date(derivedTime).toISOString() : new Date().toISOString()),
    };
    const postJson = JSON.stringify(enrichedPost);
    // If post is safely under 450KB, save directly
    if (postJson.length < 460800) {
      await setDoc(doc(db, 'news_posts', String(enrichedPost.id)), {
        ...enrichedPost,
        isChunked: false,
        totalChunks: 0,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return true;
    }

    // Post exceeds 450KB (large number of photos/videos)!
    // Slice mediaItems into safe 400KB chunks in 'post_media_chunks' collection
    const mediaItems = enrichedPost.mediaItems || [];
    const mediaJson = JSON.stringify(mediaItems);
    const CHUNK_SIZE = 400000;
    const totalChunks = Math.ceil(mediaJson.length / CHUNK_SIZE);

    const chunkPromises = [];
    for (let i = 0; i < totalChunks; i++) {
      const slice = mediaJson.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      chunkPromises.push(
        setDoc(doc(db, 'post_media_chunks', `${enrichedPost.id}_${i}`), {
          postId: enrichedPost.id,
          chunkIndex: i,
          data: slice,
          updatedAt: new Date().toISOString(),
        })
      );
    }
    await Promise.all(chunkPromises);

    // Save main post document with preview thumbnails and chunk references
    const previewItems = mediaItems.slice(0, 4);
    const cleanPost = {
      ...enrichedPost,
      mediaItems: previewItems, // Fast immediate thumbnail preview
      totalMediaCount: mediaItems.length,
      isChunked: true,
      totalChunks,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'news_posts', String(enrichedPost.id)), cleanPost, { merge: true });
    return true;
  } catch (e) {
    console.error('Error saving news post to Firestore:', e);
    return false;
  }
}

export async function loadChunkedPostMedia(postId, totalChunks) {
  if (!isFirebaseConfigured() || !db || !postId || !totalChunks) return [];
  try {
    const chunkPromises = [];
    for (let i = 0; i < totalChunks; i++) {
      chunkPromises.push(getDoc(doc(db, 'post_media_chunks', `${postId}_${i}`)));
    }
    const snapshots = await Promise.all(chunkPromises);
    let fullJson = '';
    for (const snap of snapshots) {
      if (snap.exists() && snap.data()?.data) {
        fullJson += snap.data().data;
      }
    }
    if (fullJson) {
      return JSON.parse(fullJson);
    }
    return [];
  } catch (e) {
    console.error('Error loading chunked post media:', e);
    return [];
  }
}

export async function deleteNewsPostFromFirestore(postId, totalChunks = 0) {
  if (!isFirebaseConfigured() || !db || !postId) return false;
  try {
    await deleteDoc(doc(db, 'news_posts', String(postId)));
    if (totalChunks > 0) {
      for (let i = 0; i < totalChunks; i++) {
        deleteDoc(doc(db, 'post_media_chunks', `${postId}_${i}`)).catch(() => {});
      }
    }
    return true;
  } catch (e) {
    console.error('Error deleting news post from Firestore:', e);
    return false;
  }
}

/**
 * Sync Admin Notices
 */
export function subscribeAdminNotices(onUpdate) {
  if (!isFirebaseConfigured() || !db) return () => {};
  try {
    const colRef = collection(db, 'admin_notices');
    return onSnapshot(colRef, (snapshot) => {
      const notices = [];
      snapshot.forEach(docSnap => notices.push({ id: docSnap.id, ...docSnap.data() }));
      const getT = (n) => {
        if (!n) return 0;
        if (typeof n.timestamp === 'number') return n.timestamp;
        if (n.timestamp?.seconds) return n.timestamp.seconds * 1000;
        if (n.createdAt) {
          const t = new Date(n.createdAt).getTime();
          if (!isNaN(t)) return t;
        }
        if (typeof n.id === 'string' && n.id.startsWith('ntc-')) {
          const num = parseInt(n.id.replace('ntc-', ''), 10);
          if (!isNaN(num) && num > 1600000000000) return num;
        }
        if (n.date) {
          const t = new Date(n.date).getTime();
          if (!isNaN(t)) return t;
        }
        return 0;
      };
      notices.sort((a, b) => getT(b) - getT(a));
      onUpdate(notices);
    }, (err) => console.error('Firestore notices error:', err));
  } catch (e) {
    console.error('Failed to subscribe notices:', e);
    return () => {};
  }
}

export async function saveAdminNoticeToFirestore(notice) {
  if (!isFirebaseConfigured() || !db) return false;
  const id = notice.id || notice._id || notice.date;
  if (!id) return false;
  try {
    await setDoc(doc(db, 'admin_notices', String(id)), notice, { merge: true });
    return true;
  } catch (e) {
    console.error('Error saving notice to Firestore:', e);
    return false;
  }
}

export async function deleteAdminNoticeFromFirestore(noticeId) {
  if (!isFirebaseConfigured() || !db || !noticeId) return false;
  try {
    await deleteDoc(doc(db, 'admin_notices', String(noticeId)));
    return true;
  } catch (e) {
    console.error('Error deleting notice from Firestore:', e);
    return false;
  }
}

/**
 * Sync Gallery Media
 */
export function subscribeGalleryMedia(onUpdate) {
  if (!isFirebaseConfigured() || !db) return () => {};
  try {
    const colRef = collection(db, 'gallery_media');
    return onSnapshot(colRef, (snapshot) => {
      const media = [];
      snapshot.forEach(docSnap => media.push({ id: docSnap.id, ...docSnap.data() }));
      media.sort((a, b) => {
        const diff = getPostSortTime(b) - getPostSortTime(a);
        if (diff !== 0) return diff;
        return String(b.id || '').localeCompare(String(a.id || ''));
      });
      onUpdate(media);
    }, (err) => console.error('Firestore gallery error:', err));
  } catch (e) {
    console.error('Failed to subscribe gallery:', e);
    return () => {};
  }
}

export async function saveGalleryMediaToFirestore(mediaItem) {
  if (!isFirebaseConfigured() || !db) return false;
  const id = mediaItem.id || mediaItem._id;
  if (!id) return false;
  try {
    const derivedTime = getPostSortTime(mediaItem);
    const enrichedPost = {
      ...mediaItem,
      timestamp: derivedTime > 0 ? derivedTime : (mediaItem.timestamp || Date.now()),
      createdAt: mediaItem.createdAt || (derivedTime > 0 ? new Date(derivedTime).toISOString() : new Date().toISOString()),
    };
    const postJson = JSON.stringify(enrichedPost);
    if (postJson.length < 460800) {
      await setDoc(doc(db, 'gallery_media', String(id)), {
        ...enrichedPost,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return true;
    }
    // If oversized, store safe previews to avoid Firestore 1MB document size limit rejection
    const safeItems = (enrichedPost.mediaItems || []).slice(0, 4);
    await setDoc(doc(db, 'gallery_media', String(id)), {
      ...enrichedPost,
      mediaItems: safeItems,
      totalMediaCount: (enrichedPost.mediaItems || []).length,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (e) {
    console.error('Error saving gallery media to Firestore:', e);
    return false;
  }
}

export async function deleteGalleryMediaFromFirestore(mediaId) {
  if (!isFirebaseConfigured() || !db || !mediaId) return false;
  try {
    await deleteDoc(doc(db, 'gallery_media', String(mediaId)));
    return true;
  } catch (e) {
    console.error('Error deleting gallery media from Firestore:', e);
    return false;
  }
}

/**
 * Sync Encouragement Messages
 */
export function subscribeEncouragementMessages(onUpdate) {
  if (!isFirebaseConfigured() || !db) return () => {};
  try {
    const colRef = collection(db, 'encouragement_messages');
    return onSnapshot(colRef, (snapshot) => {
      const msgs = [];
      snapshot.forEach(docSnap => msgs.push({ id: docSnap.id, ...docSnap.data() }));
      onUpdate(msgs);
    }, (err) => console.error('Firestore messages error:', err));
  } catch (e) {
    console.error('Failed to subscribe messages:', e);
    return () => {};
  }
}

export async function saveEncouragementMessageToFirestore(msg) {
  if (!isFirebaseConfigured() || !db) return false;
  const id = msg.id || msg._id || String(msg.timestamp);
  if (!id) return false;
  try {
    await setDoc(doc(db, 'encouragement_messages', String(id)), msg, { merge: true });
    return true;
  } catch (e) {
    console.error('Error saving message to Firestore:', e);
    return false;
  }
}

export async function deleteEncouragementMessageFromFirestore(msgId) {
  if (!isFirebaseConfigured() || !db || !msgId) return false;
  try {
    await deleteDoc(doc(db, 'encouragement_messages', String(msgId)));
    return true;
  } catch (e) {
    console.error('Error deleting message from Firestore:', e);
    return false;
  }
}

/**
 * Sync Gospel Diary
 */
export function subscribeUserGospelDiary(userId, onUpdate) {
  if (!isFirebaseConfigured() || !db || !userId) return () => {};
  try {
    const docRef = doc(db, 'gospel_diary', userId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate(data.entries || []);
      }
    }, (err) => console.error('Firestore diary error:', err));
  } catch (e) {
    console.error('Failed to subscribe user diary:', e);
    return () => {};
  }
}

export async function saveUserGospelDiaryToFirestore(userId, entries) {
  if (!isFirebaseConfigured() || !db || !userId) return false;
  try {
    await setDoc(doc(db, 'gospel_diary', userId), { entries }, { merge: true });
    return true;
  } catch (e) {
    console.error('Error saving user diary to Firestore:', e);
    return false;
  }
}

/**
 * Sync Shared Files
 */
export function subscribeSharedFiles(onUpdate) {
  if (!isFirebaseConfigured() || !db) return () => {};
  try {
    const colRef = collection(db, 'shared_files');
    return onSnapshot(colRef, (snapshot) => {
      const files = [];
      snapshot.forEach(docSnap => files.push({ id: docSnap.id, ...docSnap.data() }));
      files.sort((a, b) => {
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      onUpdate(files);
    }, (err) => console.error('Firestore shared files error:', err));
  } catch (e) {
    console.error('Failed to subscribe shared files:', e);
    return () => {};
  }
}

const CHUNK_SIZE = 450 * 1024; // 450KB chunks to safely remain under Firestore's 1MB limit

export async function saveSharedFileToFirestore(fileItem) {
  if (!isFirebaseConfigured() || !db) return false;
  const id = String(fileItem.id || Date.now());
  if (!id) return false;

  try {
    const rawData = fileItem.fileUrl || '';
    const isBase64Data = typeof rawData === 'string' && rawData.startsWith('data:');

    // If large data URL (> 450 KB), split into chunks
    if (isBase64Data && rawData.length > CHUNK_SIZE) {
      const totalChunks = Math.ceil(rawData.length / CHUNK_SIZE);

      // 1. Write chunks into 'file_chunks' collection
      for (let i = 0; i < totalChunks; i++) {
        const chunkSlice = rawData.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await setDoc(doc(db, 'file_chunks', `${id}_${i}`), {
          fileId: id,
          chunkIndex: i,
          data: chunkSlice,
          updatedAt: new Date().toISOString(),
        });
      }

      // 2. Save metadata in 'shared_files' without the massive dataUrl
      const meta = {
        ...fileItem,
        id,
        isChunked: true,
        totalChunks,
        fileUrl: '', // Will be loaded from chunks on demand and cached in IndexedDB
        originalUrl: '',
        dataLength: rawData.length,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'shared_files', id), meta, { merge: true });
      return true;
    }

    // Direct save for web links (Google Drive, Docs, YouTube, etc.) or small files
    const cleanItem = {
      ...fileItem,
      id,
      isChunked: false,
      totalChunks: 0,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'shared_files', id), cleanItem, { merge: true });
    return true;
  } catch (e) {
    console.error('Error saving shared file to Firestore:', e);
    return false;
  }
}

export async function loadChunkedFileData(fileId, totalChunks) {
  if (!isFirebaseConfigured() || !db || !fileId || !totalChunks) return '';
  try {
    const chunkPromises = [];
    for (let i = 0; i < totalChunks; i++) {
      chunkPromises.push(getDoc(doc(db, 'file_chunks', `${fileId}_${i}`)));
    }
    const snapshots = await Promise.all(chunkPromises);
    let fullData = '';
    for (const snap of snapshots) {
      if (snap.exists() && snap.data()?.data) {
        fullData += snap.data().data;
      }
    }
    return fullData;
  } catch (e) {
    console.error('Error loading chunked file data:', e);
    return '';
  }
}

export async function deleteSharedFileFromFirestore(fileId, totalChunks = 0) {
  if (!isFirebaseConfigured() || !db || !fileId) return false;
  try {
    await deleteDoc(doc(db, 'shared_files', String(fileId)));
    // Delete any chunks if present
    if (totalChunks > 0) {
      for (let i = 0; i < totalChunks; i++) {
        deleteDoc(doc(db, 'file_chunks', `${fileId}_${i}`)).catch(() => {});
      }
    }
    return true;
  } catch (e) {
    console.error('Error deleting shared file from Firestore:', e);
    return false;
  }
}

/**
 * Global State Document Sync (Fast instant bootstrap)
 */
export async function saveGlobalStateToFirestore(fullData) {
  if (!isFirebaseConfigured() || !db || !fullData) return false;
  try {
    await setDoc(doc(db, 'system', 'app_state'), fullData, { merge: true });
    return true;
  } catch (e) {
    console.error('Error saving global state to Firestore:', e);
    return false;
  }
}

export async function getGlobalStateFromFirestore() {
  if (!isFirebaseConfigured() || !db) return null;
  try {
    const snap = await getDoc(doc(db, 'system', 'app_state'));
    if (snap.exists()) return snap.data();
  } catch (e) {
    console.error('Error fetching global state from Firestore:', e);
  }
  return null;
}

export function subscribeGlobalState(onUpdate) {
  if (!isFirebaseConfigured() || !db) return () => {};
  try {
    return onSnapshot(doc(db, 'system', 'app_state'), (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data());
      }
    }, (err) => console.error('Global state sync error:', err));
  } catch (e) {
    console.error('Error subscribing to global state:', e);
    return () => {};
  }
}

/**
 * Realtime Presence Tracking (Online status)
 */
export async function updateUserPresence(userId) {
  if (!isFirebaseConfigured() || !db || !userId) return false;
  try {
    await setDoc(doc(db, 'presence', String(userId)), {
      userId,
      lastActiveMs: Date.now(),
      lastActiveAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (e) {
    return false;
  }
}

export function subscribePresence(onUpdate) {
  if (!isFirebaseConfigured() || !db) return () => {};
  try {
    const colRef = collection(db, 'presence');
    return onSnapshot(colRef, (snapshot) => {
      const presenceMap = {};
      snapshot.forEach(docSnap => {
        presenceMap[docSnap.id] = docSnap.data();
      });
      onUpdate(presenceMap);
    }, (err) => console.error('Presence subscribe error:', err));
  } catch (e) {
    return () => {};
  }
}

/**
 * Sync Children Media
 */
export function subscribeChildrenMedia(onUpdate) {
  if (!isFirebaseConfigured() || !db) return () => {};
  try {
    const colRef = collection(db, 'children_media');
    return onSnapshot(colRef, (snapshot) => {
      const items = [];
      snapshot.forEach(docSnap => items.push({ id: docSnap.id, ...docSnap.data() }));
      const getT = (item) => {
        if (!item) return 0;
        if (typeof item.timestamp === 'number') return item.timestamp;
        if (item.timestamp?.seconds) return item.timestamp.seconds * 1000;
        if (item.createdAt) {
          const t = new Date(item.createdAt).getTime();
          if (!isNaN(t)) return t;
        }
        if (typeof item.id === 'string' && item.id.startsWith('chm-')) {
          const num = parseInt(item.id.replace('chm-', ''), 10);
          if (!isNaN(num) && num > 1600000000000) return num;
        }
        if (item.date) {
          const t = new Date(item.date).getTime();
          if (!isNaN(t)) return t;
        }
        return 0;
      };
      items.sort((a, b) => getT(b) - getT(a));
      onUpdate(items);
    }, (err) => console.error('Firestore children media error:', err));
  } catch (e) {
    console.error('Failed to subscribe children media:', e);
    return () => {};
  }
}

export async function saveChildrenMediaToFirestore(item) {
  if (!isFirebaseConfigured() || !db) return false;
  const id = item.id || item._id;
  if (!id) return false;
  try {
    await setDoc(doc(db, 'children_media', String(id)), {
      ...item,
      timestamp: item.timestamp || Date.now(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (e) {
    console.error('Error saving children media to Firestore:', e);
    return false;
  }
}

export async function deleteChildrenMediaFromFirestore(itemId) {
  if (!isFirebaseConfigured() || !db || !itemId) return false;
  try {
    await deleteDoc(doc(db, 'children_media', String(itemId)));
    return true;
  } catch (e) {
    console.error('Error deleting children media from Firestore:', e);
    return false;
  }
}

/**
 * Sync Media Categories (Special, Children, + Custom Categories)
 */
export function subscribeMediaCategories(onUpdate) {
  if (!isFirebaseConfigured() || !db) return () => {};
  try {
    return onSnapshot(doc(db, 'system_settings', 'media_categories'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (Array.isArray(d?.categories) && d.categories.length > 0) {
          onUpdate(d.categories);
        }
      }
    }, (err) => console.error('Media categories subscribe error:', err));
  } catch (e) {
    return () => {};
  }
}

export async function saveMediaCategoriesToFirestore(categories) {
  if (!isFirebaseConfigured() || !db || !Array.isArray(categories)) return false;
  try {
    await setDoc(doc(db, 'system_settings', 'media_categories'), {
      categories,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (e) {
    console.error('Error saving media categories to Firestore:', e);
    return false;
  }
}
