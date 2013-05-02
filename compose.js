
var arraySlice = Function.prototype.call.bind(Array.prototype.slice);

function bind(func/*, arg1, arg2, ...*/) {
  var args = arraySlice(arguments, 1);
  return function () {
    return func.apply(this, args.concat(arraySlice(arguments)));
  };
}

function rightBind(func/*, arg1, arg2, ...*/) {
  var args = arraySlice(arguments, 1);
  return function (/*arg1, arg2, ...*/) {
    return func.apply(this, arraySlice(arguments).concat(args));
  };
}

function series() {
  var funcs = arraySlice(arguments);
  var end = funcs.pop();

  (function loop() {
    var func = funcs.shift();

    if (!func) return typeof end === 'function' && end();

    setTimeout(func.bind(this, loop), 0);
  }());
}

function waterfall() {
  var funcs = arraySlice(arguments);
  var start = funcs[0];
  var end = funcs.pop();

  (function loop(res) {
    var func = funcs.shift();

    if (!func) return typeof end === 'function' && end(res);

    var args = [loop];
    if (func !== start) {
      args.unshift(res);
    }
    setTimeout(func.apply.bind(func, this, args), 0);
  }());
}

function compose() {
  var funcs = arraySlice(arguments);
  return funcs.reduce(
    function (res, func) {
      return func(res);
    },
    undefined
  );
}

// array.map composition function
// result function needs to be passed an array
function toMap(func) {
  return function (arr) {
    return arr.map(func);
  };
}

function toCallback(func) {
  return function () {
    var callback = arguments[arguments.length - 1];
    var res = func.apply(this, arguments);
    typeof callback === 'function' && callback(res);
  };
}

function identity(x) {
  return x;
}

function mapAndConcat(func) {
  (!func || typeof func !== 'function') && (func = identity);
  return function (arr) {
    return arr.reduce(
      function (res, el, i, arr) {
        return res.concat(func(el, i, arr));
      },
      []
    );
  };
}

// flatten by using plain mapAndConcat
var flatten = mapAndConcat();

function getFirstFromArray(arr) {
  return arr && arr[0];
}

var getFirstFromArraysOfArrays = toMap(getFirstFromArray);

function getLastFromArray(arr) {
  return arr[arr.length - 1];
}

function callFirst(func) {
  return function (first) {
    return func.call(this, first);
  };
}