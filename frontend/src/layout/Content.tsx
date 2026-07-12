import { useState } from "react";
import Flashcard from "@/elements/Flashcard";
import Card from "@/elements/Card";

const URL = import.meta.env.VITE_API_URL

function App() {
  const [message, setMessage] = useState<string[][] | null>([["test1", "answer1"],["test2", "answer2"],["test3", "answer3"]]);
  const [index, setIndex] = useState<number>(0);

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
    <div style = {{
        height: "100%",
        width: "100%",

        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",

        padding: "1rem",
        gap: "3rem",
    }}>
      <button
        style = {{
          position: "relative",
          backgroundColor: "red",
        }}
        onClick = {callLambda}
      >
        Upload File
      </button>

      
      <Card style = {{
        position: "relative",
        width: "100%",
        maxWidth: "50rem",
        height: "30rem",
      }}>
        {
          message && <Flashcard
            question = {message[index][0]}
            answer = {message[index][1]}
            style = {{
              position: "absolute",
              top: "50%",
              left: "50%",
              translate: "-50% -50%",
            }}
          />
        }

        <button
          onClick = {() => message && setIndex(index == message.length - 1 ? 0 : index + 1)}
          style = {{
            position: "absolute",
            right: "3rem",
            bottom: "3rem",

            backgroundColor: "var(--secondary)",
            padding: "0.5rem 1rem 0.5rem 1rem",
          }}
        >
          Next
        </button>
        
        <button
          onClick = {() => message && setIndex(index == 0 ? message.length - 1 : index - 1)}
          style = {{
            position: "absolute",
            right: "8rem",
            bottom: "3rem",

            backgroundColor: "var(--secondary)",
            padding: "0.5rem 1rem 0.5rem 1rem",
          }}
        >
          Previous
        </button>

        
      </Card>
      
    </div>
  );
}

export default App;