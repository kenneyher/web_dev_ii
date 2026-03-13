import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";

const server = express();

server.use(
  session({
    secret: "cats_not_hats",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 10,
      httpOnly: true,
      secure: false, // only true when HTTPS is enabled
      path: "/",
    },
    store: MongoStore.create({
      mongoUrl: "mongodb://127.0.0.1:27017/session-app"
    })
  }),
);

server.get("/", (req, res) => {
  if (!req.session.auth) req.session.auth = false;
  res.json({ loggedIn: req.session.auth });
});

server.post("/login", (req, res) => {
  if (!req.session.auth) {
    req.session.auth = true;
  }

  res.json({
    loggedIn: req.session.auth,
  });
});

server.post("/logout", (req, res) => {
  if (req.session.auth) {
    req.session.auth = false;
  }

  res.json({
    loggedIn: req.session.auth,
  });
});

server.listen(9000, () => {
  console.log("HTTP server running on port 9000");
});
