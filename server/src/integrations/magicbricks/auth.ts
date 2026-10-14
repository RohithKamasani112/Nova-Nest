// Compatibility exports for the existing Magicbricks integration and tests.
export * from '../shared/auth';
import { secretKeyProvider } from '../shared/auth';
export const getActiveKeys = secretKeyProvider('MAGICBRICKS_API_KEY_SECRET_ARN');
