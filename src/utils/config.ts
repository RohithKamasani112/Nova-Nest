// Environment configuration utility
const isProd = import.meta.env.VITE_IS_PRODUCTION === 'true';

const s3FolderName = isProd
  ? import.meta.env.VITE_S3_FOLDER_PROD
  : import.meta.env.VITE_S3_FOLDER_DUMMY;

export const config = {
  // Environment mode
  isProduction: isProd,

  // AWS S3 Configuration
  aws: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    s3: {
      bucketName: import.meta.env.VITE_S3_BUCKET_NAME || '',
      folderName: s3FolderName || '',
    },
  },

  // AWS Cognito Configuration
  cognito: {
    userPoolId: import.meta.env.VITE_USER_POOL_ID || '',
    userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
    region: import.meta.env.VITE_AWS_COGNITO_REGION || 'us-east-1',
  },

  // Local storage paths
  local: {
    propertiesPath: '/storage/properties.json',
    usersPath: '/storage/users.json',
    imagesPath: '/storage/images/',
  },
};

// Make the active environment + S3 folder obvious in the console. This is the
// fastest way to confirm which folder the app is actually reading/writing —
// remember Vite only reads .env at startup, so restart after changing it.
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.info(
    `[config] VITE_IS_PRODUCTION=${import.meta.env.VITE_IS_PRODUCTION} → mode=${
      isProd ? 'PRODUCTION' : 'DUMMY'
    }, S3 folder="${s3FolderName}"`
  );
}

// Validate configuration
export const validateConfig = () => {
  if (config.isProduction) {
    const required = [
      config.aws.accessKeyId,
      config.aws.secretAccessKey,
      config.aws.s3.bucketName,
      config.aws.s3.folderName,
    ];

    if (required.some((val) => !val)) {
      console.warn(
        'Production mode enabled but AWS credentials are missing. Please check your environment variables.'
      );
      return false;
    }
  }

  return true;
};
