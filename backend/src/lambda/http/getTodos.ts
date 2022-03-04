import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
//import { getTodosForUser as getTodosForUser } from '../../businessLogic/todos'
import { getUserId } from '../utils';
import * as AWS from 'aws-sdk';

// Constants
const DB_TABLE: string = process.env.TODOS_TABLE!;
const DOC_CLIENT = new AWS.DynamoDB.DocumentClient();

// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

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
  }
)

handler.use(
  cors({
    credentials: true
  })
)
