import React from "react";
import "./App.css";

function App() {
  return (
    <div className="App">
      <img className="App-logo" src="./bot.png" alt="" />
      <h2>ALBERT</h2>
      <h4>Your Personal Assistant</h4>
      <p>
        <iframe
          title="Microsoft Bot Framework"
          src="https://webchat.botframework.com/embed/mysmartbot-bot?s=c3qFXl9Y8WE.cIjSMAPXCAN4nAJPcSejLL5A04nZp3HZAjOfAYkgRDk"
          style={{ minWidth: "400px", width: "100%", minHeight: "500px" }}
        ></iframe>
      </p>
    </div>
  );
}

export default App;
