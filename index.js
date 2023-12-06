const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const Product = require('./productModel');
const cors = require('cors');
const axios = require('axios');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { dbName: 'db_products' });

app.use(express.json());

// Swagger options
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Products API',
      version: '1.0.0',
      description: 'API documentation for managing products.',
    },
    externalDocs: {
      url: "/swagger.json"
    },
    servers: [
      {
        url: `http://localhost:${process.env.SWAGGER_PORT}`,
      },
    ],
  },
  apis: ['index.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Middleware to verify token
const verifyToken = async (req, res, next) => {
  try {
    const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/auth/verify`, {
      headers: {
        Authorization: req.headers.authorization,
        Host: req.headers.host,
      },
    });
    req.userId = response.data.userId;
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check if the service is running.
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Service is running.
 *       500:
 *         description: Service is not running.
 */
app.get('/health', (req, res) => {
  try {
    // You can add more sophisticated health-check logic here if needed
    res.status(200).json({ status: 'Service is running' });
  } catch (error) {
    res.status(500).json({ error: 'Service is not running' });
  }
});

// Create a new product
/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         originalPrice:
 *           type: number
 *         temporaryPrice:
 *           type: number
 *           default: -1
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum:
 *             - sweet
 *             - hard
 *             - soft
 *             - sour
 *         imgUrl:
 *           type: string
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags:
 *       - Products
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       500:
 *         description: Internal Server Error
 */
app.post('/products', verifyToken, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all products
/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Internal Server Error
 */
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Search products by name
/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Search products by name
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of products matching the search query
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       400:
 *         description: Missing search query parameter "name"
 *       500:
 *         description: Internal Server Error
 */
app.get('/products/search', async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ error: 'Missing search query parameter "name"' });
    }

    const regex = new RegExp(name, 'i'); // Case-insensitive search
    const products = await Product.find({ name: { $regex: regex } });

    res.status(200).json(products);
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get unique categories
/**
 * @swagger
 * /products/categories:
 *   get:
 *     summary: Get unique categories
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: List of unique product categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       500:
 *         description: Internal Server Error
 */
app.get('/products/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get a single product by ID
/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the product
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response with the product
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal Server Error
 */
app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.status(200).json(product);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update a product by ID
/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a single product by ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the product to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal Server Error
 */
app.put('/products/:id', verifyToken, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.status(200).json(product);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a product by ID
/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the product to delete
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal Server Error
 */
app.delete('/products/:id', verifyToken, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.status(204).end();
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get products by category
/**
 * @swagger
 * /products/category/{category}:
 *   get:
 *     summary: Get products by category
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         description: Category to filter products
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of products in the specified category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Internal Server Error
 */
app.get('/products/category/:category', async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all products sorted by a specific criteria (e.g., price)
/**
 * @swagger
 * /products/sorted/{criteria}:
 *   get:
 *     summary: Get all products sorted by a specific criteria (e.g., price)
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: criteria
 *         required: true
 *         description: Sorting criteria (e.g., originalprice, name, temporaryprice)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of products sorted by the specified criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid sorting criteria
 *       500:
 *         description: Internal Server Error
 */
app.get('/products/sorted/:criteria', async (req, res) => {
  try {
    const criteria = req.params.criteria.toLowerCase();
    const validCriteria = ['originalprice', 'name', 'temporaryprice']; // Add more valid criteria as needed
    if (!validCriteria.includes(criteria)) {
      return res.status(400).json({ error: 'Invalid sorting criteria' });
    }

    const products = await Product.find().sort({ [criteria]: 1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add discount to product
/**
 * @swagger
 * /products/{productId}/discount:
 *   put:
 *     summary: Update the temporary price of a product
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product
 *     requestBody:
 *       description: The new temporary price, if no discount set to -1
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - temporaryPrice
 *             properties:
 *               temporaryPrice:
 *                 type: number
 *     responses:
 *       '200':
 *         description: Successful operation. Returns the updated product.
 *       '400':
 *         description: Invalid data.
 *       '404':
 *         description: Product not found.
 *       '500':
 *         description: Internal Server Error.
 */
app.put('/products/:productId/discount', verifyToken, async (req, res) => {
  try {
    const productId = req.params.productId;
    const { temporaryPrice } = req.body;

    // Validate input
    if (!productId || !temporaryPrice) {
      return res.status(400).json({ error: 'Invalid data' });
    }

    // Find the product by ID
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update the temporaryPrice
    product.temporaryPrice = temporaryPrice;

    // Save the updated product
    await product.save();

    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//todo get products with ids for cart
app.get('/products/cart/:ids', async (req, res) => {
  try {
    const ids = req.params.ids.split(',');
    const products = await Product.find({ _id: { $in: ids } });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
