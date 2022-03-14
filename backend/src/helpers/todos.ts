// Node Modules
// Own Modules
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { TodosAccess } from './todosAcess'
import { getAttachmentUploadUrl } from './attachmentUtils'

// Constants
const TODOS_ACCESS = new TodosAccess()

/**
* Receives new todo information and interacts with datalayer to INSERT a new todo in the database
* @param todo Todo information received from client
* @param event API Gateway generates the event
* @param context Used to obtain the UUID
* @returns Returns the new todo in database
*/
export async function createTodo(todo: CreateTodoRequest, userId: string, uuid: string): Promise<TodoItem> {
  // Create todo
  return await TODOS_ACCESS.create({
    userId: userId,
    todoId: uuid,
    createdAt: new Date().toISOString(),
    done: false,
    ...todo
  })
}

/**
* Receives new todo information and interacts with datalayer to UPDATE an existing todo in the database
* @param todoId TodoId to update
* @param updatedTodo New Todo information
* @param event API Gateway generates the event
* @returns True (update corret) or False (error updating)
*/
export async function updateTodo(todoId: string, updatedTodo: UpdateTodoRequest, userId: string): Promise<boolean> {
  // Get old todo information
  const todo = await TODOS_ACCESS.get(todoId, userId)
  // Check user id of token is the same as user in bearer
  if (todo && todo.userId === userId) {
    const newTodo = {
      name: updatedTodo.name || todo.name,
      dueDate: updatedTodo.dueDate || todo.dueDate,
      done: updatedTodo.done
    }
    return await TODOS_ACCESS.update(todoId, userId, todo.createdAt, newTodo)
  }
  throw `User not authorized to update todo ${todoId}`
}

/**
* Receives a todoId and interacts with datalayer to DELETE the todo from database
* @param todoId TodoId to delete
* @param event API Gateway generates the event
* @returns True (delete corret) or False (error deleting)
*/
export async function deleteTodo(todoId: string, userId: string): Promise<boolean> {
  // Get old todo information
  const todo = await TODOS_ACCESS.get(todoId, userId)
  // Check user id of token is the same as user in bearer
  if (todo && todo.userId === userId) {
    return await TODOS_ACCESS.delete(todoId, userId, todo.createdAt)
  }
  throw `User not authorized to delete todo ${todoId}`
}

/**
* Receives the API event and interacts with datalayer to RETRIEVES all todos from user
* @param event API Gateway generates the event
* @returns List of todos from user
*/
export async function getTodosForUser(userId: string): Promise<Object[]> {
  // Get todos
  return await TODOS_ACCESS.getTodos(userId)
}

/**
* Interact with attachment utils to generate the pre-signed url from S3 bucket, and update the todo accordingly
* @param todoId TodoId to generate the presigned url
* @param event API Gateway generates the event
* @returns String representing the presigned url
*/
export async function createAttachmentPresignedUrl(todoId: string, userId: string): Promise<String> {
  // Get old todo information
  const todo = await TODOS_ACCESS.get(todoId, userId)
  // Check user id of token is the same as user in bearer
  if (todo && todo.userId === userId) {
    // Constants
    const presignedUrl = await getAttachmentUploadUrl(todoId)
    // Update attachment url
    TODOS_ACCESS.updateAttachmentUrl(todoId, userId, todo.createdAt, `${process.env.ATTACHMENT_S3_URL}${todoId}`)
    // Return presigned url
    return presignedUrl
  } 
  throw `User not authorized to modify todo ${todoId}`
}