var hbs = require('hbs')

hbs.registerHelper('extend', function(name, context) {
    var block = blocks[name];
    if (!block) {
        block = blocks[name] = [];
    }

    block.push(context.fn(this)); // for older versions of handlebars, use block.push(context(this));
});

hbs.registerHelper('block', function(name) {
    var val = (blocks[name] || []).join('\n');

    // clear the block
    blocks[name] = [];
    return val;
});

hbs.registerHelper(‘everyNth’, function(context, every, options) {
        var fn = options.fn,
            inverse = options.inverse;
        var ret = “”;
        if (context && context.length > 0) {
            for (var i = 0, j = context.length; i 0, isLast: i === context.length - 1
            }));
}
}
else {
    ret = inverse(this);
}
return ret;
}); 