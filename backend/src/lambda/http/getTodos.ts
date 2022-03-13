// Node Modules
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { cors } from 'middy/middlewares'
import 'source-map-support/register'
import * as middy from 'middy'
import * as AWS from 'aws-sdk'
// Own modules
//import { getTodosForUser } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'

// Constants
const DB_TABLE: string = process.env.TODOS_TABLE!;
const DOC_CLIENT = new AWS.DynamoDB.DocumentClient();
const LOGGER = createLogger('getTodos')

// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
     // Get UserId 
      const userId = getUserId(event);
      // Query Todos
      const result = await DOC_CLIENT.query({
        TableName: DB_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: false
      }).promise();
      // Return items
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          Items: result.Items
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

handler.use(
  cors({
    credentials: true
  })
)
