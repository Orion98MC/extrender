# Express Extended Render

Express render as promises.

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

## Extrender:

With extrender you would do this:

```js
function dashboard(req, res) {
 
  var foo_txt;
  
  res.chain().render(showFoo, { foo_id: 1234 }).then(function (str) {
    foo_txt = str;
    return res.render(showBar, { bar_id: 2345 });
  }).then(function (bar_txt) {
    return res.render('dashboard', { foo_raw: foo_txt, bar_raw: bar_txt });
  });
  
}
```

## Usage

Patch the res.render() function:

```js
var app = express()
require('extrender')(app);
```

Now, with extrender, you keep the same syntaxe you are used to with express. But you need to adjust two things:

* First, you never use a callback, you use promises and 'then' things.
* Second, there is no more a default flush (res.send()) at the end of your res.render() calls
So, you need to either "then" a function to flush the results of your templates OR to use the render chain.

Example:

```js
res.render('foo.html', { foo: "foo" }).then(function (result) { res.send(result); });

OR, using the render chain:

res.chain().render('foo.html', { foo: "foo" });
```

## Render chain

One thing great with extrender is that you can render controller codes. But this means that the controller code that renders something cannot call res.send(). In fact it is up to the code that renders a controller code to flush. But what if this code is also a controller that could be called by an other controller code ... 

The solution to this is the render chain. You create a render chain every time you call res.chain(), if an other chain already existed then the new one is attached to it as a competion promise etc... 

The first code to call res.chain() is considered to be the one that will flush to the network. The other chains will only report to this chain their own completion.

So if any of your code renders something it should call the res.chain() first and "then" things to this chain like so:

```js

res.chain().then(function () {
  return res.render(Foo.show, { foo: 1 });
}).then(...)

OR as a shortcut you may use .render() on the chain:

res.chain().render(Foo.show, { foo: 1 }).then(...);

```

## dependencies

We use Q to provide promises (https://github.com/kriskowal/q).


## License terms

Copyright (c), 2014 Thierry Passeron

The MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.