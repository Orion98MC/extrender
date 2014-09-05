var Q = require('q');
var QChain = require('qchain');

/*
  Express Extended Render

  Exemple:

  function show(req, res) {
    var foo = Foo.findById(param(id) || res.locals.foo_id)
    res.render('foo', { foo: foo });
  }

  ...

  res.render(show, { foo_id: 1234 }).then(function (str) {
    return res.render('dashboard', { foo_str: str });
  }).then(function(data) {
    res.send(data);
  });


  # res.render()
  Renders a template or a controller function that returns a value or a promise

  # res.chain()
  Creates a QChain rendering chain (i.e with a last res.send() at the end of the chain)
  You may .then() on the returned QChain object

*/


function bindExpress(express_app, on_nest) {
  
  /*
  
    res.chain(name, last)
  
    @return a QChain object
  
    Example:
  
      res.chain().then(function (){ return res.render(...); });

      or
  
      res.chain().thenResolve(Q.all(items.map(function (item) {
        return res.render(Item.show, { item: item });
      })))
      .then(function (rendered_items) {
        return res.render('dashboard', { items: rendered_items })
      });
  
  **/
  
  function chain(arg) {
    var self = this, isFlushingChain = !this._qchain, qchain, last, name
    //, promise
    ;
    
    // console.log('[Chain]', arg);
    
    if (typeof(arg) === 'string') {
      name = arg;
    } else
    if ((typeof(arg) === 'function')) {
      last = arg;
    } else 
    if (arg === false) {
      last = function () {};
      name = 'NO FLUSH';
    } else 
    // if (Q.isPromise(arg)) {
    //   promise = arg;
    // }
    
    name = name || 'No name';
    last = last || (isFlushingChain ? function () { 
      if (this.isFulfilled()) return self.send(this.inspect().value); 
      self.req.next(this.inspect().reason);
    } : undefined);
  
    var qchain = QChain(last);
    
    qchain.name = name + (isFlushingChain ? " Flushing chain": '');
    qchain.render = function () {
      var qchain = this, args = arguments;
      return qchain.then(function () { return render.apply(self, args); });
    };
    this._qchain = qchain;
    
    // if (promise) qchain.thenResolve(promise);
    
    return this._qchain;
  }

  express_app.response.__proto__.chain = chain;
  
  var _render = express_app.response.render;
  
  /*
  
    res.render([String|Function], [options])
  
    @param string_or_function a String template path or a Function that calls res.render
    @param options an Object containing the locals 
    
      Options may contain any locals to pass to the rendering engine
      '_body' is a special key that allows to add req.body data 
        to the request that is crafted when rendering 
        a Controller code (i.e when string_or_function is a Function)
  
    @return a promise
  
    Example:
  
      var FooController = {
        foo: function(req, res) {
          var foo = Foo.findById(res.locals.foo_id);
          return res.render('foo.html', { foo: foo });
        }
      };
  
      res.render(FooController.foo, { foo_id: 1234 }).then(function (rendered_foo) {
        return res.render('dashboard', { foo: rendered_foo });
      }).then(function (data) {
        res.send(data);
      })
    
    
    Render chain:
    =============
  
    If you use controllers rendering with res.render(Function) then you may find difficult to flush the renderings
    at the appropriate place to send back data to the client. 
    This is where the rendering chain may be useful.
    The first code that calls res.chain() is assumed to be the flushing chain. Other chains are parent chains.
    The flushing chain finishes with a res.send() of the last promise value.
  
    Example:
  
    res.chain().then(function () {
      return res.render(Foo.show);
    }).then(function (rendered_foo) {
      return res.render('dashboard.html', { foo: rendered_foo });
    });
  
  **/
  var render = function extendedRender(string_or_function, options) {  
    var self = this;
    // console.log('[Render]', (typeof(string_or_function) === 'string') ? string_or_function : string_or_function._name);
    if (!this._qchain) this.chain(false);
    
    if (typeof string_or_function === 'string') {
      var deferred = Q.defer();
      
      _render.call(this, string_or_function, options, function (err, str) {      
        if (err) {
          // console.log('[Rendered template]', string_or_function, err);
          return deferred.reject(err);
        } 
        deferred.resolve(str); 
      });
      
      return deferred.promise;
    } 
        
    if (typeof string_or_function !== 'function') {
      throw new Error('First argument is not a function');
    }
      
    options = options || {};
  
    var _res = this;
    var _req = this.req;

    // Locals
    var locals = options;
    locals.__proto__ = _res.locals;
  
    // Body
    var body = options._body || {};
    delete(options._body);
    body.__proto__ = _req.body;
    
    var res = { __proto__: _res, locals: locals };
    var req = { __proto__: _req, body: body };
    res.req = req;
    
    if (on_nest) on_nest.call(res);
    
    var promise = Q.when(string_or_function(req, res));
    // promise.then(function (value) {
    //   console.log('[Rendered controller]', string_or_function._name);
    // });
    return promise;
  };
  
  express_app.response.__proto__.render = render;
    
};

module.exports = bindExpress;