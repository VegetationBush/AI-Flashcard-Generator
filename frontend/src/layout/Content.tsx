import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import JSZip from "jszip";
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import Flashcard from "@/elements/Flashcard";
import Card from "@/elements/Card";
import Button from "@/elements/Button";
import "./Content.css";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const WORD_PATTERN = /[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu;
const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "csv",
  "json",
  "xml",
  "html",
  "htm",
  "rtf",
]);

function App() {
  const [message, setMessage] = useState<string[][]>([]);
  const [index, setIndex] = useState<number>(0);
  const [fileName, setFileName] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [parseError, setParseError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function decodeXmlEntities(value: string) {
    return value
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");
  }

  function extractTextFromXml(xml: string, tagName: string) {
    const pattern = new RegExp(`<${tagName}[^>]*>(.*?)<\\/${tagName}>`, "gis");
    const matches = Array.from(xml.matchAll(pattern));
    return matches
      .map((match) => decodeXmlEntities(match[1]).replace(/<[^>]+>/g, " "))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

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

  async function extractOfficeXmlText(file: File, archiveName: string, textTag: string) {
    const archive = await JSZip.loadAsync(await file.arrayBuffer());
    const targetFile = archive.file(archiveName);

    if (!targetFile) {
      throw new Error(`Could not locate the ${archiveName} file inside the uploaded document.`);
    }

    const xml = await targetFile.async("text");
    return extractTextFromXml(xml, textTag);
  }

  async function extractDocxText(file: File) {
    return extractOfficeXmlText(file, "word/document.xml", "w:t");
  }

  async function extractPptxText(file: File) {
    const archive = await JSZip.loadAsync(await file.arrayBuffer());
    const slideFiles = archive.file(/^ppt\/slides\/slide\d+\.xml$/);

    const slideTexts = await Promise.all(
      slideFiles.map(async (slideFile) => {
        const xml = await slideFile.async("text");
        return extractTextFromXml(xml, "a:t");
      }),
    );

    return slideTexts.filter(Boolean).join("\n");
  }

  async function extractDocumentText(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "pdf") {
      return extractPdfText(file);
    }

    if (extension === "docx") {
      return extractDocxText(file);
    }

    if (extension === "pptx") {
      return extractPptxText(file);
    }

    if (TEXT_EXTENSIONS.has(extension ?? "")) {
      return file.text();
    }

    return file.text();
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
    if (!extension) {
      setParseError("Please choose a supported document file.");
      return;
    }

    setIsParsing(true);
    setParseError("");
    setWords([]);
    setMessage([]);
    setIndex(0);

    let parsedWords: string[];
    try {
      const text = await extractDocumentText(file);
      parsedWords = text.match(WORD_PATTERN) ?? [];
      setFileName(file.name);
      setWords(parsedWords);
    } catch (error) {
      console.error(error);
      setFileName("");
      setParseError("This file could not be parsed. It may be damaged, encrypted, or in an unsupported format.");
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
          <p>Upload a document or text file to parse.</p>
        </div>
        <input
          ref={fileInputRef}
          className="file-input"
          type="file"
          accept=".pdf,.txt,.docx,.pptx,.md,.csv,.json,.xml,.html,.htm,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/markdown,text/csv,application/json,application/xml,text/xml,text/html"
          onChange={handleFileChange}
        />
        <Button
          className="upload-button"
          variant="primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isParsing || isGenerating}
        >
          {isParsing ? "Parsing…" : isGenerating ? "Generating…" : "Upload a document"}
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