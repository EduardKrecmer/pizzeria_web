const pizzas = require('../shared/data/pizzas.json');

module.exports = (req, res) => {
  res.status(200).json(pizzas);
};
