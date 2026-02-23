const express = require("express");
const { isPrimary } = require("node:cluster");
const fs = require("node:fs");
const { Sequelize, DataTypes, Op } = require("sequelize");

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
  connect(databaseInstance, action, data) {
    if (action === "read") {
      return databaseInstance.read(data); // acts like filters here
    } else if (action === "write") {
      return databaseInstance.write(data);
    } else if (action === "readOne") {
      return databaseInstance.readOne(data);
    } else if (action === "update") {
      return databaseInstance.update(data);
    } else if (action === "delete") {
      return databaseInstance.delete(data);
    } else {
      throw new Error("Invalid action. Use 'read', 'readOne' or 'write'.");
    }
  }
}

class MySQLDatabase extends IDatabase {
  constructor(sequelizeInstance) {
    super();
    this.sequelize = sequelizeInstance;
    this.initialize();
  }

  async initialize() {
    this.#initializeModels();
    await this.sequelize.sync({ alter: true });
    await this.seedFromJSONIfEmpty("./products.json");
  }

  #initializeModels() {
    console.log("Database synchronized");

    this.Category = this.sequelize.define("Category", {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    });

    this.Subcategory = this.sequelize.define("Subcategory", {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Categories",
          key: "id",
        },
      },
    });

    this.Product = this.sequelize.define("Product", {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.DOUBLE.UNSIGNED,
        allowNull: false,
        defaultValue: 0.0,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      rating: {
        type: DataTypes.DOUBLE.UNSIGNED,
        allowNull: false,
        defaultValue: 0.0,
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "USD",
      },
      subcategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Subcategories",
          key: "id",
        },
      },
    });

    this.Product.belongsTo(this.Subcategory, {
      foreignKey: "subcategoryId",
    });
    this.Subcategory.belongsTo(this.Category, {
      foreignKey: "categoryId",
    });
    this.Category.hasMany(this.Subcategory, {
      foreignKey: "categoryId",
    });
    this.Subcategory.hasMany(this.Product, {
      foreignKey: "subcategoryId",
    });
  }

  async seedFromJSONIfEmpty(jsonPath) {
    this.#initializeModels();
    const categoryCount = await this.Category.count();

    if (categoryCount > 0) {
      console.log("Database already seeded.");
      return;
    }

    console.log("Seeding DB from JSON");
    const { products } = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

    const categories = [...new Set(products.map((p) => p.category))];
    categories.sort();
    for (const category of categories) {
      await this.Category.create({ name: category });
    }

    const subcategories = new Map();
    for (const product of products) {
      subcategories.set(product.subcategory, product.category);
    }
    for (const [subcategory, category] of subcategories) {
      let cat = await this.Category.findOne({ where: { name: category } });
      await this.Subcategory.create({ name: subcategory, categoryId: cat.id });
    }

    for (const product of products) {
      const subcat = await this.Subcategory.findOne({
        where: { name: product.subcategory },
      });
      await this.Product.create({
        name: product.name,
        price: product.price,
        stock: product.stock,
        rating: product.rating,
        currency: product.currency,
        subcategoryId: subcat.id,
      });
    }

    console.log("Database created successfully.");
  }

  async read(filters = {}) {
    const { category, subcategory, search } = filters;

    const where = {};
    const include = [
      {
        model: this.Subcategory,
        required: true,
        where: subcategory
          ? { name: { [Op.like]: `%${subcategory}%` } }
          : undefined,
        include: [
          {
            model: this.Category,
            required: true,
            where: category
              ? { name: { [Op.like]: `%${category}%` } }
              : undefined,
          },
        ],
      },
    ];

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { price: { [Op.like]: `%${search}%` } },
        { stock: { [Op.like]: `%${search}%` } },
        { rating: { [Op.like]: `%${search}%` } },
        { currency: { [Op.like]: `%${search}%` } },
      ];
    }

    const products = await this.Product.findAll({ where, include });
    return products;
  }

  async readOne(id) {
    const product = await this.Product.findByPk(id, {
      include: [
        {
          model: this.Subcategory,
          required: true,
          include: [{ model: this.Category, required: true }],
        },
      ],
    });
    return product;
  }

  async write(data) {
    const { name, price, stock, rating, currency, category, subcategory } =
      data;

    const [categoryRecord] = await this.Category.findOrCreate({
      where: { name: category },
    });

    const [subcategoryRecord] = await this.Subcategory.findOrCreate({
      where: { name: subcategory, categoryId: categoryRecord.id },
    });

    let product = await this.Product.create({
      name,
      price,
      stock,
      rating,
      currency,
      subcategoryId: subcategoryRecord.id,
    });

    return product;
  }

  async update(data) {
    const { id, name, price, stock, rating, currency, category, subcategory } =
      data;

    const product = await this.Product.findByPk(id);
    if (!product) {
      throw new Error("Product not found");
    }

    const [categoryRecord] = await this.Category.findOrCreate({
      where: { name: category },
    });

    const [subcategoryRecord] = await this.Subcategory.findOrCreate({
      where: { name: subcategory, categoryId: categoryRecord.id },
    });

    product.name = name;
    product.price = price;
    product.stock = stock;
    product.rating = rating;
    product.currency = currency;
    product.subcategoryId = subcategoryRecord.id;

    await product.save();
    return product;
  }

  async delete(data) {
    const product = await this.Product.findByPk(data);
    if (!product) {
      throw new Error("Product not found");
    }
    await product.destroy();
  }
}

