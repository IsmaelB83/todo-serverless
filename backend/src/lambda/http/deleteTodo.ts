import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
//import { deleteTodo } from '../../businessLogic/todos'
import { getUserId } from '../utils'
import * as AWS from 'aws-sdk';

// Constants
const DB_TABLE: string = process.env.GROUPS_TABLE!;
const DOC_CLIENT = new AWS.DynamoDB.DocumentClient();

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    
    // (DONE): Remove a TODO item by id

    // Get Todo information
    const result = await DOC_CLIENT.get({
      TableName: DB_TABLE,
      Key: {
        todoId: todoId
      }
    }).promise()
    
    const userId = getUserId(event);
    if (result.Item.userId === userId) {
      await DOC_CLIENT.delete({
        TableName: DB_TABLE,
        Key: {
          todoId: todoId
        }
      }).promise()
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          Result: 'Ok. Todo deleted',
          Item: result.Item
        })
      }
    } 
    return {
      statusCode: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        Result: `Error. Not authorized to remove todo ${todoId}. Only owner can delete it.`
      })
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
