import type { NextApiRequest, NextApiResponse } from "next";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { AttributeValue } from "@aws-sdk/client-dynamodb";

// https://thomasstep.com/blog/how-to-use-the-dynamodb-document-client

const client = new DynamoDBClient({
  region: "eu-central-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

type CreateTodoResp = {
  message: string | number;
};

type NewTodo = {
  todoText: string;
  due: string;
  done: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateTodoResp | Record<string, AttributeValue>[]>
) {
  if (req.method === "POST") {
    const todo = req.body as NewTodo;
    const todoCreatedAt = new Date().toISOString();

    const input = {
      TableName: "todos_dev",
      Item: {
        userId: { S: "daniel" },
        createdAt: { S: todoCreatedAt },
        todoText: { S: todo.todoText },
        due: { S: todo.due },
        done: { BOOL: todo.done },
      },
      ReturnValues: "ALL_OLD",
    };

    const command = new PutItemCommand(input);
    const response = await client.send(command);

    if (response) {
      res.status(200).json({ message: todoCreatedAt });
    } else {
      res.status(500).json({ message: "failed to create db entry" });
    }
  }

  if (req.method === "GET") {
    const ddbDocClient = DynamoDBDocument.from(client);
    const input = {
      TableName: "todos_dev",
      KeyConditionExpression: "userId = :partitionKey",
      ExpressionAttributeValues: {
        ":partitionKey": "daniel",
      },
    };
    const command = new QueryCommand(input);
    const response = await ddbDocClient.send(command);
    ddbDocClient.destroy();
    if (response.Items) {
      res.status(200).json(response.Items);
    } else {
      res.status(500).json({ message: "failed to get todos" });
    }
  }
}