const express = require("express");
const app = express();
const port = 8080;

const products = [
  { id: 1, name: "Wireless Headphones", price: 99.99, category: "Electronics" },
  { id: 2, name: "Smart Watch", price: 149.99, category: "Electronics" },
  { id: 3, name: "Gaming Mouse", price: 49.99, category: "Accessories" },
  { id: 4, name: "Mechanical Keyboard", price: 89.99, category: "Accessories" },
  { id: 5, name: "USB-C Hub", price: 39.99, category: "Accessories" },
  { id: 6, name: "4K Monitor", price: 299.99, category: "Electronics" },
  { id: 7, name: "Laptop Stand", price: 29.99, category: "Office" },
  { id: 8, name: "Bluetooth Speaker", price: 59.99, category: "Audio" },
  { id: 9, name: "Noise Cancelling Earbuds", price: 129.99, category: "Audio" },
  { id: 10, name: "Webcam", price: 69.99, category: "Electronics" },
  { id: 11, name: "External SSD 1TB", price: 159.99, category: "Storage" },
  { id: 12, name: "Portable Charger", price: 34.99, category: "Power" },
  { id: 13, name: "Desk Lamp", price: 24.99, category: "Office" },
  { id: 14, name: "Ergonomic Chair", price: 199.99, category: "Furniture" },
  { id: 15, name: "Standing Desk", price: 399.99, category: "Furniture" },
  { id: 16, name: "Action Camera", price: 249.99, category: "Photography" },
  { id: 17, name: "Tripod", price: 44.99, category: "Photography" },
  { id: 18, name: "Smart Light Bulb", price: 19.99, category: "Smart Home" },
  { id: 19, name: "Wi-Fi Router", price: 129.99, category: "Networking" },
  { id: 20, name: "VR Headset", price: 349.99, category: "Gaming" }
];

app.get('/products', (req, res) => {
  res.json(products);
});

app.post("/products", (req, res) => {
  res.json(products);
});


app.delete("/products", (req, res) => {
  res.json(products);
});
app.put("/products", (req, res) => {
  res.json(products);
});

app.listen(port, () => {
  console.log(`Server listening on localhost:${port}`);
});