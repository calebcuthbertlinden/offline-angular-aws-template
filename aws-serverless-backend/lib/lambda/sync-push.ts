import { APIGatewayEvent } from 'aws-lambda';
import {
    DynamoDBDocumentClient,
    BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

exports.handler = async function (event: APIGatewayEvent) {
    console.log("request:", JSON.stringify(event, undefined, 2));

    const data = event.body ? JSON.parse(event.body) : {};
    const collection = event.pathParameters?.collection??"";

    if (collection == "nugget") {
        console.log("Nugget sync")

        // TODO - Figure out if its UPDATE or CREATE

        const batch = [];
        for (const doc in data.docs) {
            batch.push({
                PutRequest: {
                    Item: data.docs[doc].newDocumentState
                }
            });
        }

        await batchWrite(batch, process.env.NUGGET_TABLE_NAME??"")
    
    } else if (collection == "identity") {
        console.log("Identity sync")

        // TODO - Figure out if its UPDATE or CREATE

        const batch = [];
        for (const doc in data.docs) {
            batch.push({
                PutRequest: {
                    Item: data.docs[doc].newDocumentState
                }
            });
        }

        await batchWrite(batch, process.env.IDENTITY_TABLE_NAME??"")

    } else {
        console.log("General sync")
    }

    console.log(`Body ${JSON.stringify(data)}`)

    let response = {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true", 
        },
        body: JSON.stringify([])
    }
    return response;
};

/**
 * Writes a batch of items to a DynamoDB table.
 * 
 * @param batch the batch of items to write
 * @param tableName the name of the table to write to
 * @param ddbClient the DynamoDB client to use
 * @returns a promise that resolves when the batch is fully written
 */
async function batchWrite(batch: Record<string, any>[], tableName: string) {

    let chunk: Record<string, any>[] = [];
    let promises = [];

    for (let item of batch) {
        chunk.push(item);

        if (chunk.length === 25) {
            promises.push(batchWriteChunk(chunk, tableName));
            chunk = [];
        }
    }

    if (chunk.length > 0) {
        promises.push(batchWriteChunk(chunk, tableName));
    }

    await Promise.all(promises);

}

/**
 * Writes a chunk of maximum 25 items to a DynamoDB table.
 * 
 * @param batch the chunk of items to write
 * @param tableName the name of the table to write to
 * @param ddbClient the DynamoDB client to use
 * @returns a promise that resolves when the chunk is fully written
 */
async function batchWriteChunk(batch: Record<string, any>[], tableName: string) {

    const client = new DynamoDBClient({});
    const dynamo: DynamoDBDocumentClient = DynamoDBDocumentClient.from(client);

    let response = await dynamo.send(new BatchWriteCommand({
        RequestItems: {
            [tableName]: batch,
        },
    }));

    if (response.UnprocessedItems?.[tableName]) {
        await batchWrite(response.UnprocessedItems[tableName], tableName);
    }

}