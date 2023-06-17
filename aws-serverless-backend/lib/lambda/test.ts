import { APIGatewayEvent } from 'aws-lambda';

exports.handler = async function (event: APIGatewayEvent) {
    console.log("request:", JSON.stringify(event, undefined, 2));
    let response = {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true", 
        },
        body: JSON.stringify({ message: `Successfully hit @ ${event.path}` })
    }
    return response;
};