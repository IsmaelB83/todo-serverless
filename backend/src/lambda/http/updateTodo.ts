// Node modules
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { cors, httpErrorHandler } from 'middy/middlewares'
import 'source-map-support/register'
import * as middy from 'middy'
// Own modules
import { updateTodo } from '../../helpers/todos'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'

// Constants
const LOGGER = createLogger('auth')

// Handler function to update a todo
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      // Constants
      const todoId = event.pathParameters.todoId
      const updatedTodo = JSON.parse(event.body)
      // Update todo
      const todo = await updateTodo(todoId, updatedTodo, getUserId(event))
      if (todo) {
         // Return OK
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            Result: 'Ok. Todo updated',
          })
        }
      }
      // Return KO
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          Result: `Not authorized to update todo ${todoId}. Only owner can update it.`
        })
      }  
    } catch (e) {
      // Log
      LOGGER.error('Error updating todo', { error: e.message })
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
