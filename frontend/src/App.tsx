import { useState } from "react";
import "./App.css";
// import * as pdfjsLib from "pdfjs-dist";

const URL = import.meta.env.VITE_API_URL

function App() {
  const [message, setMessage] = useState<string[][] | null>();
  const topic = "Give 5 questions and 5 answers"
  async function callLambda() {
    try {
      const response = await fetch(`${URL}/flashcard-generator?topic=${encodeURIComponent(topic)}`, {
        method: "GET",
      });

      const data = await response.json();
      console.log(data)
      setMessage(data);
    } catch (error) {
      console.error(error);
    }
  }
  
  return (
    <div>
      <button onClick={callLambda}>
        Call Backend
      </button>

      {
        message?.map((item,idx) => {
          return <div key={idx}>
            <h2>{item[0]}</h2>
            <p>{item[1]}</p>
          </div>
        })
      }
    </div>
  );
}

export default App;