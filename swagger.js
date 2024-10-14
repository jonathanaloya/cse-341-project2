const swaggerAutogen = require('swagger-autogen')();
 
const doc = {
    info: {
        title: 'Users Api',
        description: 'Users Api'
    },
    host: 'localhost:3003',
    schemes: ['https', 'http'],
    basePath: '/api-docs'
};

const outputFile = './swagger.json';
const endpointsFiles = ['/cse-341-project2/routes/index.js'];

// This will generate swagger.jsons

swaggerAutogen(outputFile, endpointsFiles, doc);