class JSONDatabase extends IDatabase {
  constructor(filePath) {
    super();
    this.filePath = filePath;
  }

  read(data) {
    const { products, count } = JSON.parse(
      fs.readFileSync(this.filePath, "utf-8"),
    );
    return { products, count };
  }

  write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  readOne(data) {
    throw new Error("JSON database does not have a 'readOne' method");
  }

  update(data) {
    throw new Error("JSON database does not have an 'update' method");
  }
}

const conn = new Sequelize("product_inventory", "root", "root", {
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

app.get("/products", async (req, res) => {
  const { source, category, subcategory, search } = req.query;

  try {
    if (source == "mysql") {
      const products = await db.connect(mysql, "read", {
        category,
        subcategory,
        search,
      });

      return res.status(200).json(products);
    } else if (source == "json") {
      let { products } = db.connect(json, "read");

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

app.get("/products/:id", async (req, res) => {
  const { source } = req.query;

  try {
    if (source == "mysql") {
      const product = await db.connect(mysql, "readOne", req.params.id);

      if (!product) {
        return res
          .status(404)
          .json({ error: `Product with id ${req.params.id} not found` });
      }

      return res.status(200).json(product);
    } else if (source == "json") {
      let { products } = db.connect(json, "read");
      const product = products.find((p) => p.id == req.params.id);

      if (!product) {
        return res
          .status(404)
          .json({ error: `Product with id ${req.params.id} not found` });
      }

      return res.status(200).json(product);
    } else {
      throw new Error("Invalid source. Use 'mysql' or 'json'.");
    }
  } catch (err) {
    return res.status(400).json({ msg: err.message });
  }
});

app.post("/products", async (req, res) => {
  const { source } = req.query;

  try {
    if (source == "mysql") {
      const product = await db.connect(mysql, "write", req.body);

      return res.status(201).json({
        msg: "Product created succesfully",
        product,
      });
    } else if (source == "json") {
      let { products, count } = db.connect(json, "read");
      count += 1;

      const newProduct = {
        id: 3000 + count,
        ...req.body,
      };

      products.push(newProduct);
      db.connect(json, "write", { count, products });

      return res
        .status(201)
        .json({ msg: "Product created succesfully", product: newProduct });
    } else {
      throw new Error("Invalid source. Use 'mysql' or 'json'.");
    }
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.put("/products/:id", async (req, res) => {
  const { source } = req.query;
  const productId = parseInt(req.params.id);

  try {
    if (source == "mysql") {
      const product = await db.connect(mysql, "update", {
        id: productId,
        ...req.body,
      });

      return res.status(200).json({ msg: "Product updated", product });
    } else if (source == "json") {
      let { products, count } = db.connect(json, "read");
      const productIdx = products.findIndex((p) => p.id == productId);

      if (productIdx == -1) {
        return res.status(404).json({ error: "Product not found" });
      }

      products[productIdx] = { ...products[productIdx], ...req.body };
      db.connect(json, "write", { count, products });

      return res
        .status(200)
        .json({ msg: "Product updated", product: products[productIdx] });
    } else {
      throw new Error("Invalid source. Use 'mysql' or 'json'.");
    }
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.delete("/products/:id", async (req, res) => {
  const { source } = req.query;
  const productId = parseInt(req.params.id);

  try {
    if (source == "mysql") {
      await db.connect(mysql, "delete", productId);

      return res.status(204).send();
    } else if (source == "json") {
      let { products, count } = db.connect(json, "read");
      const productIdx = products.findIndex((p) => p.id == productId);

      if (productIdx == -1) {
        return res.status(404).json({ error: "Product not found" });
      }

      products.splice(productIdx, 1);
      count -= 1;
      db.connect(json, "write", { count, products });

      return res.status(204).send();
    } else {
      throw new Error("Invalid source. Use 'mysql' or 'json'.");
    }
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * @description Server listening
 */
app.listen(PORT, () => {
  console.log(`Server is running on port http://127.0.0.1:${PORT}`);
});
