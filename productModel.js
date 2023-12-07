const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: String,
    originalPrice: Number,
    temporaryPrice: Number,
    description: String,
    category: String,
    imgUrl: String,
    discountId: {
        type: String,
        required: false,
    },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
