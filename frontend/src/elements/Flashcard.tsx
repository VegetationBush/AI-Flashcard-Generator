import { useState } from "react";
import "./Flashcard.css";
import React from "react";

type FlashcardProps = {
  question: string;
  answer: string;
  style?: React.CSSProperties;
};

export default function Flashcard({ question, answer, style }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      className="flashcard"

      style = {{
        ...style
      }}
      onClick={() => setFlipped(!flipped)}
    >
      <div className="flashcard-content">
        <p>{flipped ? answer : question}</p>
      </div>

      <span className="flashcard-hint">
        Click to flip
      </span>
    </button>
  );
}