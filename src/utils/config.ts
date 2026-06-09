// Environment configuration utility
export const config = {
  // Environment mode
  isProduction: import.meta.env.VITE_PRODUCTION === 'true',

  // AWS S3 Configuration
  aws: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    s3: {
      bucketName: import.meta.env.VITE_S3_BUCKET_NAME || '',
      folderName: import.meta.env.VITE_S3_FOLDER_NAME || 'properties',
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

// Validate configuration
export const validateConfig = () => {
  if (config.isProduction) {
    const required = [
      config.aws.accessKeyId,
      config.aws.secretAccessKey,
      config.aws.s3.bucketName,
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
