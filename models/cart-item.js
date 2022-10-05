const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Cartitem = sequelize.define('cartitem', {
id: {
  type: Sequelize.INTEGER,
  allowNull: false,
  autoIncrement: true,
  primaryKey: true
},
quantity: Sequelize.INTEGER


})

module.exports = Cartitem;