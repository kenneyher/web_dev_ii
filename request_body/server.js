const express = require("express");
const fs = require("node:fs");

const app = express();
const PORT = 9000;
const filePath = "./products.json";

function hasContent(str) {
  return typeof str == "string" && str.trim();
}

function checkProductExists(req, res, next) {
  let { products } = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const productId = parseInt(req.params.id, 10);
  const product = products.find((p) => p.id === productId);

  if (!product) {
    return res.status(404).json({ msg: "Product not found." });
  } 
  req.product = product;
  next();
}

function validateProduct(req, res, next) {
  const { name, category, subcategory, currency, price, stock, rating } =
    req.body;
  const errors = {};

  // Validation
  if (!hasContent(name)) errors.name = "Name is required.";
  if (!hasContent(category)) errors.category = "Category is required.";
  if (!hasContent(subcategory)) errors.subcategory = "Subcategory is required.";
  if (!hasContent(currency)) errors.currency = "Currency is required.";
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
    req.product = {
      name,
      category,
      subcategory,
      price: Number(price),
      stock: Number(stock),
      rating: Number(rating),
      currency: currency,
    };
    next();
  }
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
  .post(validateProduct, (req, res) => {
    let { count } = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    let newProduct = {
      id: 2000 + count,
    };

    newProduct = {
      ...newProduct,
      ...req.product,
    };
    appendToJSON(newProduct);
    res.statusCode = 201;
    res.json({
      msg: "Product created successfully.",
      productId: newProduct.id,
    });
  });

app.put("/products/:id", checkProductExists, validateProduct, (req, res) => {
  const productId = parseInt(req.params.id, 10);
  let { count, products } = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const productIndex = products.findIndex((p) => p.id === productId);

  const updatedProduct = {
    ...products[productIndex],
    ...req.product,
  };

  products[productIndex] = updatedProduct;
  fs.writeFileSync(
    filePath,
    JSON.stringify({ count, products }, null, 2),
    "utf-8",
  );
  res.json({ msg: "Product updated successfully." });
});

app.delete("/products/:id", checkProductExists, (req, res) => {
  const productId = parseInt(req.params.id, 10);
  let { count, products } = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  products = products.filter((p) => p.id !== productId);
  count -= 1;

  fs.writeFileSync(
    filePath,
    JSON.stringify({ count, products }, null, 2),
    "utf-8",
  );
  res.status(204);
});

app.get("/products/:id", checkProductExists, (req, res) => {
  res.json(req.product);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
