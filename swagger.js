const swaggerAutogen = require('swagger-autogen')();
 
const doc = {
    info: {
        title: 'Users Api',
        description: 'Users Api'
    },
    host: 'localhost:3000',
    schemes: ['http'],
    basePath: '/api-docs'
};

const outputFile = './swagger.json';
const endpointsFiles = ['./cse-341-project2-main/routes/index.js'];

// This will generate swagger.json

swaggerAutogen(outputFile, endpointsFiles, doc);