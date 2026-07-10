package generators

import (
	"context"
	"encoding/json"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"google.golang.org/genai"
)

func corsHeaders() map[string]string {
	return map[string]string{
		"Access-Control-Allow-Origin":  "http://localhost:5173",
		"Access-Control-Allow-Headers": "Content-Type,Authorization",
		"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
	}
}

// client is created once and reused across warm Lambda invocations.
var client *genai.Client

func getClient(ctx context.Context) (*genai.Client, error) {
	if client != nil {
		return client, nil
	}

	c, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  os.Getenv("GEMINI_API_KEY"),
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		return nil, err
	}

	client = c
	return client, nil
}

func FlashcardHandler(
	ctx context.Context,
	request events.APIGatewayProxyRequest,
) (events.APIGatewayProxyResponse, error) {

	topic := request.QueryStringParameters["topic"]
	if topic == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers:    corsHeaders(),
			Body:       "Cannot pass empty string",
		}, nil
	}

	prompt := topic // fmt.Sprintf("Give me a short sentence about %s.", topic)

	geminiClient, err := getClient(ctx)
	if err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers:    corsHeaders(),
			Body:       err.Error(),
		}, nil
	}

	var items int64 = 2
	schema := &genai.Schema{
		Type: genai.TypeArray,
		Items: &genai.Schema{
			Type: genai.TypeArray,
			Items: &genai.Schema{
				Type: genai.TypeString,
			},
			MinItems:    &items,
			MaxItems:    &items,
			Description: "ind 0 = question, ind 1 = answer",
		},
	}

	config := &genai.GenerateContentConfig{
		ResponseMIMEType: "application/json",
		ResponseSchema:   schema,
	}

	result, err := geminiClient.Models.GenerateContent(
		ctx,
		"gemini-3.1-flash-lite",
		genai.Text(prompt),
		config,
	)
	if err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers:    corsHeaders(),
			Body:       err.Error(),
		}, nil
	}
	var flashcards [][]string
	if err := json.Unmarshal([]byte(result.Text()), &flashcards); err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers:    corsHeaders(),
			Body:       "failed to parse flashcards: " + err.Error(),
		}, nil
	}

	responseBody, err := json.Marshal(flashcards)
	if err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers:    corsHeaders(),
			Body:       err.Error(),
		}, nil
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers:    corsHeaders(),
		Body:       string(responseBody),
	}, nil
}
