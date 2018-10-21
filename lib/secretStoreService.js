const AWS = require('aws-sdk')
const config = require('../config')
const logger = require('../logger')

class SecretStoreService {
  constructor() {}

  async storeSecret(secret, rawApplication, normalizedApplication, normalizedPhone) {
    logger.info(`Storing secret for ${normalizedPhone}, application: ${normalizedApplication}, secret:(${secret.length} chars)`)

    // Note: all data validation and massaging should have been done in the
    // REST API ahead of time so no need to reproduce that here

    let s3key = `users/${normalizedPhone}/data/${normalizedApplication}.json`

    let data = {
      rawApplication: rawApplication,
      secret: secret
    }
    let body = JSON.stringify(data)

    logger.debug(`Updating ${body.length} chars to s3://${config.USERDATA_S3_BUCKET}/${s3key}`)

    try {
      const s3 = new AWS.S3()
      let resp = await s3.putObject({
        Bucket: config.USERDATA_S3_BUCKET,
        Key: s3key,
        ServerSideEncryption: 'AES256',
        Body: body,
        ContentType: 'application/json'
      }).promise()
  
      logger.trace(`S3 PutObject response for s3://${config.USERDATA_S3_BUCKET}/${s3key}:`, resp)
    }
    catch (err) {
      logger.error(`Error updating s3://${config.USERDATA_S3_BUCKET}/${s3key}:`, err)
      throw err
    }

    logger.info(`Successfully updated ${body.length} chars to s3://${config.USERDATA_S3_BUCKET}/${s3key}`)
  }

}

module.exports = SecretStoreService