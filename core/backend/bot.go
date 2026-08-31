package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"os"
)

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

type ChatResponse struct {
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
}

func CallBotAgent(userArgument string) (string, error) {
	apiKey := os.Getenv("API_KEY")
	url := "https://openrouter.ai/api/v1/chat/completions"

	// Define the bot persona using system prompts
	payload := ChatRequest{
		Model: "meta-llama/llama-3-8b-instruct:free", // Example free model on OpenRouter
		Messages: []Message{
			{
				Role: "system",
				Content: `You are a harsh code security auditor. Analyze the user's argument for logic flaws. 
				You must respond ONLY with a valid JSON object in this exact format:
				{
				"score": <integer between 0 and 100>,
				"review": "<your detailed critique and security feedback>"}`,
			},
			{
				Role:    "user",
				Content: userArgument,
			},
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var result ChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if len(result.Choices) > 0 {
		return result.Choices[0].Message.Content, nil
	}

	return "No response from bot.", nil
}
