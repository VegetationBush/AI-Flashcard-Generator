package main

import (
	generators "backend/entry/generators"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	lambda.Start(generators.FlashcardHandler)
}
