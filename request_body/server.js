const express = require("express");
const fs = require("node:fs");

const app = express();
const PORT = 9000;
const filePath = "./products.json";

function hasContent(str) {
  return typeof str == "string" && str.trim();
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
    let { count, products } = JSON.parse(
      fs.readFileSync(filePath, "utf-8"),
    );

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
    let { count } = JSON.parse(
      fs.readFileSync(filePath, "utf-8"),
    );
    const { name, category, subcategory, currency, price, stock, rating } =
      req.body;
    let newProduct = {
      id: 2000 + count,
    };
    let errors = {};

    if (!hasContent(name)) {
      errors.name = "Name must not be empty!";
    }
    if (!hasContent(category)) {
      errors.category = "Category must not be empty!";
    }
    if (!hasContent(subcategory)) {
      errors.subcategory = "Subcategory must not be empty!";
    }
    if (!hasContent(currency)) {
      errors.currency = "Currency must not be empty!";
    }
    if (Number.isNaN(price) || price < 0) {
      errors.price = "Price must be a positive integer!";
    }
    if (Number.isNaN(stock) || price < 0) {
      errors.stock = "Stock must be a positive integer!";
    }
    if (Number.isNaN(rating) || rating < 0 || rating > 5) {
      errors.rating = "Rating must be a positive integer between 0 and 5!";
    }

    if (Object.keys(errors).length > 0) {
      res.statusCode = 400;
      res.json({
        product: {
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
        product: newProduct,
      });
    }
  });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
