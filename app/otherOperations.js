module.exports = function () {
    var getCategories = function (req, res) {
        var output = [];
        for (var i = 0; i < global.questionCategories.length; i++) {
            output.push({categoryId: i, categoryName: global.questionCategories[i]});
        }
        res.json(output);
    };
    return {getCategories: getCategories};
};