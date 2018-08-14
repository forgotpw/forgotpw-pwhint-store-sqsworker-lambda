'use strict';

const AWS = require('aws-sdk');
const config = require('./config')
const logger = require('./logger')
const PwhintStoreService = require('./pwhintStoreService/pwhintStoreService')

async function handler(event, context, done) {
  try {
    let promises = []
    for (let message of event.Records) {
      promises.push(processMessage(message.body))
    }
    await Promise.all(promises)
    done()
  }
  catch (err) {
    done(err)
  }
}

async function deleteMessage(receiptHandle) {
  const sqs = new AWS.SQS({region: config.AWS_REGION});
  const awsAccountId = await getAwsAccountId()
  const queueUrl = `https://sqs.${config.AWS_REGION}.amazonaws.com/${awsAccountId}/${config.STORE_SQS_QUEUE_NAME}}`

  await sqs.deleteMessage({
    ReceiptHandle: receiptHandle,
    QueueUrl: queueUrl
  }).promise()
}

async function processMessage(messageBody) {
  const message = JSON.parse(messageBody)

  if (message.action != 'store')
    throw Error('Unexpected action in message: ' + message.action)

  const pwhintStoreService = new PwhintStoreService()
  await pwhintStoreService.StorePwhint(
    message.hint,
    message.application,
    message.normalizedPhone)
  await deleteMessage(event.ReceiptHandle)
}

async function getAwsAccountId() {
  const sts = new AWS.STS();
  const params = {};
  let data = await sts.getCallerIdentity(params).promise()
  return data.Account
}

module.exports.handler = handler
