import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.end("TASKORA EXPRESS OK");
});

app.listen(9191, "0.0.0.0", () => {
  console.log("TASKORA EXPRESS READY");
});