import type { NextApiRequest, NextApiResponse } from "next";

import { getAuth } from "@clerk/nextjs/server";

import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { AttributeValue } from "@aws-sdk/client-dynamodb";

import { z } from "zod";

// https://thomasstep.com/blog/how-to-use-the-dynamodb-document-client

const client = new DynamoDBClient({
  region: "eu-central-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});
const ddbDocClient = DynamoDBDocument.from(client);

type CreateTodoResp = {
  message: string | number;
};

type NewTodo = {
  todoText: string;
  done: boolean;
};

type ChangeTodo = {
  todoText?: string;
  done?: boolean;
};

const NewTodoSchema = z.object({
  todoText: z.string().min(1),
  done: z.boolean(),
});

const ChangeTodoSchema = z.object({
  todoText: z.string().optional(),
  done: z.boolean().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateTodoResp | Record<string, AttributeValue>[]>
) {
  const seshion = getAuth(req);
  const userId = seshion.userId;

  if (userId === null) {
    res.status(403).json({ message: "not authorized" });
  }

  if (req.method === "POST") {
    // validate req body
    try {
      NewTodoSchema.parse(JSON.parse(req.body));
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: "invalid request body" });
    }

    const todo = JSON.parse(req.body) as NewTodo;
    // const todoCreatedAt = new Date().toISOString();
    const todoCreatedAt = Date.now();

    const input = {
      TableName: "todos_dev",
      Item: {
        userId: { S: userId as string },
        createdAt: { N: todoCreatedAt.toString() },
        todoText: { S: todo.todoText },
        // due: { S: todo.due },
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
    const input = {
      TableName: "todos_dev",
      KeyConditionExpression: "userId = :partitionKey",
      ExpressionAttributeValues: {
        ":partitionKey": userId as string,
      },
    };
    const command = new QueryCommand(input);
    const response = await ddbDocClient.send(command);

    if (response.Items) {
      res.status(200).json(response.Items);
    } else {
      res.status(500).json({ message: "failed to get todos" });
    }
  }

  if (req.method === "PUT") {
    try {
      ChangeTodoSchema.parse(JSON.parse(req.body));
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: "invalid request body" });
    }

    const todo = JSON.parse(req.body) as ChangeTodo;
    let myUpdateExpression = "SET ";

    if (todo.done !== undefined) {
      myUpdateExpression += "done = :valdone,";
    }

    if (todo.todoText !== undefined) {
      myUpdateExpression += "todoText = :valtext,";
    }

    if (todo.todoText === undefined && todo.done === undefined) {
      res.status(400).json({ message: "invalid request body" });
    }

    // slice the trailing comma
    myUpdateExpression = myUpdateExpression.slice(0, -1);

    // TODO implement update
  }
}
