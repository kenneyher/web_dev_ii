const express = require("express");
const fs = require("node:fs");

const app = express();
const PORT = 9000;
const filePath = "./products.json";

function hasContent(str) {
  return typeof str == "string" && str.trim();
}

function productExists(productId) {
  const { products } = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  let target = products.find((p) => p.id == productId);

  return target !== undefined;
}

function appendToJSON(newProduct) {
  let { count, products } = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  products.push(newProduct);
  count += 1;
  fs.writeFileSync(
    filePath,
    JSON.stringify({ count, products }, null, 2),
    "utf-8",
  );
}

app.use(express.json());
app.use(express.urlencoded());

app
  .route("/products")
  .get((req, res) => {
    let { count, products } = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    if (req.query.category) {
      const category = req.query.category;
      products = products.filter(
        (product) => product.category.toLowerCase() === category.toLowerCase(),
      );
    }

    if (req.query.subcategory) {
      const subcategory = req.query.subcategory;
      products = products.filter(
        (product) =>
          product.subcategory.toLowerCase() === subcategory.toLowerCase(),
      );
    }

    if (req.query.search) {
      const search = req.query.search.toLowerCase();
      products = products.filter((product) =>
        product.name.toLowerCase().includes(search),
      );
    }

    res.json(products);
  })
  .post((req, res) => {
    let { count } = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const { name, category, subcategory, currency, price, stock, rating } =
      req.body;
    let newProduct = {
      id: 2000 + count,
    };
    const errors = {};

    // Validation
    if (!hasContent(name)) errors.name = "Name is required.";
    if (!hasContent(category)) errors.category = "Category is required.";
    if (!hasContent(subcategory))
      errors.subcategory = "Subcategory is required.";
    if (!hasContent(currency)) errors.currency = "Currency is required.";

    // Improved number validation
    if (isNaN(price) || price < 0)
      errors.price = "Price must be a positive number.";
    if (isNaN(stock) || stock < 0)
      errors.stock = "Stock must be a positive number.";
    if (isNaN(rating) || rating < 0 || rating > 5)
      errors.rating = "Rating must be between 0 and 5.";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        received: {
          name,
          category,
          subcategory,
          price,
          stock,
          rating,
          currency,
        },
        errors,
      });
    } else {
      newProduct = {
        ...newProduct,
        name,
        category,
        subcategory,
        price: Number(price),
        stock: Number(stock),
        rating: Number(rating),
        currency,
      };
      appendToJSON(newProduct);
      res.statusCode = 201;
      res.json({
        msg: "Product created successfully.",
        productId: newProduct.id,
      });
    }
  })

app.put('/products/:id', (req, res, next) => {
  const productId = parseInt(req.params.id, 10);
  
  if (productExists(productId)) next('route')
  else res.status(404).json({msg: "error 404"});
}, (req, res) => {
  const productId = parseInt(req.params.id, 10);
  let { count, products } = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const productIndex = products.findIndex(p => p.id === productId);

  if (productIndex === -1) {
    return res.status(404).json({ error: "Product not found." });
  }

  const { name, category, subcategory, currency, price, stock, rating } = req.body;

  const updatedProduct = {
    ...products[productIndex],
    name, 
    category,
    subcategory,
    currency,
    price: Number(price),
    stock: Number(stock),
    rating: Number(rating)
  };

  products[productIndex] = updatedProduct;
  fs.writeFileSync(
    filePath,
    JSON.stringify({ count, products }, null, 2),
    "utf-8",
  );
  res.json({ msg: "Product updated successfully." });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
