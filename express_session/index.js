import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import bcrypt from "bcrypt";
import Mongoose, { Schema } from "mongoose";

Moongoose.connect("mongodb://127.0.0.1:27017/sessions");

const userSchema = new Schema({
  username: String,
  password: String,
}, { timestamps: true });

const User = Mongoose.model("User", userSchema);

const server = express();

server.use(session({
  secret: "Meow meoooooow meeeoooow meow meow meow meow meow meeoow meow",
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 5, // 5 minutes
    httpOnly: true,
    secure: false,
    path: "/",
  },
  store: MongoStore.create({
    mongoUrl: "mongodb://127.0.0.1:27017/sessions"
  })
}));
server.use(express.json());
server.use(express.urlencoded());

server.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).json({ message: "Invalid username or password" });
  }
  const hashed = user.password;
  const isCorrect = await bcrypt.compare(password, hashed);
});

server.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
})

server.listen(9000, () => {
  console.log("Server is running on port 9000");
})