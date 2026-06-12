import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp, 
  setDoc,
  getDoc,
  doc,
  getDocFromServer,
  deleteDoc
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

// Check if Firebase has been fully provisioned or is still placeholder
export const isFirebaseLive = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'placeholder-api-key' && 
  !firebaseConfig.apiKey.includes('placeholder');

let app: any = null;
export let db: any = null;
export let storage: any = null;

if (isFirebaseLive) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    storage = getStorage(app);
    console.log('Firebase successfully initialized!');
    
    // Connection Test
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'settings', 'appLock'));
        console.log('Firestore connection verified!');
      } catch (error: any) {
        if(error?.message?.includes('permission')) {
          console.error("Firestore permission issue detected on startup.");
        }
      }
    };
    testConnection();
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
} else {
  console.log('Firebase is running in local fallback mode. (Configure credentials via the UI to enable auto-sync)');
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'anonymous-partner'
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Real-time Chat Messages Sync
export function syncMessages(onUpdate: (messages: any[]) => void, onError: (err: any) => void) {
  if (!isFirebaseLive || !db) {
    // Local fallback listener
    const localMsgs = localStorage.getItem('love_chat_messages');
    onUpdate(localMsgs ? JSON.parse(localMsgs) : []);
    
    // Set up window listener for cross-tab local updates if offline
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'love_chat_messages') {
        onUpdate(e.newValue ? JSON.parse(e.newValue) : []);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }

  const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(150));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
      });
    });
    // Reverse to show oldest first in chronological chat flow
    onUpdate(list.reverse());
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'messages');
    onError(error);
  });
}

// Upload helper for voice note file references in Firebase Storage
export async function uploadVoiceNoteToStorage(blob: Blob): Promise<string> {
  if (!isFirebaseLive || !storage) {
    throw new Error('Firebase Storage is not initialized or offline.');
  }
  const filename = `voice_notes/${Date.now()}_${Math.random().toString(36).substring(2, 10)}.webm`;
  const storageRef = ref(storage, filename);
  const snapshot = await uploadBytes(storageRef, blob);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}

// Send a chat/voice message
export async function sendMessage(userId: string, text: string, voiceBase64?: string, voiceDuration?: number, voiceUrl?: string) {
  const payload: any = {
    userId,
    text,
    voiceBase64: voiceBase64 || null,
    voiceUrl: voiceUrl || null,
    voiceDuration: voiceDuration || null,
    createdAt: db ? serverTimestamp() : new Date().toISOString()
  };

  if (!isFirebaseLive || !db) {
    // Local persistence fallback
    const saved = localStorage.getItem('love_chat_messages');
    const list = saved ? JSON.parse(saved) : [];
    const newMsg = {
      id: 'local_' + Date.now(),
      ...payload,
      createdAt: new Date().toISOString()
    };
    const updated = [...list, newMsg];
    localStorage.setItem('love_chat_messages', JSON.stringify(updated));
    
    // Trigger custom local event to refresh UI in the same tab
    window.dispatchEvent(new StorageEvent('storage', { key: 'love_chat_messages', newValue: JSON.stringify(updated) }));
    return newMsg.id;
  }

  try {
    const docRef = await addDoc(collection(db, 'messages'), payload);
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'messages');
  }
}

// Real-time Mood Sync
export function syncMoods(onUpdate: (moodLogs: any[]) => void, onError: (err: any) => void) {
  if (!isFirebaseLive || !db) {
    const saved = localStorage.getItem('love_sentiment_history');
    const defaultHistory = [
      { dateStr: new Date('2026-04-24').toDateString(), displayDate: '24 Apr 2026', mood: "💖", label: "Dicintai", color: "#EBC2C6", note: "Hari jadian kita yang tak terlupakan!", userId: 'Nauraa' },
      { dateStr: new Date('2026-05-20').toDateString(), displayDate: '20 Mei 2026', mood: "🥰", label: "Bahagia", color: "#D6C2E8", note: "Mengucapkan janji manis bersama.", userId: 'Farsya' }
    ];
    onUpdate(saved ? JSON.parse(saved) : defaultHistory);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'love_sentiment_history') {
        onUpdate(e.newValue ? JSON.parse(e.newValue) : defaultHistory);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }

  const q = query(collection(db, 'moods'), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
      });
    });
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'moods');
    onError(error);
  });
}

