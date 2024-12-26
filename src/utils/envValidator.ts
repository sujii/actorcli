import Ajv from 'ajv';
import dotenv from 'dotenv';
import fs from 'node:fs';

const schema = JSON.parse(fs.readFileSync('./.env.schema.json', 'utf-8'));
const ajv = new Ajv();

export const validateEnv = (envPath: string) => {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));

  const validate = ajv.compile(schema);
  const isValid = validate(envConfig);

  if (!isValid) {
    console.error('Invalid .env configuration:', validate.errors);
    process.exit(1);
  }

  console.log('Environment validated successfully');
  return envConfig;
};
