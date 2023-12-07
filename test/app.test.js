const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../index');

chai.use(chaiHttp);
const expect = chai.expect;

describe('test products', () => {

    before(async () => {
        try {
            await mongoose.connect(process.env.MONGODB_URI_TEST, {
                dbName: 'db_products'
            });
            console.log('MongoDB connected successfully');
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
        }
    });

    after(async () => {
        await mongoose.disconnect();
        //await chai.request(app).delete('/products');
    });

    it('should get a product by id', async () => {
        const res = await chai.request(app).post('/products').send({ name: 'Product1', originalPrice: 1.1, temporaryPrice: 1.1, description: 'description', category: 'category', imgUrl: 'imgUrl'});
        const resGet = await chai.request(app).get(`/products/${res.body._id}`);
        expect(resGet).to.have.status(200);
        expect(resGet.body).to.be.an('object');
        expect(resGet.body.name).to.equal('Product1');
        await chai.request(app).delete(`/products/${resGet.body._id}`);
    });

    it('should not get a product by id', async () => {
        const resGet = await chai.request(app).get(`/products/6570d1c6a5c7e872164cd941`);
        expect(resGet).to.have.status(404);
    });

    it('should delete product ', async () => {
        const res = await chai.request(app).post('/products').send({ name: 'Product1', originalPrice: 1.1, temporaryPrice: 1.1, description: 'description', category: 'category', imgUrl: 'imgUrl'});
        const resDel = await chai.request(app).delete(`/products/${res.body._id}`);
        expect(resDel).to.have.status(204);
    });

    it('should get a list of products', async () => {
        const res = await chai.request(app).post('/products').send({ name: 'Product1', originalPrice: 1.1, temporaryPrice: 1.1, description: 'description', category: 'category', imgUrl: 'imgUrl'});

        const resGet = await chai.request(app).get('/products');

        expect(resGet).to.have.status(200);
        expect(resGet.body).to.be.an('array');
        expect(resGet.body.length).to.equal(1);
        await chai.request(app).delete(`/products/${res.body._id}`);
    });

    it('should create a product', async () => {
        const res = await chai.request(app).post('/products').send({ name: 'Product1', originalPrice: 1.1, temporaryPrice: 1.1, description: 'description', category: 'category', imgUrl: 'imgUrl'});

        expect(res).to.have.status(201);
        expect(res.body).to.be.an('object');
        expect(res.body.name).to.equal('Product1');
        console.log(res.body._id)
        await chai.request(app).delete(`/products/${res.body._id}`);
    });

    it('should update a product', async () => {
        const res = await chai.request(app).post('/products').send({ name: 'Product1', originalPrice: 1.1, temporaryPrice: 1.1, description: 'description', category: 'category', imgUrl: 'imgUrl'});
        const resUpd = await chai.request(app).put(`/products/${res.body._id}`).send({ name: 'Product2', originalPrice: 1.1, temporaryPrice: 1.1, description: 'description', category: 'category', imgUrl: 'imgUrl'});
        expect(resUpd).to.have.status(200);
        expect(resUpd.body).to.be.an('object');
        expect(resUpd.body.name).to.equal('Product2');
        await chai.request(app).delete(`/products/${res.body._id}`);
    });

    it('should get product by category', async () => {
        const res = await chai.request(app).post('/products').send({ name: 'Product1', originalPrice: 1.1, temporaryPrice: 1.1, description: 'description', category: 'category', imgUrl: 'imgUrl'});

        const resGet = await chai.request(app).get('/products/category/category');

        expect(resGet).to.have.status(200);
        expect(resGet.body).to.be.an('array');
        expect(resGet.body.length).to.equal(1);
        await chai.request(app).delete(`/products/${res.body._id}`);
    });

    it('should add discount to product', async () => {
        const res = await chai.request(app).post('/products').send({ name: 'Product1', originalPrice: 1.1, temporaryPrice: 1.1, description: 'description', category: 'category', imgUrl: 'imgUrl'});
        const resUpd = await chai.request(app).put(`/products/${res.body._id}/discount`).send({ temporaryPrice: 0.99 });
        expect(resUpd).to.have.status(200);
        expect(resUpd.body).to.be.an('object');
        expect(resUpd.body.temporaryPrice).to.equal(0.99);
    });

    it('should search product by name', async () => {
        const res = await chai.request(app).post('/products').send({ name: 'Product1', originalPrice: 1.1, temporaryPrice: 1.1, description: 'description', category: 'category', imgUrl: 'imgUrl'});

        const resGet = await chai.request(app).get('/products/search').query({ name: 'Product1' });

        expect(resGet).to.have.status(200);
        expect(resGet.body).to.be.an('array');
        expect(resGet.body.length).to.equal(1);
        await chai.request(app).delete(`/products/${res.body._id}`);
    });

    it('shpuld not serach product by name', async () => {
        const resGet = await chai.request(app).get('/products/search');
        expect(resGet).to.have.status(400);
    });

});