// Log a new mood
export async function logMood(userId: string, emoji: string, label: string, color: string, note: string) {
  const today = new Date();
  const todayStr = today.toDateString();
  const hours = today.getHours().toString().padStart(2, '0');
  const mins = today.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${mins}`;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const formattedDate = `${today.getDate()} ${months[today.getMonth()]}`;

  const payload = {
    userId,
    dateStr: todayStr,
    displayDate: formattedDate,
    time: timeStr,
    mood: emoji,
    label,
    color,
    note: note.trim() || 'Hari yang penuh warna denganmu ✨',
    createdAt: db ? serverTimestamp() : new Date().toISOString()
  };

  if (!isFirebaseLive || !db) {
    const saved = localStorage.getItem('love_sentiment_history');
    let list = saved ? JSON.parse(saved) : [
      { dateStr: new Date('2026-04-24').toDateString(), displayDate: '24 Apr 2026', mood: "💖", label: "Dicintai", color: "#EBC2C6", note: "Hari jadian kita yang tak terlupakan!", userId: 'Nauraa' },
      { dateStr: new Date('2026-05-20').toDateString(), displayDate: '20 Mei 2026', mood: "🥰", label: "Bahagia", color: "#D6C2E8", note: "Mengucapkan janji manis bersama.", userId: 'Farsya' }
    ];
    
    // Replace if same day and same person, otherwise add new
    const existingIdx = list.findIndex((item: any) => item.dateStr === todayStr && item.userId === userId);
    if (existingIdx > -1) {
      list[existingIdx] = { id: list[existingIdx].id || 'local_' + Date.now(), ...payload };
    } else {
      list = [{ id: 'local_' + Date.now(), ...payload }, ...list];
    }
    
    localStorage.setItem('love_sentiment_history', JSON.stringify(list));
    window.dispatchEvent(new StorageEvent('storage', { key: 'love_sentiment_history', newValue: JSON.stringify(list) }));
    return;
  }

  try {
    // Generate unique doc ID based on Date+UserId to prevent duplicate logs for the same day
    const uniqueId = `${todayStr.replace(/\s+/g, '_')}_${userId}`;
    await setDoc(doc(db, 'moods', uniqueId), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `moods/${userId}`);
  }
}

// Helper to reset local mood history
export function clearLocalMoods() {
  localStorage.removeItem('love_sentiment_history');
}

// Fetch security config PIN hash
export async function getSecurityPINHash(): Promise<string | null> {
  if (!isFirebaseLive || !db) {
    return localStorage.getItem('love_app_pin_hash');
  }
  const path = 'settings/appLock';
  try {
    // Use getDocFromServer to bypass cache and ensure we have latest PIN
    const docSnap = await getDocFromServer(doc(db, 'settings', 'appLock'));
    if (docSnap.exists()) {
      return (docSnap.data() as any).pinHash || null;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return localStorage.getItem('love_app_pin_hash');
  }
}

// Store security config PIN hash
export async function setSecurityPINHash(pinHash: string): Promise<void> {
  localStorage.setItem('love_app_pin_hash', pinHash);
  if (!isFirebaseLive || !db) {
    return;
  }
  const path = 'settings/appLock';
  try {
    await setDoc(doc(db, 'settings', 'appLock'), {
      pinHash,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// --- NEW COLLECTIONS GENERATED BY AI ASSISTANT ---

// Dreams / Bucket List
export function syncDreams(onUpdate: (dreams: any[]) => void, onError: (err: any) => void) {
  if (!isFirebaseLive || !db) {
    const saved = localStorage.getItem('love_journey_dreams');
    onUpdate(saved ? JSON.parse(saved) : []);
    return () => {};
  }
  const q = query(collection(db, 'dreams'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'dreams');
    onError(error);
  });
}

export async function addDream(text: string, color: string, userId: string) {
  const payload = { text, color, userId, done: false, createdAt: db ? serverTimestamp() : new Date().toISOString() };
  if (!isFirebaseLive || !db) {
    const saved = localStorage.getItem('love_journey_dreams');
    const list = saved ? JSON.parse(saved) : [];
    const updated = [...list, { id: 'local_' + Date.now(), ...payload }];
    localStorage.setItem('love_journey_dreams', JSON.stringify(updated));
    return;
  }
  try {
    await addDoc(collection(db, 'dreams'), payload);
  } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'dreams'); }
}

export async function toggleDream(dreamId: string, done: boolean) {
  if (!isFirebaseLive || !db) {
    const saved = localStorage.getItem('love_journey_dreams');
    if (!saved) return;
    const list = JSON.parse(saved);
    const updated = list.map((d: any) => d.id === dreamId ? { ...d, done } : d);
    localStorage.setItem('love_journey_dreams', JSON.stringify(updated));
    return;
  }
  try {
    await setDoc(doc(db, 'dreams', dreamId), { done }, { merge: true });
  } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `dreams/${dreamId}`); }
}

export async function deleteDream(dreamId: string) {
  if (!isFirebaseLive || !db) {
    const saved = localStorage.getItem('love_journey_dreams');
    if (!saved) return;
    const list = JSON.parse(saved);
    const updated = list.filter((d: any) => d.id !== dreamId);
    localStorage.setItem('love_journey_dreams', JSON.stringify(updated));
    return;
  }
  try {
    await deleteDoc(doc(db, 'dreams', dreamId));
  } catch (err) { handleFirestoreError(err, OperationType.DELETE, `dreams/${dreamId}`); }
}

// Schedules
export function syncSchedules(onUpdate: (schedules: any[]) => void, onError: (err: any) => void) {
  if (!isFirebaseLive || !db) {
    const saved = localStorage.getItem('love_schedules');
    onUpdate(saved ? JSON.parse(saved) : []);
    return () => {};
  }
  const q = query(collection(db, 'schedules'), orderBy('date', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'schedules');
    onError(error);
  });
}

export async function addSchedule(date: string, title: string, location: string, userId: string) {
  const payload = { date, title, location, userId, createdAt: db ? serverTimestamp() : new Date().toISOString() };
  if (!isFirebaseLive || !db) {
    const saved = localStorage.getItem('love_schedules');
    const list = saved ? JSON.parse(saved) : [];
    const updated = [...list, { id: 'local_' + Date.now(), ...payload }];
    localStorage.setItem('love_schedules', JSON.stringify(updated));
    return;
  }
  try {
    await addDoc(collection(db, 'schedules'), payload);
  } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'schedules'); }
}

// Love Letter Draft
export function syncLoveLetter(userId: string, onUpdate: (content: string) => void) {
  if (!isFirebaseLive || !db) {
    const saved = localStorage.getItem('love_letter_draft');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.userId === userId) onUpdate(parsed.content || '');
    }
    return () => {};
  }
  return onSnapshot(doc(db, 'love_letters', userId), (docSnap) => {
    if (docSnap.exists()) {
      onUpdate((docSnap.data() as any).content || '');
    }
  });
}

export async function saveLoveLetter(userId: string, content: string) {
  const payload = { userId, content, updatedAt: db ? serverTimestamp() : new Date().toISOString() };
  localStorage.setItem('love_letter_draft', JSON.stringify(payload));
  if (!isFirebaseLive || !db) return;
  try {
    await setDoc(doc(db, 'love_letters', userId), payload);
  } catch (err) { handleFirestoreError(err, OperationType.WRITE, `love_letters/${userId}`); }
}

// Memories (Timeline)
export function syncMemories(onUpdate: (memories: any[]) => void, onError: (err: any) => void) {
  if (!isFirebaseLive || !db) {
    const saved = localStorage.getItem('love_journey_memories');
    onUpdate(saved ? JSON.parse(saved) : []);
    return () => {};
  }
  const q = query(collection(db, 'memories'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'memories');
    onError(error);
  });
}

export async function addMemory(memory: any) {
  if (!isFirebaseLive || !db) {
    const saved = localStorage.getItem('love_journey_memories');
    const list = saved ? JSON.parse(saved) : [];
    const updated = [...list, { id: 'local_' + Date.now(), ...memory }];
    localStorage.setItem('love_journey_memories', JSON.stringify(updated));
    return;
  }
  try {
    await addDoc(collection(db, 'memories'), { ...memory, createdAt: serverTimestamp() });
  } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'memories'); }
}

// Photos
export function syncPhotos(onUpdate: (photos: any[]) => void, onError?: (err: any) => void) {
  if (!isFirebaseLive || !db) {
    const saved = localStorage.getItem('love_together_photos');
    onUpdate(saved ? JSON.parse(saved) : []);
    return () => {};
  }
  const q = query(collection(db, 'photos'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'photos');
    onError(error);
  });
}

export async function addPhoto(url: string, caption: string, tab: string, userId: string) {
  const payload = { url, caption, tab, userId, createdAt: db ? serverTimestamp() : new Date().toISOString() };
  if (!isFirebaseLive || !db) {
    const saved = localStorage.getItem('love_together_photos');
    const list = saved ? JSON.parse(saved) : [];
    const updated = [...list, { id: 'local_' + Date.now(), ...payload }];
    localStorage.setItem('love_together_photos', JSON.stringify(updated));
    return;
  }
  try {
    await addDoc(collection(db, 'photos'), payload);
  } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'photos'); }
}

