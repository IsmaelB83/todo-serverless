// Node modules
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
// Own modules
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createTodo } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'

// Constants
const LOGGER = createLogger('auth')

// Handler function to create a todo
export const handler = middy(
  async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {  
    try {
      // Todo object
      const newTodo: CreateTodoRequest = JSON.parse(event.body)
      // Create todo
      const todo = await createTodo(newTodo, getUserId(event), context.awsRequestId);
      // Return OK
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          item: todo
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
