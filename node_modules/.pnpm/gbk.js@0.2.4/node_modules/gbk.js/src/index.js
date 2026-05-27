module.exports = function (gbk_us){
    var gbk = require('./gbk')(gbk_us);
    gbk.URI = require('./URI')(gbk);
    return gbk;
};