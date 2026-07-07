package main

import (
	"context"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

func handler(
	ctx context.Context,
	request events.APIGatewayProxyRequest,
) (events.APIGatewayProxyResponse, error) {

	return events.APIGatewayProxyResponse{

		StatusCode: 200,

		Headers: map[string]string{
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Headers": "*",
			"Content-Type":                 "application/json",
		},

		Body: `{"message": "Hello from local Lambda!"}`,
	}, nil
}

func main() {
	lambda.Start(handler)
}
