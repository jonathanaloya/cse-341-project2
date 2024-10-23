const swaggerAutogen = require('swagger-autogen')();
 
const doc = {
    info: {
        title: 'Users Api',
        description: 'Users Api'
    },
    host: 'cse-341-project2-hyld.onrender.com',
    schemes: ['http'],
    basePath: '/api-docs'
};

const outputFile = './swagger.json';
const endpointsFiles = ['./cse-341-project2-main/routes/index.js'];

// This will generate swagger.json

swaggerAutogen(outputFile, endpointsFiles, doc);