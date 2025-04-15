const pizzas = require('./pizzas.json');

module.exports = (req, res) => {
    res.status(200).json(pizzas);
};
