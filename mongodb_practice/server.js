// server.js
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

const app = express();
app.use(express.json());

console.log(process.env.MONGODB_URI);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Database connected"))
  .catch((err) => console.error(err));

app.post("/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.put("/users/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json(updatedUser);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.put("/users/deactivate/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      {
        new: true,
        runValidators: true,
      },
    );
    res.json(updatedUser);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.delete("/users/:id", async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

app.get("/users/active", async (req, res) => {
  const activeUsers = await User.find({ isActive: true });
  res.json(activeUsers);
});

app.listen(3000, () => console.log("Server running on port 3000"));
