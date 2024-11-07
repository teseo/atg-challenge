import { APIGatewayProxyHandler } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { dynamoDb } from '../lib/dynamodb';
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';
import { TodoItem } from '../interfaces/todo-item';

const tableName = process.env.TABLE_NAME;

interface requestData {
  task: string,
  completed: string,
}

const parseBody = (body: string | null): requestData => {
  if (body == null) {
    throw new Error('Request body is undefined or null');
  }

  try {
    return JSON.parse(body);
  } catch (e) {
    throw new Error('Invalid JSON in request body');
  }
};


const validateData = (body: requestData | null) => {
  if (!body || !body.task) {
    throw new Error('Task is missing in request body');
  }

  return body;
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    //validation & parsing
    const parsedBody = parseBody(event.body);
    const data = validateData(parsedBody);

    //business
    const item: TodoItem = {
      id: uuidv4(),
      task: data.task,
      completed: !!data.completed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const params: PutCommandInput = {
      TableName: tableName as string,
      Item: item,
      ConditionExpression: 'attribute_not_exists(id)',
    };

    await dynamoDb.send(new PutCommand(params));

    //output
    return {
      statusCode: 201,
      body: JSON.stringify(item),
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom value',
      },
    };
  } catch (error) {
    console.error('Error creating to-do item:', error);

    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Could not create to-do item',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        requestId: event.requestContext
          ? event.requestContext.requestId
          : 'N/A',
        debugInfo: 'This is some debug info',
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'error',
      },
    };
  }
};
