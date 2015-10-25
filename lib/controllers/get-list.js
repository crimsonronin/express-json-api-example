/**
 * @author Josh Stuart <joshstuartx@gmail.com>
 */
var _ = require('lodash');

function query(req, res, next) {
    if (!!req.target) {
        res.query = req.target.find();
        next();
    } else {
        targetModelNotFoundException(next);
    }
}

function filter(req, res, next) {
    var model = req.target;
    var query = res.query;
    var schema;

    if (!!model && !!model.schema) {
        schema = model.schema;

        if (!!req.query.filter) {
            _.forEach(req.query.filter, function(value, key) {
                if (!!schema.path(key)) {
                    query.where(key).equals(value);
                }
            });
        }
        next();
    } else {
        targetModelNotFoundException(next);
    }
}

function sort(req, res, next) {
    var model = req.target;
    var query = res.query;
    var schema;

    if (!!model && !!model.schema) {
        schema = model.schema;

        if (!!req.query.sort) {
            var sorts = req.query.sort.split(',');

            _.forEach(sorts, function(sort) {
                // remove the descending term to find if the property exists on the model/schema.
                var field = _.trimLeft(sort, '-');
                if (!!schema.path(field)) {
                    query.sort(sort);
                }
            });
        }
        next();
    } else {
        targetModelNotFoundException(next);
    }
}

function page(req, res, next) {
    var query = res.query;

    if (!!query) {
        if (!req.query.page) {
            req.query.page = {};
        }

        if (!req.query.page.offset) {
            req.query.page.offset = 0;
        }

        if (!req.query.page.limit || req.query.page.limit > res.limit) {
            req.query.page.limit = res.limit;
        }

        //run the query to get the total
        query.count(function(err, total) {
            //set the page on the response
            res.page = {
                total: _.round(total),
                limit: _.round(req.query.page.limit),
                offset: _.round(req.query.page.offset)
            };

            //reset and add limits
            query.skip(res.page.offset).
                limit(res.page.limit);

            next(err);
        });
    } else {
        queryNotFoundException(next);
    }
}

function execute(req, res, next) {
    var query = res.query;

    if (!!query) {
        query.lean();
        query.exec('find', function(err, results) {
            if (err) {
                next(err);
            } else {
                res.results = results;
                next();
            }
        });
    } else {
        targetModelNotFoundException(next);
    }
}

function serialize(req, res, next) {
    // run the data through any serializers or data mappers
    var results = res.results;

    if (!!results) {
        //serialize
    }
    res.results = results;

    next();
}

function render(req, res, next) {
    // send the data back to the client
    res.json({
        meta: {
            page: res.page
        },
        data: res.results
    });
}

function targetModelNotFoundException(next) {
    var err = new Error('Target Model Not Found');
    err.status = 500;
    next(err);
}

function queryNotFoundException(next) {
    var err = new Error('Query Not Found');
    err.status = 500;
    next(err);
}

module.exports.query = query;
module.exports.filter = filter;
module.exports.sort = sort;
module.exports.page = page;
module.exports.execute = execute;
module.exports.serialize = serialize;
module.exports.prepareViewModel = render;

module.exports.default = [
    query,
    filter,
    sort,
    page,
    execute,
    serialize,
    render
];