// Node modules
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { cors, httpErrorHandler } from 'middy/middlewares'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as middy from 'middy'
// Own modules
//import { createAttachmentPresignedUrl } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'

// Constants
const S3 = new AWS.S3({ signatureVersion: 'v4' });
const BUCKET: string = process.env.ATTACHMENT_S3_BUCKET!;
const EXPIRATION: number = parseInt(process.env.SIGNED_URL_EXPIRATION || "300");
const LOGGER = createLogger('getTodos')

// Handler function to generate a pre-signed url to upload an image to the bucket
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      // Constants
      const todoId = event.pathParameters.todoId
      LOGGER.debug('Generate pre-signed url for todo: ', todoId)
      // Generate pre-signed url
      const uploadUrl = await S3.getSignedUrl('putObject', {
        Bucket: BUCKET,
        Key: todoId,
        Expires: EXPIRATION
      })
      // Upload attachemnt URL on dynamo 
      // (better approach would be to connect a lambda to the S3 event, and update the attachment url once the client upload the image to the bucket)
      console.log('PENDING UPDATE DYNAMO');
      // Return Ok
      return {
          statusCode: 200,
          headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Credentials': true
          },
          body: JSON.stringify({
              uploadUrl
          })
      }     
    } catch (e) {
      // Log
      LOGGER.error('Error deleting todo', { error: e.message })
      // Return KO
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          result: e.message
        })
      } 
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
