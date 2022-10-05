const {Sequelize} = require('sequelize');

const sequelize = new Sequelize('node', 'root', 'Bharat_kumar77', {
    dialect: 'mysql', 
    host: 'localhost',
    logging: false

});

    module.exports = sequelize;
    