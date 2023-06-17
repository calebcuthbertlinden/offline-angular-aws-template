import { APIGatewayEvent } from 'aws-lambda';
import {
    DynamoDBDocumentClient,
    ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

exports.handler = async function (event: APIGatewayEvent) {
    console.log("request:", JSON.stringify(event, undefined, 2));

    const client = new DynamoDBClient({});
    const dynamo: DynamoDBDocumentClient = DynamoDBDocumentClient.from(client);

    const collection = event.pathParameters?.collection??"";
    if (collection == "nugget") {
        console.log("Nugget sync")
        const fetchResponse = await dynamo.send(new ScanCommand({TableName: process.env.NUGGET_TABLE_NAME??""}));
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true", 
            },
            body: JSON.stringify(fetchResponse.Items)
        }
    } else if (collection == "identity") {
        console.log("Identity sync")
        const fetchResponse = await dynamo.send(new ScanCommand({TableName: process.env.IDENTITY_TABLE_NAME??""}));
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true", 
            },
            body: JSON.stringify(fetchResponse.Items)
        }
    } else {
        console.log("General sync")
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true", 
            },
            body: JSON.stringify([])
        }
    }
};