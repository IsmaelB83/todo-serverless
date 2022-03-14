// Node Modules
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as AWS from 'aws-sdk'
// Own modules
import { TodoUpdate } from '../models/TodoUpdate'
import { TodoItem } from '../models/TodoItem'

// Constants
const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)
const DB_CLIENT: DocumentClient = createDynamoDBClient()
const DB_TABLE: string = process.env.TODOS_TABLE!
const DB_INDEX: string = process.env.TODOS_TABLE_INDEX!

/**
* Class to interact with todos table
*/
export class TodosAccess {
  
  constructor() {}
  
  /**
  * Get a todo from database based on its id and owner
  * @param todoId Todo id
  * @param userId Todo owner id
  */
  async get (todoId: string, userId: string): Promise<TodoItem>{
    // Query database
    const result = await DB_CLIENT.query({
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
    // Return
    return result.Items[0] as TodoItem
  }
  
  /**
  * Get all todos from user
  * @param userId Todo owner id
  */
  async getTodos (userId: string): Promise<Object[]>{
    const result = await DB_CLIENT.query({
      TableName: DB_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false
    }).promise()
    const items = result.Items?.map(item => (item as TodoItem))
    return items;
  }
  
  /**
  * Method to create a new todo
  * @param todo Todo information
  * @returns 
  */
  async create (todo: TodoItem): Promise<TodoItem> {
    const params = {
      TableName: DB_TABLE,
      Item: { ...todo }
    }
    await DB_CLIENT.put(params).promise()
    return params.Item
  }
  
  /**
  * Method to update a todo
  * @param todoId Todo to update
  * @param userId Todo owner
  * @param createdAt Creation date of the todo
  * @param todo Todo information to update
  * @returns  
  */
  async update (todoId: string, userId: string, createdAt: string, todo: TodoUpdate): Promise<boolean> {
    // Update token
    await DB_CLIENT.update({
      TableName: DB_TABLE,
      Key: {
        userId: userId,
        createdAt: createdAt
      },
      ConditionExpression: "todoId = :todoId",
      UpdateExpression: "set #name = :name, dueDate=:dueDate, done=:done",
      ExpressionAttributeValues:{
        ":name": todo.name,
        ":dueDate": todo.dueDate,
        ":done": todo.done,
        ":todoId": todoId
      },
      ExpressionAttributeNames: {
        "#name": "name"
      }
    }).promise()
    return true
  }
  
  /**
  * Method to update a todo
  * @param todoId Todo to update
  * @param userId Todo owner
  * @param createdAt Creation date of the todo
  * @param attachmentUrl Todo information to update
  * @returns  
  */
  async updateAttachmentUrl (todoId: string, userId: string, createdAt: string, attachmentUrl: String): Promise<boolean> {
    // Update token
    await DB_CLIENT.update({
      TableName: DB_TABLE,
      Key: {
        userId: userId,
        createdAt: createdAt
      },
      ConditionExpression: "todoId = :todoId",
      UpdateExpression: "set attachmentUrl = :attachmentUrl",
      ExpressionAttributeValues:{
        ":todoId": todoId,
        ":attachmentUrl": attachmentUrl
      }
    }).promise()
    return true
  }
  
  /**
  * Method to delete a todo
  * @param todoId Todo Id 
  * @param userId Todo owner (hash)
  * @param createdAt Creation date of the todo
  * @returns True (deleted) or false (error)
  */
  async delete (todoId: string, userId: string, createdAt: string): Promise<boolean> {
    // Delete token
    await DB_CLIENT.delete({
      TableName: DB_TABLE,
      Key: {
        userId: userId,
        createdAt: createdAt
      },
      ConditionExpression: "todoId = :todoId",
      ExpressionAttributeValues:{
        ":todoId": todoId
      },
    }).promise()
    return true
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }
  return new XAWS.DynamoDB.DocumentClient()
}