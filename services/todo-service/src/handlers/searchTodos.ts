import { APIGatewayProxyHandler } from 'aws-lambda';
import { ScanCommand } from '@aws-sdk/client-dynamodb';
import { dynamoDb } from '../lib/dynamodb';
import { ScanCommandInput } from '@aws-sdk/lib-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const tableName = process.env.TABLE_NAME;

interface bodyRequest {
  searchString: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    //validation

    const { query } = event.queryStringParameters;

    if (!query) {
      throw new Error('Query parameter query is missing');
    }

    //business

    const params: ScanCommandInput = {
      TableName: tableName,
      FilterExpression: 'contains (#task, :searchString)',
      ExpressionAttributeNames: {
        '#task': 'task',
      },
      ExpressionAttributeValues: {
        ':searchString': { S: query },
      },
    };

    try {
      const result = await dynamoDb.send(new ScanCommand(params));
      if (!result || result.Items?.length === 0) {
        console.log('No items found');
      }
      console.log('Results found');
      const items = result.Items?.map((item) => unmarshall(item)) || [];

      return {
        statusCode: 200,
        body: JSON.stringify(items),
      };


    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'DynamoDB scan failed',
          message: error.message,
          stack: error.stack,
          additionalInfo: 'This is some extra info',
          timestamp: new Date().toISOString(),
          requestId: event.requestContext.requestId,
        }),
      };
    }
  } catch (error) {
    console.error('An error occurred', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Could not search to-do items',
        message: error.message,
        stack: error.stack,
        additionalInfo: 'This is some extra info',
        timestamp: new Date().toISOString(),
        requestId: event.requestContext.requestId,
      }),
    };
  }
};
