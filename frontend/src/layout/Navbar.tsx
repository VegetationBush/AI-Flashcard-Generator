import "./Navbar.css"

export default function Navbar() {
  return (
    <header
      className = "navbar"
      style = {{
        display: "flex",
        padding: "0rem 2rem 0rem 2rem",
        alignItems: "center",
      }}
    >
      <h1>AI Flashcard Generator</h1>
    </header>
  );
}