import express from "express";
import cookieParser from "cookie-parser";

const server = express();

server.use(cookieParser("123456789")); // Secret key for signing cookies

server.get("/", (req, res) => {
  console.log("Unsigned Cookies:", JSON.stringify(req.cookies));
  console.log("Signed Cookies:", JSON.stringify(req.signedCookies));

  res.cookie("_first_cookie", "Hello world for cookies.");
  res.cookie("_signed_cookie", "Hello from signed cookies.", {
    maxAge: 1000 * 60 * 2, // 2 minutes
    signed: true,
    httpOnly: true,
  })
  if (req.cookies._first_cookie) {
    res.clearCookie("_first_cookie");
  }
  res.json({
    message: "Cookie information was logged to the console",
  })
})

server.listen(9000, () => {
  console.log("Server is running on port 9000");
});