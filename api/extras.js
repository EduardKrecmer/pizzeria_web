const extras = require('./extras.json');

module.exports = (req, res) => {
    res.status(200).json(extras);
};
