const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Orderitem = sequelize.define('orderitem', {
id: {
  type: Sequelize.INTEGER,
  allowNull: false,
  autoIncrement: true,
  primaryKey: true
},
quantity: Sequelize.INTEGER


})

module.exports = Orderitem;