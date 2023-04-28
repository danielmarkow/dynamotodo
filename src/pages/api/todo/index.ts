import { NextResponse } from "next/server";
import { NextFetchEvent, NextRequest } from "next/server";

import { getAuth } from "@clerk/nextjs/server";

import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";

import { AttributeValue } from "@aws-sdk/client-dynamodb";

import { z } from "zod";

export const config = {
  runtime: "edge",
  regions: ["fra1"],
};

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
  done: boolean;
};

type ChangeTodo = {
  createdAt: number;
  todoText?: string;
  done?: boolean;
};

const NewTodoSchema = z.object({
  todoText: z.string().min(1),
  done: z.boolean(),
});

const ChangeTodoSchema = z.object({
  createdAt: z.number(),
  todoText: z.string().optional(),
  done: z.boolean().optional(),
});

export default async function EdgeFunction(
  request: NextRequest,
  context: NextFetchEvent
) {
  const seshion = getAuth(request);
  const userId = seshion.userId;

  if (userId === null) {
    // res.status(403).json({ message: "not authorized" });
    return NextResponse.json({ message: "not authorized", status: 403 });
  }

  const json = await request.json();

  if (request.method === "POST") {
    // validate req body
    try {
      NewTodoSchema.parse(json);
    } catch (error) {
      // res.status(400).json({ message: "invalid request body" });
      return NextResponse.json({
        message: "invalid request body",
        status: 400,
      });
    }

    const todo = json as NewTodo;
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
      // res.status(200).json({ message: todoCreatedAt });
      return NextResponse.json({ message: todoCreatedAt, status: 200 });
    } else {
      // res.status(500).json({ message: "failed to create db entry" });
      return NextResponse.json({
        message: "failed to create db entry",
        status: 500,
      });
    }
  }

  if (request.method === "PUT") {
    try {
      ChangeTodoSchema.parse(json);
    } catch (error) {
      // res.status(400).json({ message: "invalid request body" });
      return NextResponse.json({
        message: "invalid request body",
        status: 400,
      });
    }

    // const todo = JSON.parse(req.body) as ChangeTodo;
    const todo = json as ChangeTodo;
    let myUpdateExpression = "SET ";
    let myExpressionAttributeValues = {} as {
      ":valdone"?: { BOOL: boolean };
      ":valtext"?: { S: string };
    };

    if (todo.done !== undefined) {
      myUpdateExpression += "done = :valdone,";
      myExpressionAttributeValues[":valdone"] = { BOOL: todo.done };
    }

    if (todo.todoText !== undefined) {
      myUpdateExpression += "todoText = :valtext,";
      myExpressionAttributeValues[":valtext"] = { S: todo.todoText };
    }

    if (todo.todoText === undefined && todo.done === undefined) {
      // res.status(400).json({ message: "invalid request body" });
      return NextResponse.json({
        message: "invalid request body",
        status: 400,
      });
    }

    // slice the trailing comma
    myUpdateExpression = myUpdateExpression.slice(0, -1);

    const { Attributes } = await client.send(
      new UpdateItemCommand({
        TableName: "todos_dev",
        Key: {
          userId: { S: userId as string },
          createdAt: { N: todo.createdAt.toString() },
        },
        UpdateExpression: myUpdateExpression,
        ExpressionAttributeValues: myExpressionAttributeValues,
        ReturnValues: "ALL_NEW",
      })
    );

    if (Attributes) {
      // res.status(200).json({ message: "successfully modfiyed" });
      return NextResponse.json({
        message: "successfully modfiyed",
        status: 200,
      });
    } else {
      // res.status(500).json({ message: "error updating" });
      return NextResponse.json({ message: "error updating", status: 500 });
    }
  }
}
