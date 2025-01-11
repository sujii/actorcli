export const logInfo = (message: string) => {
  console.log(`[INFO]: ${message}`);
};

export const logError = (message: string) => {
  console.error(`[ERROR]: ${message}`);
};

export const logDebug = (message: string) => {
  if (process.env.DEBUG && process.env.DEBUG === 'true') {
    console.debug(`[DEBUG]: ${message}`);
  }
};
