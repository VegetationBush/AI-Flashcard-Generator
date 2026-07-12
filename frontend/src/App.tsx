import Content from "@/layout/Content"
import Navbar from "@/layout/Navbar";

function App() {
  return (
    <div style = {{
      position: "relative",
      height: "100dvh",
      width: "100dvw",

      backgroundColor: "var(--background)",

      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      <Navbar/>
      <div style = {{
        position: "relative",
        width: "100%",
        maxWidth: "75rem",

        flex: 1,
      }}>
        <Content/>
      </div>
    </div>
  );
}

export default App;