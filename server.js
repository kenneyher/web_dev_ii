const express = require("express");
const fs = require("node:fs");
const { Sequelize } = require("sequelize");

const app = express();
const PORT = 9000;

/**
 * @interface IDatabase
 */
class IDatabase {
  constructor() {
    if (this.constructor === IDatabase) {
      throw new Error("Interface classes can't be instantiated.");
    }
  }

  read() {
    throw new Error("Method 'read()' must be implemented.");
  }

  write() {
    throw new Error("Method 'write()' must be implemented.");
  }
}

/**
 * @class Database
 */
class Database {
  /**
   * @description Connect to the database and perform an action
   */
  connect(databaseInstance, action) {
    if (action === "read") {
      return databaseInstance.read();
    } else if (action === "write") {
      return databaseInstance.write();
    } else {
      throw new Error("Invalid action. Use 'read' or 'write'.");
    }
  }
}

class MySQLDatabase extends IDatabase {
  constructor(sequelizeInstance) {
    super();
    this.sequelize = sequelizeInstance;
  }

  read() {
    console.log("Reading from MySQL database");
  }

  write() {
    console.log("Writing to MySQL database");
  }
}

class JSONDatabase extends IDatabase {
  constructor(filePath) {
    super();
    this.filePath = filePath;
  }

  read() {
    const { products } = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
    return products;
  }

  write() {
    console.log("Writing to JSON database");
  }
}

const conn = new Sequelize("products_db", "root", "root", {
  host: "localhost",
  dialect: "mysql",
});

const db = new Database();
const mysql = new MySQLDatabase(conn);
const json = new JSONDatabase("./products.json");

/**
 * @description Middlewares and Utilities
 */
app.use(express.json());

app.get("/products", (req, res) => {
  const { source, category, subcategory, search } = req.query;

  try {
    if (source == "mysql") {
      db.connect(mysql, "read");
    } else if (source == "json") {
      let products = db.connect(json, "read");

      if (category) {
        products = products.filter((p) =>
          p.category.toLowerCase().includes(category.toLowerCase()),
        );
      }
      if (subcategory) {
        products = products.filter((p) =>
          p.subcategory.toLowerCase().includes(subcategory.toLowerCase()),
        );
      }
      if (search) {
        products = products.filter((p) =>
          JSON.stringify(p).toLowerCase().includes(search.toLowerCase()),
        );
      }

      return res.status(200).json(products);
    } else {
      throw new Error("Invalid source. Use 'mysql' or 'json'.");
    }
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
});

app.get("/products/:id", (req, res) => {
  const { source } = req.query;

  try {
    if (source == "mysql") {
    } else if (source == "json") {
      let products = db.connect(json, "read");
      const product = products.find((p) => p.id == req.params.id);
      return res.status(200).json(product);
    } else {
      throw new Error("Invalid source. Use 'mysql' or 'json'.");
    }
  } catch (err) {
    return res.status(400).json({ msg: err.message });
  }
});

/**
 * @description Server listening
 */
app.listen(PORT, () => {
  console.log(`Server is running on port http://127.0.0.1:${PORT}`);
});
