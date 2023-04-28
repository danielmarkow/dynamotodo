import type { NextApiRequest, NextApiResponse } from "next";

import { getAuth } from "@clerk/nextjs/server";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { AttributeValue } from "@aws-sdk/client-dynamodb";

type TodoResp = {
  message: string;
};

const client = new DynamoDBClient({
  region: "eu-central-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});
const ddbDocClient = DynamoDBDocument.from(client);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TodoResp | Record<string, AttributeValue>[]>
) {
  const seshion = getAuth(req);
  const userId = seshion.userId;
  if (userId === null) {
    res.status(403).json({ message: "not authorized" });
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
}
