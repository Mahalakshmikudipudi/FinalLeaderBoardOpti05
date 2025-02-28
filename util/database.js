const Sequelize = require('sequelize')


const sequelize = new Sequelize('expense-tracker-project', 'root', 'Kiyansh@020508',{
    dialect: 'mysql',
    host: 'localhost'
})

module.exports = sequelize;