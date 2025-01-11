import Ajv from 'ajv'
import dotenv from 'dotenv'
import fs from 'node:fs'

export function validateEnv(envPath: string) {
  const schema = JSON.parse(fs.readFileSync('./.env.schema.json', 'utf-8'))
  const ajv = new Ajv()
  const validate = ajv.compile(schema)

  const envConfig = dotenv.parse(fs.readFileSync(envPath))

  if (validate(envConfig)) {
    console.log('Environment validated successfully')
    return envConfig
  }

  console.error(`Invalid environment file: Field ${validate.errors?.[0].instancePath} ${validate.errors?.[0].message}`)
  process.exit(1)
}
