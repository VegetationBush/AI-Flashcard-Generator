import { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const topic = "What is 5 + 5"
  async function callLambda() {
    try {
      const response = await fetch(`http://localhost:3000/flashcard-generator?topic=${encodeURIComponent(topic)}`, {
        method: "GET",
      });

      const data = await response.json();
      console.log(data)
      setMessage(data.candidates[0].content.parts[0].text);
    } catch (error) {
      console.error(error);
      setMessage("Failed to connect to backend");
    }
  }

  return (
    <>
      <button onClick={callLambda}>
        Call Backend
      </button>

      <p>{message}</p>
    </>
  );
}

export default App;