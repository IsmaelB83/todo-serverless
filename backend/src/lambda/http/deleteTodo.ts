// Node modules
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { cors, httpErrorHandler } from 'middy/middlewares'
import 'source-map-support/register'
import * as middy from 'middy'
import * as AWS from 'aws-sdk';
// Own modules
//import { deleteTodo } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'

// Constants
const DB_TABLE: string = process.env.TODOS_TABLE!;
const DB_INDEX: string = process.env.TODOS_TABLE_INDEX!;
const DOC_CLIENT = new AWS.DynamoDB.DocumentClient();
const LOGGER = createLogger('auth')

// Handler function to delete a todo
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      // Constants
      const todoId = event.pathParameters.todoId
      const userId = getUserId(event);
      // Get Todo information
      const result = await DOC_CLIENT.query({
        TableName: DB_TABLE,
        IndexName: DB_INDEX,
        KeyConditionExpression: 'userId = :userId and todoId = :todoId',
        ExpressionAttributeValues: {
            ':userId': userId,
            ':todoId': todoId
          },
        ScanIndexForward: false,
        Limit : 1
      }).promise()
      LOGGER.info('Todo to be deleted, ', JSON.stringify(result.Items));
      // Check user id of token is the same as user in bearer
      if (result.Items && result.Items[0].userId === userId) {
        const todo = result.Items[0];
        // Delete token
        await DOC_CLIENT.delete({
          TableName: DB_TABLE,
          Key: {
            userId: todo.userId,
            createdAt: todo.createdAt
          },
          ConditionExpression: "todoId = :todoId",
          ExpressionAttributeValues:{
            ":todoId": todoId
          },
        }).promise()
        LOGGER.info('Todo deleted, ', JSON.stringify(todo));
        // Return OK
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            Result: 'Ok. Todo deleted',
            Item: todo
          })
        }
      } 
      // Return KO
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          Result: `Error. Not authorized to remove todo ${todoId}. Only owner can delete it.`
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
