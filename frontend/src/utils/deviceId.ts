/**
 * Generate a unique device ID for the browser
 * Unlike Electron, we can't get MAC address, so we generate a UUID and store it in localStorage
 */
export function getDeviceId(): string {
  const storageKey = 'device_id';

  // Try to get existing device ID
  let deviceId = localStorage.getItem(storageKey);

  if (!deviceId) {
    // Generate a new UUID v4
    deviceId = generateUUID();
    localStorage.setItem(storageKey, deviceId);
  }

  return deviceId;
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Clear the device ID (useful for testing or logout)
 */
export function clearDeviceId(): void {
  localStorage.removeItem('device_id');
}
