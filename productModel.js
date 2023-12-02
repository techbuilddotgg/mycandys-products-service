const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: String,
    originalPrice: Number,
    temporaryPrice: Number,
    description: String,
    category: String,
    imgUrl: String,
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
