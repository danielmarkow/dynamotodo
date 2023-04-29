import { NextResponse } from "next/server";
import { NextFetchEvent, NextRequest } from "next/server";

import { getAuth } from "@clerk/nextjs/server";

import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";

import { z } from "zod";

export const config = {
  runtime: "edge",
  regions: ["fra1"],
};

const client = new DynamoDBClient({
  region: "eu-central-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

type NewTodo = {
  todoText: string;
  done: boolean;
};

type ChangeTodo = {
  createdAt: number;
  todoText?: string;
  done?: boolean;
};

type DeleteTodo = {
  createdAt: number;
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

const DeleteTodoSchema = z.object({
  createdAt: z.number(),
});

export default async function EdgeFunction(
  request: NextRequest,
  context: NextFetchEvent
) {
  const seshion = getAuth(request);
  const userId = seshion.userId;

  if (userId === null) {
    return new Response(
      JSON.stringify({
        message: "not authorized",
      }),
      {
        status: 403,
        headers: {
          "content-type": "application/json",
        },
      }
    );
  }

  if (request.method === "POST") {
    const json = await request.json();

    // validate req body
    try {
      NewTodoSchema.parse(json);
    } catch (error) {
      return new Response(
        JSON.stringify({
          message: "invalid request body",
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json",
          },
        }
      );
    }

    const todo = json as NewTodo;
    const todoCreatedAt = Date.now();

    const input = {
      TableName: "todos_dev",
      Item: {
        userId: { S: userId as string },
        createdAt: { N: todoCreatedAt.toString() },
        todoText: { S: todo.todoText },
        done: { BOOL: todo.done },
      },
      ReturnValues: "ALL_OLD",
    };

    const command = new PutItemCommand(input);
    const response = await client.send(command);

    if (response) {
      return new Response(
        JSON.stringify({
          message: todoCreatedAt,
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          message: "failed to create db entry",
        }),
        {
          status: 500,
          headers: {
            "content-type": "application/json",
          },
        }
      );
    }
  }

  if (request.method === "PUT") {
    const json = await request.json();

    try {
      ChangeTodoSchema.parse(json);
    } catch (error) {
      return new Response(
        JSON.stringify({
          message: "invalid request body",
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json",
          },
        }
      );
    }

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
      return new Response(
        JSON.stringify({
          message: "invalid request body",
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json",
          },
        }
      );
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
      return new Response(
        JSON.stringify({
          message: "successfully modified",
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          message: "error updating",
        }),
        {
          status: 500,
          headers: {
            "content-type": "application/json",
          },
        }
      );
    }
  }

  if (request.method === "DELETE") {
    console.log("here");
    const json = await request.json();
    // validate req body
    try {
      DeleteTodoSchema.parse(json);
    } catch (error) {
      return NextResponse.json({
        message: "invalid request body",
        status: 400,
      });
    }

    const todo = json as DeleteTodo;

    await client.send(
      new DeleteItemCommand({
        TableName: "todos_dev",
        Key: {
          userId: { S: userId },
          createdAt: { N: todo.createdAt.toString() },
        },
      })
    );

    return new Response(
      JSON.stringify({
        message: "deleted",
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }
    );
  }
}
