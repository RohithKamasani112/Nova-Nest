import { config } from './config';

// Read JSON file from public folder
export const readLocalJson = async <T>(path: string): Promise<T> => {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to read ${path}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error reading local JSON:', error);
    // Return empty array or object based on the path
    if (path.includes('properties')) {
      return [] as T;
    }
    return {} as T;
  }
};

// Write JSON file (using localStorage as fallback in browser)
export const writeLocalJson = async <T>(
  path: string,
  data: T
): Promise<void> => {
  try {
    // In browser environment, we'll use localStorage
    const key = path.replace('/storage/', 'estate_');
    localStorage.setItem(key, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing local JSON:', error);
    throw new Error('Failed to write local JSON');
  }
};

// Read from localStorage or fallback to fetch
export const getLocalData = async <T>(
  path: string,
  defaultValue: T
): Promise<T> => {
  try {
    // Try localStorage first
    const key = path.replace('/storage/', 'estate_');
    const stored = localStorage.getItem(key);

    if (stored) {
      return JSON.parse(stored);
    }

    // Fallback to fetch from public folder
    return await readLocalJson<T>(path);
  } catch (error) {
    console.error('Error getting local data:', error);
    return defaultValue;
  }
};

// Save image locally (converts to base64 and stores in localStorage)
export const saveLocalImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result as string;
      const imageId = `img_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const key = `estate_image_${imageId}`;

      localStorage.setItem(key, base64);
      resolve(`/storage/images/${imageId}`);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    reader.readAsDataURL(file);
  });
};

// Get local image (from localStorage or public folder)
export const getLocalImage = (path: string): string => {
  // If it's a localStorage image
  if (path.startsWith('/storage/images/img_')) {
    const imageId = path.split('/').pop();
    const key = `estate_image_${imageId}`;
    const stored = localStorage.getItem(key);

    if (stored) {
      return stored;
    }
  }

  // Return the path as-is (will be fetched from public folder)
  return path;
};

// Delete local image
export const deleteLocalImage = (path: string): void => {
  if (path.startsWith('/storage/images/img_')) {
    const imageId = path.split('/').pop();
    const key = `estate_image_${imageId}`;
    localStorage.removeItem(key);
  }
};

// Clear all local storage data
export const clearLocalStorage = (): void => {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith('estate_')) {
      localStorage.removeItem(key);
    }
  });
};
