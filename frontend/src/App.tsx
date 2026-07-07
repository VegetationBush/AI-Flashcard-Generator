import { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");

  async function callLambda() {
    try {
      const response = await fetch(
        "http://localhost:3000/hello"
      );

      const data = await response.json();

      setMessage(data.message + Date.now());
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