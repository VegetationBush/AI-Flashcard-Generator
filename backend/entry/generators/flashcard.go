package generators

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os"

	"github.com/aws/aws-lambda-go/events"
)

func corsHeaders() map[string]string {
	return map[string]string{
		"Access-Control-Allow-Origin":  "http://localhost:5173",
		"Access-Control-Allow-Headers": "Content-Type,Authorization",
		"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
	}
}

type GeminiRequest struct {
	Contents []GeminiContent `json:"contents"`
}

type GeminiContent struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiPart struct {
	Text string `json:"text"`
}

func FlashcardHandler(
	ctx context.Context,
	request events.APIGatewayProxyRequest,
) (events.APIGatewayProxyResponse, error) {

	topic := request.QueryStringParameters["topic"]
	if topic == "" {
		topic = "Give me a short sentence"
	}

	prompt := topic // fmt.Sprintf("Give me a short sentence about %s.", topic)

	body := GeminiRequest{
		Contents: []GeminiContent{
			{
				Parts: []GeminiPart{
					{
						Text: prompt,
					},
				},
			},
		},
	}

	b, err := json.Marshal(body)
	if err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers:    corsHeaders(),
			Body:       err.Error(),
		}, nil
	}

	apiKey := os.Getenv("GEMINI_API_KEY")

	url := "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=" + apiKey

	httpReq, err := http.NewRequest(
		"POST",
		url,
		bytes.NewReader(b),
	)
	if err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers:    corsHeaders(),
			Body:       err.Error(),
		}, nil
	}

	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}

	resp, err := client.Do(httpReq)
	if err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Headers:    corsHeaders(),
			Body:       err.Error(),
		}, nil
	}

	defer resp.Body.Close()

	result, err := io.ReadAll(resp.Body)
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
		Body:       string(result),
	}, nil
}
