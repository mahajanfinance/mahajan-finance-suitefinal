// ============================================
// src/utils/authStore.ts
// AUTHENTICATION STORAGE UTILITY
// ============================================

const TEMP_USER_KEY = 'tracker_temp_user';
const BACKUP_KEY = 'tracker_temp_user_backup';

export interface TempUserInfo {
  id: string;
  email: string;
  full_name: string;
  user_id?: string;
}

/**
 * Store temp user data in multiple locations for reliability
 */
export const storeTempUser = (userInfo: TempUserInfo): boolean => {
  try {
    const dataString = JSON.stringify(userInfo);
    
    console.log('💾 Storing user data...');
    console.log('   User:', userInfo.email);
    
    // Method 1: sessionStorage (primary)
    sessionStorage.setItem(TEMP_USER_KEY, dataString);
    console.log('   ✅ Stored in sessionStorage');
    
    // Method 2: localStorage (backup)
    localStorage.setItem(BACKUP_KEY, dataString);
    console.log('   ✅ Stored in localStorage');
    
    // Method 3: Window object (emergency backup)
    (window as any).__temp_tracker_user = userInfo;
    console.log('   ✅ Stored in window object');
    
    // CRITICAL: Verify it was actually stored!
    const verify = sessionStorage.getItem(TEMP_USER_KEY);
    if (!verify) {
      console.error('   ❌ FAILED: Could not verify sessionStorage!');
      return false;
    }
    
    console.log('   ✅ VERIFIED: Data stored successfully');
    console.log('   📦 Data length:', verify.length, 'characters');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to store user data:', error);
    return false;
  }
};

/**
 * Retrieve temp user data from any available source
 */
export const getTempUser = (): TempUserInfo | null => {
  console.log('🔍 Looking for temp user data...');
  
  // Method 1: Check sessionStorage first
  const sessData = sessionStorage.getItem(TEMP_USER_KEY);
  console.log('   SessionStorage:', sessData ? '✅ FOUND (' + sessData.length + ' chars)' : '❌ EMPTY');
  
  if (sessData) {
    try {
      const parsed = JSON.parse(sessData);
      if (parsed && parsed.email && parsed.id) {
        console.log('   ✅ Valid user found in sessionStorage:', parsed.email);
        return parsed;
      } else {
        console.warn('   ⚠️ Invalid data in sessionStorage, clearing...');
        sessionStorage.removeItem(TEMP_USER_KEY);
      }
    } catch (e) {
      console.error('   ❌ Parse error in sessionStorage:', e);
      sessionStorage.removeItem(TEMP_USER_KEY);
    }
  }
  
  // Method 2: Check localStorage backup
  const localData = localStorage.getItem(BACKUP_KEY);
  console.log('   LocalStorage:', localData ? '✅ FOUND' : '❌ EMPTY');
  
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      if (parsed && parsed.email && parsed.id) {
        console.log('   ✅ Valid user found in localStorage:', parsed.email);
        
        // Restore to sessionStorage for next time
        sessionStorage.setItem(TEMP_USER_KEY, localData);
        console.log('   ✅ Restored to sessionStorage from backup');
        
        return parsed;
      } else {
        console.warn('   ⚠️ Invalid data in localStorage, clearing...');
        localStorage.removeItem(BACKUP_KEY);
      }
    } catch (e) {
      console.error('   ❌ Parse error in localStorage:', e);
      localStorage.removeItem(BACKUP_KEY);
    }
  }
  
  // Method 3: Check window object
  const winData = (window as any).__temp_tracker_user;
  console.log('   Window Object:', winData ? '✅ FOUND' : '❌ EMPTY');
  
  if (winData && winData.email && winData.id) {
    console.log('   ✅ Valid user found in window object:', winData.email);
    
    // Store in proper locations for future use
    storeTempUser(winData);
    
    return winData;
  }
  
  console.log('   ❌ NO USER DATA FOUND ANYWHERE');
  return null;
};

/**
 * Clear all auth data
 */
export const clearAuthData = (): void => {
  console.log('🧹 Clearing all auth data...');
  sessionStorage.removeItem(TEMP_USER_KEY);
  localStorage.removeItem(BACKUP_KEY);
  delete (window as any).__temp_tracker_user;
  console.log('   ✅ All auth data cleared');
};

/**
 * Debug helper - shows current state
 */
export const debugAuthState = (): void => {
  console.log('\n========================================');
  console.log('🔍 AUTH DEBUG STATE');
  console.log('========================================');
  console.log('URL:', window.location.pathname);
  console.log('');
  console.log('SessionStorage:');
  const sessData = sessionStorage.getItem(TEMP_USER_KEY);
  console.log('  tracker_temp_user:', sessData ? '✅ EXISTS (' + sessData.length + ' chars)' : '❌ EMPTY');
  if (sessData) {
    try {
      console.log('  Parsed:', JSON.parse(sessData));
    } catch(e) {
      console.log('  Parse Error:', e);
    }
  }
  console.log('');
  console.log('LocalStorage:');
  console.log('  tracker_temp_user_backup:', localStorage.getItem(BACKUP_KEY) ? '✅ EXISTS' : '❌ EMPTY');
  console.log('');
  console.log('Window Object:');
  console.log('  __temp_tracker_user:', (window as any).__temp_tracker_user ? '✅ EXISTS' : '❌ EMPTY');
  console.log('========================================\n');
};
