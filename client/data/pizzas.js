const pizzas = require('../client/data/pizzas.json');

module.exports = (req, res) => {
    res.status(200).json(pizzas);
};
