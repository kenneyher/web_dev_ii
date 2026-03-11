import express from "express";
import cookieParser from "cookie-parser";

const server = express();

server.listen(9000, () => {
  console.log("Server is running on port 9000");
});