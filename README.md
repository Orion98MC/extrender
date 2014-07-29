# Express Extended Render

Extends express render to controller actions.

## Exemple:

Say you have a controller action named 'show' which renders "foo" like so:

```js
function showFoo(req, res) {
  var foo = Foo.findById(param(foo_id) || res.locals.foo_id)
  res.render('foo', { foo: foo });
}
```

Now, what if you have a dashboard controller in which you want to render the foo and bar and other things.

You would need to re-implement the foo and bar show functions inside your dashboard...

```js
function dashboard(req, res) {
  
  var foo = Foo.findById(param(foo_id) || res.locals.foo_id)
  res.render('foo', { foo: foo }, function (err, foo_txt) {

    var bar = Bar.findById(param(bar_id)|| res.locals.bar_id);
    res.render('bar', { bar: bar }, function (err, bar_txt) {
      
      res.render('dashboard', { foo_raw: foo_txt, bar_raw: bar_txt });
      
    });
  
  });
    
}
```

* You duplicate the code which is error prone, especially if the show functions are bigger
* It's not very Object oriented

## Use the force luke

With this little express extended render you would do this:

```js
function dashboard(req, res) {
 
  var foo_txt;
  
  res.render(showFoo, { foo_id: 1234 }).then(function (str) {
    foo_txt = str;
    return res.render(showBar, { bar_id: 2345 });
  }).then(function (bar_txt) {
    res.render('dashboard', { foo_raw: foo_txt, bar_raw: bar_txt });
  });
  
}
```

## Usage

Patch the response render function:

```js
var app = express()
require('extrender')(app);
```

It wraps the genuine response render and calls it if the first argument is a string like so:

```js
res.render(template_name, locals, cb)
```

It calls the extended code when the first argument is a function which is expected to be a controller code that renders something:

```js
res.render(controller_function, options, cb)
```

* options: (Object) contains the locals to be used for this render tree. options may contain one special key '_body' which may contain a request body

example: { local_var: 1, _body: { id: 1234 }}

* cb: optional callback like in the genuine render which takes (error, string) as arguments.


## dependencies

We use Q to provide promises (https://github.com/kriskowal/q).


## License terms

Copyright (c), 2014 Thierry Passeron

The MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.