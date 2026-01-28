const express = require("express");
const fs = require("node:fs");


const app = express();
const PORT = 9000;
const filePath = "./products.json";

function hasContent(str) {
  return typeof str == "string" && str.trim();
}

function appendToJSON(data) {
  const jsonLine = JSON.stringify(data) + "\n";
  fs.appendFile(filePath, jsonLine, (err) => {
    if (err) throw err;
    console.log("Failed to append data to JSON:", data);
  });
}

app.use(express.json());
app.use(express.urlencoded());

app.route("/products").get((req, res) => {
  let { count, products } = JSON.parse(
    fs.readFileSync("./products.json", "utf-8"),
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
    const { name, category, subcategory, currency, price, stock, rating } = req.body;
    let newProduct = {
      id: generateID()
    };
    let errors = {};
    let { count } = JSON.parse(
      fs.readFileSync("./products.json", "utf-8"),
    );

    const id = 2000 + count + 1;

    if (!hasContent(name)) {
      errors.name = "Name must not be empty!"
    }
    if (!hasContent(category)) {
      errors.category = "Category must not be empty!"
    }
    if (!hasContent(subcategory)) {
      errors.category = "Category must not be empty!"
    }
    if (!hasContent(currency)) {
      errors.category = "Category must not be empty!"
    }
    if (!Number.isNaN(price) || price < 0) {
      errors.price = "Price must be a positive integer!"
    }
    if (!Number.isNaN(stock) || price < 0) {
      errors.price = "Stock must be a positive integer!"
    }
    if (!Number.isNaN(rating) || rating < 0 || rating > 5) {
      errors.price = "Rating must be a positive integer between 0 and 5!"
    }

    if (errors) {
      res.statusCode = 400;
      res.json({
        product: {
          name, category, subcategory, price, stock, rating, currency
        },
        errors
      })
    }
  })


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});