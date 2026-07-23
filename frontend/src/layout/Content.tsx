import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import Flashcard from "@/elements/Flashcard";
import Card from "@/elements/Card";
import Button from "@/elements/Button";
import "./Content.css";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const WORD_PATTERN = /[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu;
const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

function App() {
  const [message, setMessage] = useState<string[][]>([]);
  const [index, setIndex] = useState<number>(0);
  const [fileName, setFileName] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [parseError, setParseError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function extractPdfText(file: File) {
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      pages.push(pageText);
    }

    return pages.join("\n");
  }

  async function generateFlashcards(content: string) {
    const response = await fetch(`${API_URL}/flashcard-generator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    const responseBody: unknown = await response.json();
    if (!response.ok) {
      const errorMessage =
        typeof responseBody === "object" &&
        responseBody !== null &&
        "error" in responseBody &&
        typeof responseBody.error === "string"
          ? responseBody.error
          : "The backend could not generate flashcards.";
      throw new Error(errorMessage);
    }

    if (
      !Array.isArray(responseBody) ||
      !responseBody.every(
        (card) =>
          Array.isArray(card) &&
          card.length === 2 &&
          card.every((value) => typeof value === "string"),
      )
    ) {
      throw new Error("The backend returned an invalid flashcard response.");
    }

    return responseBody as string[][];
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "pdf" && extension !== "txt") {
      setParseError("Please choose a PDF or TXT file.");
      return;
    }

    setIsParsing(true);
    setParseError("");
    setWords([]);
    setMessage([]);
    setIndex(0);

    let parsedWords: string[];
    try {
      const text = extension === "pdf" ? await extractPdfText(file) : await file.text();
      parsedWords = text.match(WORD_PATTERN) ?? [];
      setFileName(file.name);
      setWords(parsedWords);
    } catch (error) {
      console.error(error);
      setFileName("");
      setParseError("This file could not be parsed. It may be damaged or image-only.");
      setIsParsing(false);
      return;
    }

    setIsParsing(false);
    if (parsedWords.length === 0) {
      setParseError("No readable words were found in this file.");
      return;
    }

    setIsGenerating(true);
    try {
      const flashcards = await generateFlashcards(parsedWords.join(" "));
      setMessage(flashcards);
    } catch (error) {
      console.error(error);
      setParseError(error instanceof Error ? error.message : "Flashcard generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }
  
  return (
    <main className="content">
      <section className="file-upload" aria-labelledby="file-upload-title">
        <div>
          <h2 id="file-upload-title">Import study material</h2>
          <p>Upload a PDF or text file to extract its words.</p>
        </div>
        <input
          ref={fileInputRef}
          className="file-input"
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          onChange={handleFileChange}
        />
        <Button
          className="upload-button"
          variant="primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isParsing || isGenerating}
        >
          {isParsing ? "Parsing…" : isGenerating ? "Generating…" : "Upload PDF or TXT"}
        </Button>
        {parseError && <p className="parse-error" role="alert">{parseError}</p>}
        {fileName && !parseError && (
          <div className="parse-result" aria-live="polite">
            <strong>{fileName}</strong>
            <span>{words.length.toLocaleString()} words parsed</span>
            {words.length > 0 && (
              <p title={words.join(" ")}>{words.slice(0, 40).join(" ")}{words.length > 40 ? "…" : ""}</p>
            )}
          </div>
        )}
        {isGenerating && <p className="generation-status" aria-live="polite">Creating flashcards from your document…</p>}
      </section>
      
      <Card style = {{
        position: "relative",
        width: "100%",
        maxWidth: "50rem",
        height: "30rem",
      }}>
        {message.length > 0 ? (
          <Flashcard
            key={index}
            question = {message[index][0]}
            answer = {message[index][1]}
            style = {{
              position: "absolute",
              top: "50%",
              left: "50%",
              translate: "-50% -50%",
            }}
          />
        ) : (
          <p className="flashcard-empty">
            {isGenerating ? "Generating your flashcards…" : "Upload a document to generate flashcards."}
          </p>
        )}

        <nav className="flashcard-navigation" aria-label="Flashcard navigation">
          <Button
            onClick={() => setIndex(index === 0 ? message.length - 1 : index - 1)}
            disabled={message.length < 2}
          >
            Previous
          </Button>
          <span className="flashcard-position" aria-live="polite">
            {message.length > 0 ? `${index + 1} / ${message.length}` : "0 / 0"}
          </span>
          <Button
            onClick={() => setIndex(index === message.length - 1 ? 0 : index + 1)}
            disabled={message.length < 2}
          >
            Next
          </Button>
        </nav>
      </Card>
      
    </main>
  );
}

export default App;