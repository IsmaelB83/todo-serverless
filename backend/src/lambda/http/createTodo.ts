// Node modules
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import * as AWS from 'aws-sdk';
// Own modules
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
//import { createTodo } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'

// Constants
const DB_TABLE: string = process.env.TODOS_TABLE!;
const DOC_CLIENT = new AWS.DynamoDB.DocumentClient();
const LOGGER = createLogger('auth')

// Handler function to create a todo
export const handler = middy(
  async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    
    try {
      // Todo object
      const newTodo: CreateTodoRequest = JSON.parse(event.body)
      const attachmentUrl = `${process.env.ATTACHMENT_S3_URL}${context.awsRequestId}`;
      // Dynamo command
      const params = {
        TableName: DB_TABLE,
        Item: {
          todoId: context.awsRequestId,
          userId: getUserId(event),
          createdAt: new Date().toISOString(),
          attachmentUrl, 
          ...newTodo
        }
      }
      // Log
      LOGGER.info('Creating todo', JSON.stringify(params.Item))
      // Put object
      await DOC_CLIENT.put(params).promise()
      // Return OK
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          item: params.Item
        })
      } 
    } catch (e) {
      // Log
      LOGGER.error('Error creating todo', { error: e.message })
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
