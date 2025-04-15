const pizzas = require('../data/pizzas.json');

module.exports = (req, res) => {
    res.status(200).json(pizzas);
};
