# AI Study Tool

An AI-powered document processing application that transforms uploaded files into structured schemas using a serverless backend and generative AI. 

---
# Flashcard Generator

Users can provide a document, which is processed through an automated pipeline that extracts text, sends it to Gemini with structured generation constraints, and returns formatted flashcard data for client-side rendering.

## Architecture

The application uses a serverless architecture built around AWS Lambda and AWS SAM:

1. **Document Upload**
   - Users submit a file through the client application.
   - The document is processed and prepared for backend extraction.

2. **Text Extraction Pipeline**
   - Extracted text is sent to an AWS Lambda backend service.
   - The backend handles document processing and prepares content for AI generation.

3. **AI Generation**
   - Extracted content is passed to the Gemini API using structured prompts and response formatting.
   - Gemini transforms raw text into organized flashcard objects.

4. **Client Rendering**
   - The generated response is parsed into structured data.
   - Flashcards are dynamically displayed for studying and review.

## Tech Stack

- **Backend:** Go, AWS Lambda, AWS SAM
- **AI:** Gemini API
- **Frontend:** TypeScript, Node.js
- **Development:** Docker

## Goals

- Create a scalable serverless workflow for AI-powered content generation.
- Build reliable structured outputs from generative AI responses.
- Explore the integration of cloud infrastructure, backend services, and LLM-powered applications.
