// Node modules
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { cors, httpErrorHandler } from 'middy/middlewares'
import 'source-map-support/register'
import * as middy from 'middy'
// Own modules
import { deleteTodo } from '../../helpers/todos'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'

// Constants
const LOGGER = createLogger('auth')

// Handler function to delete a todo
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      // Constants
      const todoId = event.pathParameters.todoId
      // Delete todo
      const result = await deleteTodo(todoId, getUserId(event))
      if (result) {
        // Return OK
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            Result: 'Ok. Todo deleted',
            Item: result
          })
        }
      } else {
        // Return KO
        return {
          statusCode: 401,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            Result: `Error. Not authorized to remove todo ${todoId}. Only owner can delete it.`
          })
        }  
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
