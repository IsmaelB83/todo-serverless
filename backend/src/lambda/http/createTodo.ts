import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
//import { createTodo } from '../../businessLogic/todos'
import * as AWS from 'aws-sdk';

// Constants
const DB_TABLE: string = process.env.GROUPS_TABLE!;
const DOC_CLIENT = new AWS.DynamoDB.DocumentClient();

export const handler = middy(
  async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    
    const newTodo: CreateTodoRequest = JSON.parse(event.body)

    const params = {
      TableName: DB_TABLE,
      Item: {
        todoId: context.awsRequestId,
        userId: getUserId(event),
        createAt: new Date().toISOString(),
        ...newTodo
      }
    }
    
    await DOC_CLIENT.put(params).promise()
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        item: params.Item
      })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
