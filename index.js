var Q = require('q');

/*
  Express Extended Render

  Exemple:

  function show(req, res) {
    var foo = Foo.findById(param(id) || res.locals.foo_id)
    res.render('foo', { foo: foo });
  }

  ...

  res.render(show, { foo_id: 1234 }, function (err, str) {
    res.render('dashboard', { foo_str: str });
  });

  OR

  res.render(show, { foo_id: 1234 }).then(function (str) {
    res.render('dashboard', { foo_str: str });
  }).done();

*/
function bindExpress(express_app, default_locals) {
  
  var _render = express_app.response.render;
  
  express_app.response.__proto__.render = function (string_or_function, options, callback) {  
    if (typeof string_or_function === 'string') return _render.call(this, string_or_function, options, callback);
    
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    options = options || {};
    
    var _res = this;
    var _req = this.req;
  
    // Locals
    var locals = options;
    for (var key in default_locals) if (!locals[key]) locals[key] = default_locals[key];
    locals.__proto__ = _res.locals;
    
    // Body
    var body = options._body || {};
    delete(options._body);
    body.__proto__ = _req.body;

    var res = { __proto__: _res, locals: locals };
    var req = { __proto__: _req, body: body };
    res.req = req;
    
    var defered = Q.defer()
    
    res.render = function (view, options, cb) {
		  var options = options || {}
		  options._locals = res.locals;
			
		  express_app.render.call(express_app, view, options, function(err, str) {
				if (err) defered.reject(err);
				else defered.resolve(str);
				if (cb) return cb(err, str);
		  });
    };
    
    string_or_function(req, res);
    
    return defered.promise.fail(function (err) {
			console.log('Error in partial promise:', err, err.stack);
		});
  };
  
};

module.exports = bindExpress;