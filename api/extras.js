const extras = require('../client/data/extras.json');

module.exports = (req, res) => {
    res.status(200).json(extras);
};
