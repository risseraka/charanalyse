document.body.innerHTML = '';

function forEach(data, func) {
  var i, j;

  for (i = 0, j = data.length; i < j; i += 1) {
    func(data[i], i, data);
  }
}

function eachPoints(data, func) {
  var i, j;

  for (i = 0, j = data.length; i < j; i += 4) {
    func(data[i], i, data);
  }
}

function createCanvas(id, hidden) {
  var canvas = document.createElement('canvas');
  canvas.id = id;
  canvas.width = 100;
  canvas.height = 100;

  if (hidden) {
    canvas.style.display = 'none';
  }
  document.body.appendChild(canvas);
  return canvas;
}

function clearContext(context) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}

function bigCanvas(canvas) {
  canvas.style.height = '200px';
}

function getImageDataFromContext(context, w, h) {
  return context.getImageData(
    0,
    0,
    w || context.canvas.width,
    h || context.canvas.height
  );
}

function printSimplifiedData(data) {
  var lines = data.reduce(function (result, el) {
    var xy = getXY(el * 4);
    if (!result[xy[1]]) {
      result[xy[1]] = [];
    }
    result[xy[1]].push(xy[0]);
    return result;
  }, {});

  Object.keys(lines).forEach(function (i) {
    console.log('y:', i, '|', lines[i].reduce(function (str, point) {
      return str + (str ? ' ' : '') + point;
    }, ''));
  });
}

function simplifiedX(coord) {
  return coord % 100;
}

function simplifiedY(coord) {
  return Math.floor(coord / 100);
}

function getStringFromSimplifiedPoint(coord) {
  return '(' + simplifiedX(coord) + ',' + simplifiedY(coord) + ')';
}

function getXYFormFromSimplifiedData(simplifiedData) {
  var start = simplifiedData[0];
  var startX = simplifiedX(start);
  var startY = simplifiedY(start);

  return simplifiedData.map(function (coord) {
      return [simplifiedX(coord) - startX, simplifiedY(coord) - startY];
  });
}

function getSimplifiedDataFromImageData(imageData) {
  var simplified = [];
  var index = {};

  eachPoints(imageData.data, function (el, i, data) {
    if (!isPointBlank(data, i)) {
      index[i / 4] = simplified.push(i / 4) - 1;
    }
  });
  simplified.index = index;
  return simplified;
}

function series() {
  var funcs = Array.prototype.slice.call(arguments);
  var end = funcs.pop();

  (function loop() {
    var func = funcs.shift();

    if (!func) return typeof end === 'function' && end();

    setTimeout(func.bind(this, loop), 0);
  }());
}

function waterfall() {
  var funcs = Array.prototype.slice.call(arguments);
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
  var funcs = Array.prototype.slice.call(arguments);
  return funcs.reduce(
    function (res, func) {
      return func(res);
    },
    undefined
  );
}

function toCallback(func) {
  return function () {
    callback = arguments[arguments.length - 1];
    var res = func.apply(this, arguments);
    typeof callback === 'function' && callback(res);
  };
}

// hidden scaling helper canvas
var scaleCanvas = createCanvas('myCanvas', true);
var scaleContext = scaleCanvas.getContext('2d');

var canvas1 = createCanvas('myCanvas');
var context1 = canvas1.getContext('2d');

var canvas2 = createCanvas('myCanvas2');
var context2 = canvas2.getContext('2d');

var canvas3 = createCanvas('myCanvas3');
var context3 = canvas3.getContext('2d');

var canvas4 = createCanvas('myCanvas4');
var context4 = canvas4.getContext('2d');

var canvas5 = createCanvas('myCanvas5');
var context5 = canvas5.getContext('2d');

var canvas6 = createCanvas('mycanvas6');
var context6 = canvas6.getContext('2d');

function drawChar(context, car, color, next) {
  context.font = '100px Microsoft Yahei';
  context.fillStyle = color;
  context.fillText(car, 0, 80);
  sanitize(context);

  typeof next === 'function' && next(context);
}

function bind(func/*, args, ...*/) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function () {
    func.apply(this, args.concat(Array.prototype.slice.call(arguments)));
  };
}

function drawBothChars(car1, car2, next) {
  clearContext(context1);
  clearContext(context2);
  series(
    bind(drawChar, context1, car1, '#f00'),
    bind(drawChar, context2, car2, '#00f'),
    function () {
      var img1, img2;

      img1 = getImageDataFromContext(context1);
      img2 = getImageDataFromContext(context2);

      typeof next === 'function' && next(img1, img2);
    }
  );
}

function getCommon(car1, car2, next) {
  drawBothChars(car1, car2, function (img1, img2) {
    var common,
      data1 = getSimplifiedDataFromImageData(img1),
      data2 = getSimplifiedDataFromImageData(img2);

    // console.log(data1, data2);
    common = intersect(data1, data2);
    printSimplifiedData(common);
    // console.log('commons:', str);
    // console.log('total:', common.length);
    typeof next === 'function' && next(common);
  });
}

function highlightCommon(char1, char2) {
  getCommon(char1, char2, function (common) {
    drawPointsInContext(context1, common, [255, 200, 150], getImageDataFromContext(context1).data);
    drawPointsInContext(context2, common, [150, 200, 255], getImageDataFromContext(context2).data);
  });
}

function pushIfWithin(arr, arr2, el) {
  if (arr2.index[el] >= 0) {
    arr.push(el);
  }
}

function getAround(data, start) {
  var around = [];

  pushIfWithin(around, data, start - 1); // left
  pushIfWithin(around, data, start - 100 - 1); // upper left
  pushIfWithin(around, data, start - 100); // up
  pushIfWithin(around, data, start - 100 + 1); // upper right
  pushIfWithin(around, data, start + 1); // right
  pushIfWithin(around, data, start + 100 + 1); // down right
  pushIfWithin(around, data, start + 100); // down
  pushIfWithin(around, data, start + 100 - 1); // down left

  return around;
}

var RGB = {
  red: [255, 0, 0],
  green: [0, 255, 0],
  blue: [0, 0, 255],

  black: [0, 0, 0],
  white: [255, 255, 255]
};

function drawPointsInContext(context, points, rgb, data) {
  points = points.slice();
  var canvas = context.canvas;

  !data && (data = getImageDataFromContext(context).data);
  var imgd = context.createImageData(canvas.width, canvas.height),
    data2 = imgd.data;

  if (data)
  forEach(data, function (el, i) {
    data2[i] = el;
  });
  var isWhite = rgb[0] + rgb[1] + rgb[2] === 255 * 3;
  points.forEach(function (el) {
    el *= 4;
    data2[el] = rgb[0];
    data2[el + 1] = rgb[1];
    data2[el + 2] = rgb[2];
    // setting alpha to 0 if color is actually 'white'
    data2[el + 3] = isWhite ? 0 : 255;
  });
  context.putImageData(imgd, 0, 0);
}

function sanitize(context, rgb) {
  var img = getImageDataFromContext(context);
  eachPoints(img.data, function (el, i, data) {
    data[i + 0] = (data[i + 0] < 200) ? 0 : 255;
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = (data[i + 3] < 254) ? 0 : 255;
  });
  context.putImageData(img, 0, 0);
}

function dissectChar(context, char1, next) {
  clearContext(context);
  drawChar(context, char1, '#f00', function (context) {
    sanitize(context);

    var data = getSimplifiedDataFromImageData(getImageDataFromContext(context));

    //console.log(data);

    var forms = [];

    var visited = {};
    var notVisited = data;
    while (notVisited.length > 0) {
      var form = [];
      var index = {};
      var edge = notVisited.shift();

      if (visited[edge]) continue;

      var toVisit = [edge];
      while (toVisit.length > 0) {
        var x = toVisit.shift();

        if (visited[x]) continue;
        visited[x] = true;

        toVisit = toVisit.concat(getAround(notVisited, x));
        index[x] = form.push(x) - 1;
      }
      // console.log('visited:', visited);
      // console.log('notVisited:', notVisited);
      form.index = index;
      forms.push(toHorizontalData(form));
    }
    // console.log(forms.length, forms);

    if (DEBUG)
    forms.forEach(function (form, i) {
      drawPointsInContext(
        context,
        form,
        [50, 255 * (forms.length - i) / forms.length + 50, 50],
        getImageDataFromContext(context).data
      );
    });
    typeof next === 'function' && next(forms);
  });
}

function isPointBlank(data, i) {
  return data[i + 3] === 0 ||
    data[i] === 255 &&
    data[i + 1] === 255 &&
    data[i + 2] === 255;
}

function getFirstPointHorizCond(data, start, cond) {
  start = start || 0;

  var i, j,
    h = Math.sqrt(data.length / 4);

  for (i = start, j = data.length; i < j; i += 4) {
    if (cond(data, i)) {
      return i;
    }
  }
  return -1;
}

function getFirstPointVertCond(data, start, cond) {
  start = start || 0;

  var i, j,
    h = Math.sqrt(data.length / 4);

  for (i = start, j = data.length; i < j; i += 4) {
    for (k = 0; k < h; k += 1) {
      var val = i + k * 400;

      if (cond(data, val)) {
        return val;
      }
    }
  }
  return -1;
}

function getFirstPointPosCond(data, start, cond) {
  var horiz = getFirstPointHorizCond(data, start, cond),
    vert = getFirstPointVertCond(data, start, cond);

  var h = getXY(horiz);
  var hd = Math.sqrt(h[0] * h[0] + h[1] * h[1])
  var v = getXY(vert);
  var vd = Math.sqrt(v[0] * v[0] + v[1] * v[1])
  if (h[0] < v[1]) {
    return horiz;
  }
  return vert;
}

function getFirstPointPos(data, start) {
  start = start || 0;

  var i, j;
  for (i = start, j = data.length; i < j; i += 4) {
    if (!isPointBlank(data, i)) {
      return i;
    }
  }
  return -1;
}

function leftPos(i) {
  return i - 4;
}

function rightPos(i) {
  return i + 4;
}

function upPos(i) {
  return i - 100 * 4;
}

function downPos(i) {
  return i + 100 * 4;
}

function getPixelLineFrom2(data, start) {
  var i, j;

  for (
    i = rightPos(start), j = data.length;
    i < j;
    i = rightPos(i)
  ) {
    if (isPointBlank(data, i)) {
      return leftPos(i);
    }
  }
  return -1;
}

function getPixelLineFrom(data, start) {
  var right = rightPos(start),
    line = [start];

  while (
    !isPointBlank(data, right) &&
    right % 400 > 0
  ) {
    line.push(right);
    right = rightPos(right);
  }
  return line.length > 1 ? line : [];
}

function getYi(data, offset) {
  var lines = [],
    start = offset || 0,
    down = downPos(start),
    line,
    firstLine = 0;

  while (
    !isPointBlank(data, start)
  ) {
    line = getPixelLineFrom(data, start);
    if (
      line.length < firstLine
    ) {
      break;
    }
    if (firstLine === 0) {
      firstLine = line.length;
    }
    lines.push(line.slice(0, firstLine));
    start = down;
    down = downPos(start);
  }
  return lines;
}

function getPixelBarFrom(data, start) {
  var down = downPos(start),
    bar = [start];

  while (
    !isPointBlank(data, down) &&
    down % 400 > 0
  ) {
    bar.push(down);
    down = downPos(down);
  }
  return bar.length > 1 ? bar : [];
}

function getGun2(data, offset) {
  offset = offset || 0

  var lines = [],
    start = getFirstPointPos(data, 0),
    last,
    line,
    lastLine;

  while (
    start !== -1 &&
    last !== -1
  ) {
    last = getPixelLineFrom(data, start);
    line = (last - start) / 4;
    // console.log(start, last, ':', line, lastLine);
    if (
      last === start ||
      (
        lastLine !== undefined &&
        line < lastLine
      )
    ) {
      break;
    }
    lines.push([start, last]);
    start = downPos(start);
    lastLine = line;
  }
  return lines;
}

function getGun(data, offset) {
  var bars = [],
    start = offset || 0,
    right = rightPos(start),
    bar,
    barHeight = 0;

  while (
    !isPointBlank(data, start)
  ) {
    bar = getPixelBarFrom(data, start);
    if (
      bar.length < barHeight
    ) {
      barHeight = bar.length;
    }
    if (barHeight === 0) {
      barHeight = bar.length;
    }
    bars.push(bar);
    start = right;
    right = rightPos(start);
  }
  bars.forEach(function (bar, i, bars) {
    bars[i] = bar.slice(0, barHeight);
  });
  return bars;
}

function getYi2(data, offset) {
  offset = offset || 0

  var lines = [],
    start = getFirstPointPos(data, 0),
    last,
    line,
    lastLine;

  while (
    start !== -1 &&
    last !== -1
  ) {
    last = getPixelLineFrom(data, start);
    line = (last - start) / 4;
    // console.log(start, last, ':', line, lastLine);
    if (
      last === start ||
      (
        lastLine !== undefined &&
        line < lastLine
      ) ||
      !isPointBlank(data, leftPos(downPos(start))) ||
      line < lines.length
    ) {
      break;
    }
    lines.push([start, last]);
    start = downPos(start);
    lastLine = line;
  }
  if (line > lines.length) {
    return lines;
  }
  return [];
}

function testIfYi(context, car) {
  clearContext(context);
  drawChar(context, car, '#f00', function () {
    var img = getImageDataFromContext(context),
      data = img.data;

    // console.log(data);
    getYi(data);
  });
}

function getXY(i) {
  var x = i / 4 % 100,
    y = Math.floor(i / 4 / 100);

  return [x, y];
}

function getForm(data, start) {
  var form = [],
    visited = {},
    notVisited = [start],
    nIndex = {},
    current;

  function addIfnotVisitedNotBlank(i, func) {
    if (
      i >= 0 &&
      i < data.length - 4 - 1 &&
      visited[i] === undefined &&
      nIndex[i] === undefined &&
      !isPointBlank(data, i)
    ) {
      func.call(notVisited, i);
      nIndex[i] = true;
    }
  }

  var i = 0;
  while (notVisited.length > 0) {
    current = notVisited.shift();
    // console.log(current);
    visited[current] = true;

    if (!isPointBlank(data, current)) {
      form.push(current);
      addIfnotVisitedNotBlank(leftPos(current), form.unshift);
      addIfnotVisitedNotBlank(rightPos(current), form.unshift);
      addIfnotVisitedNotBlank(upPos(current), form.push);
      addIfnotVisitedNotBlank(downPos(current), form.push);
    }
    if (false && i === 100) {
      break;
    }
    i += 1;
  }
  return form;
}

function getFirstForm(context, data, next) {
  var start = getFirstPointPosCond(
      data,
      0,
      function (data, i) {
        return data[i] === 255 &&
          data[i + 1] === 0 &&
          data[i + 2] === 0;
      }
    ),
    form = getForm(data, start).sort(
      function (a, b) {
        return a - b;
      }
    );

  if (form[0] === -1) {
    next();
    return;
  }

  // console.log(form);

  var lines = form.reduce(
    function (lines, pos) {
      var xy = getXY(pos);

      lines[xy[1]] = lines[xy[1]] || [];
      lines[xy[1]].push(xy[0]);
      return lines;
    },
    []
  );
  lines.forEach(function (line) {
    //console.log(line.join(', '));
  });

  setTimeout(function () {
    drawPointsInContext(context, form, RGB.green, data);
    next(data2, form);
  }, 1000);
}

function consumeForms(context, data, forms, next) {
  getFirstForm(context, data, function (data, form) {
    if (form) {
      forms.push(form);
      consumeForms(context, data, forms, next);
    } else {
      next(forms);
    }
  });
}

function getForms(context, car, next) {
  clearContext(context);
  drawChar(
    context,
    car,
    '#f00',
    function () {
      var img = getImageDataFromContext(context),
        data = img.data;

      // console.log(data);
      consumeForms(
        context,
        data,
        [],
        function (forms) {
          // console.log(forms);
          next(forms);
        }
      );
    }
  );
}

function intersect(a, b) {
  a = a.slice();
  b = b.slice();

  var result = [];
  while (a.length > 0 && b.length > 0) {
    if (a[0] < b[0]) {
      a.shift();
    } else if (a[0] > b[0]) {
      b.shift();
    } else /* they're equal */ {
      result.push(a.shift());
      b.shift();
    }
  }
  return result;
}

function compareCharsOLD(char1, char2) {
  getForms(context1, char1, function (forms1) {
    getForms(context2, char2, function (forms2) {
      var common = intersect(forms1[0], forms2[0]);
      // console.log(common);
    });
  });
}

function getEdges(data, offset) {
  var edges = [];

  eachPoints(data, function (el, i) {
    var left = leftPos(i),
      right = rightPos(i),
      down = downPos(i),
      up = upPos(i);

    if (
      !isPointBlank(data, i) &&
      (
        i / 400 < 1 ||
        isPointBlank(data, up)
      ) &&
      (
        right % 400 === 399 ||
        !isPointBlank(data, right)
      ) &&
      (
        down / 400 === 100 ||
        !isPointBlank(data, down)
      ) &&
      (
        left % 400 === 0 ||
        isPointBlank(data, left)
      )
    ) {
      edges.push(i);
    }
  });
  return edges;
}

function drawForms(forms) {
  clearContext(context2);

  var imgd = context2.createImageData(100, 100),
    data = imgd.data;

  forms.forEach(
    function (form) {
      form.forEach(
        function (line) {
          line.forEach(function (i) {
            data[i] = 255;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 255;
          });
        }
      );
    }
  );
  context2.putImageData(imgd, 0, 0);
}

function dissectCharOLD(char1) {
  clearContext(context1);
  drawChar(context1, char1, '#f00', function () {
     var img = getImageDataFromContext(context1),
      data = img.data,
      edges = getEdges(data),
      forms = [];

    // console.log(data, edges);

    edges.forEach(
      function (i) {
        var gun = getGun(data, i);

        if (
          gun.length > 0 &&
          gun[0].length > gun.length
        ) {
          forms.push(gun);
        }
        var yi = getYi(data, i);
        if (
          yi.length > 0 &&
          yi[0].length > yi.length
        ) {
          forms.push(yi);
        }
      }
    );
    // console.log(forms);
    drawForms(forms);
   });
}

function compareForms(form1, form2) {
  var common = intersect(
    form1.sort(function (a, b){return a - b;}),
    form2.sort(function (a, b){return a - b;})
  );

  drawPointsInContext(context3, common, RGB.green);
  drawPointsInContext(context4, common, RGB.green);

  var match1 = Math.round(100 * common.length / form1.length);
  var match2 = Math.round(100 * common.length / form2.length);
  return {
    match1: match1,
    match2: match2,
    common: common
  };
}

var DEBUG = false;
function compareCharForms(char1, char2, next) {
  clearContext(context1);
  dissectChar(context1, char1, function (forms1) {
    clearContext(context2);
    dissectChar(context2, char2, function (forms2) {
      var matches = [];

      forms1.slice(0, 1).forEach(function (form1, i1) {
        forms2.slice(0, 1).forEach(function (form2, i2) {
          intersection = compareForms(form1, form2);
          var common = intersection.common;
          var match1 = intersection.match1;
          var match2 = intersection.match2;
          if (match1 > 90 && match2 > 90) {
            console.log(
              char1, '|', char2,
              'form1:', i1, ', form2:', i2,
              common.length + '/' + form1.length,
              '(' + match1 + '%)',
              '/',
              '(' + match2 + '%)'
            );
            matches = [char1, char2];
          } else if (DEBUG) {
            console.log(
              char1, '|', char2,
              'form1:', i1, ', form2:', i2,
              common.length + '/' + form1.length,
              '(' + match1 + '%)',
              '/',
              '(' + match2 + '%)'
            );
          }
        });
      });
      typeof next === 'function' && next(matches.length > 0 ? matches : undefined);
    });
  });
}

function drawAllChars(chars, rate) {
  var funcs = Array.prototype.slice.call(chars).map(function (char1) {
    return function (callback) {
      setTimeout(function () {
        clearContext(context1);

        dissectChar(context1, char1);
        // drawChar(context1, char1);

        callback();
      }, rate ? 1000 / rate : 0);
    };
  });

  funcs.push(function end() {
    console.log(end);
  });

  series.apply(this, funcs);
}

function scaleForm(context, form) {
  clearContext(context);
  clearContext(scaleContext);
  // context.save();

  form = form.slice().sort(function (a, b) { return a - b; });
  // console.log(form);

  var xs = form.reduce(
      function (xs, coord) {
        var x = simplifiedX(coord);
        x > xs.max && (xs.max = x);
        x < xs.min && (xs.min = x);
        return xs;
      },
      { max: 0, min: Infinity }
    ),
    maxY = Math.floor(form[form.length - 1] / 100),
    minY = Math.floor(form[0] / 100);

  // console.log('x:(', xs.min, ',', xs.max, '), y:(', minY, ',', maxY, ')');
  drawPointsInContext(scaleContext, form, RGB.red);
  // context.scale(Math.floor(1000 / xs.max) / 10, Math.floor(1000 / maxY) / 10);
  context.drawImage(
    scaleContext.canvas,
    xs.min, minY,
    xs.max - xs.min + 1, maxY - minY + 1,
    0, 0, 100, 100
  );
}

function compareHaiBu(char1, char2, next) {
  dissectChar(context1, '还', function (forms1) {
    dissectChar(context2, '不', function (forms2) {
      scaleForm(context3, forms1[1]);
      scaleForm(context4, forms2[0].concat(forms2[1]));

      var form1 = getSimplifiedDataFromImageData(getImageDataFromContext(context3));
      var form2 = getSimplifiedDataFromImageData(getImageDataFromContext(context4));
      window.intersection = compareForms(form1, form2);
      // console.log(intersection);
    });
  });
}

function compareHaiBu(char1, char2, next) {
  dissectChar(context1, '还', function (forms1) {
    dissectChar(context2, '不', function (forms2) {
      scaleForm(context3, forms1[1]);
      scaleForm(context4, forms2[0].concat(forms2[1]));

      var form1 = getSimplifiedDataFromImageData(getImageDataFromContext(context3));
      var form2 = getSimplifiedDataFromImageData(getImageDataFromContext(context4));
      window.intersection = compareForms(form1, form2);
      // console.log(intersection);
    });
  });
}

var yong = '永';
var hui = '回';
var pairs = [
  ['字', '学'],
  ['蓝', '孟'],
  ['牛', '年'],
  ['仟', '仠'],
  ['生', '主']
];

function tata() {
  drawBothChars(pairs[0][0], pairs[0][1], function (img1, img2) {
  });
}


function compareZiXue(char1, char2, next) {
  char1 = pairs[2][0];
  char2 = pairs[2][1];
  drawChar(context3, char1, '0f0');
  drawChar(context4, char2, '0f0');
  dissectChar(context1, char1, function (forms1) {
    dissectChar(context2, char2, function (forms2) {
      if (false) {
        if (forms1.length >= 1) {
          scaleForm(context3, forms1.slice(-1)[0]);
        }
        if (forms2.length >= 1) {
          scaleForm(context4, forms2.slice(-1)[0]);
        }
      }

      var form1 = getSimplifiedDataFromImageData(getImageDataFromContext(context3));
      var form2 = getSimplifiedDataFromImageData(getImageDataFromContext(context4));
      window.intersection = compareForms(form1, form2);
      // console.log(intersection);
    });
  });
}

function filterRGB(data, rgb) {
  var points = [];

  eachPoints(data, function (r, i, data) {
    if (
      data[i] === rgb[0] &&
      data[i + 1] === rgb[1] &&
      data[i + 2] === rgb[2]
    ) {
      points.push(i / 4);
    }
  });
  return points;
}

function compareFormsAtPos(char1, pos1, char2, pos2) {
  dissectChar(context1, char1, function (forms1) {
    dissectChar(context2, char2, function (forms2) {
      scaleForm(context3, forms1.slice(pos1)[0]);
      scaleForm(context4, forms2.slice(pos2)[0]);


        var form1 = getSimplifiedDataFromImageData(getImageDataFromContext(context3));
        var form2 = getSimplifiedDataFromImageData(getImageDataFromContext(context4));
        window.intersection = compareForms(form1, form2);
        // console.log(intersection);

        window.exclusion1 = filterRGB(getImageDataFromContext(context3).data, RGB.red);
        window.exclusion2 = filterRGB(getImageDataFromContext(context4).data, RGB.red);
        drawPointsInContext(
          context5,
          exclusion1,
          RGB.red
        );
        drawPointsInContext(
          context6,
          exclusion2,
          RGB.red
        );
    });
  });
}

var clockWiseOrder = [
  -100, // up
  -100 + 1, // up right
  1, // right
  100 + 1, // down right
  100, // down
  100 - 1, // down left
  -1, // left
  -100 - 1, // up left
  0 // center
];

function getNextClockWise(data, start, visited) {
  var index = data.index;

  return clockWiseOrder.reduce(function (res, delta) {
    if (res !== undefined) return res;

    var next = start + delta;
    if (index[next] !== undefined && next !== visited) {
      return next;
    }
  }, undefined);
}

function getLinesFromScoopedData(scoopedData) {
  var index = scoopedData.index;
  var points = scoopedData.slice();
  var total = points.length;

  var lines = [];

  var pushed = 0;
  while (pushed < total) {
    var start;
    points.some(function (coord, i, points) {
      start = coord;
      delete points[i];
      delete index[start];
      pushed += 1;
      return true;
    });
    if (start === undefined) break;

    var line = [start];
    var lineIndex = {};
    line.index = lineIndex;
    lineIndex[start] = 0;
    var next = start;
    do {
      next = getNextClockWise(scoopedData, next, line.slice(-2)[0]);
      if (next !== start && next !== undefined) {
        lineIndex[next] = line.push(next) - 1;
        delete points[index[next]];
        delete index[next];
        pushed += 1;
      }
    } while (next !== start && next !== undefined);
    lines.push(line);
  }
  return lines;
}

function getLinesFromChar(context, char1) {
  var scooped = getScoopedDataFromChar(context, char1);
  return getLinesFromScoopedData(scooped);
}

function isOnCanvasBorder(coord) {
  var y = Math.floor(coord / 100);
  var x = coord % 100;

  return x === 0 ||
    x === 100 ||
    y === 0 ||
    y === 100;
}

function getScoopingFromSimplifiedData(data) {
  var scooped = [];
  var fillins = [];
  var scoopedIndex = {};
  var fillinsIndex = {};
  scooped.index = scoopedIndex;
  fillins.index = fillinsIndex;

  var index = data.index;
  data.forEach(function (coord) {
    if (
      !(
        index[coord - 1] >= 0 && // left
        index[coord - 100] >= 0 && // up
        index[coord + 1] >= 0 && // right
        index[coord + 100] >= 0 // down
      ) ||
      isOnCanvasBorder(coord)
    ) {
      scoopedIndex[coord] = scooped.push(coord) - 1;
    } else {
      fillinsIndex[coord] = fillins.push(coord) - 1;
    }
  });
  return {
    scooped: scooped,
    fillins: fillins
  };
}

function getScoopedDataFromContext(context) {
  var data = getSimplifiedDataFromImageData(getImageDataFromContext(context));

  var scooping = getScoopingFromSimplifiedData(data);
  drawPointsInContext(context, scooping.scooped, RGB.blue);
  // removing everything inside
  drawPointsInContext(context, scooping.fillins, RGB.white);
  return scooping.scooped;
}

function getScoopedDataFromChar(context, char1) {
  clearContext(context);
  drawChar(context, char1, '#f00');

  return getScoopedDataFromContext(context);
}

function arePointsAdjacent(a, b) {
  var diff = Math.abs(b - a);
  return diff === 1 || // left or right
    diff === 100 - 1 || // (up or down) left
    diff === 100 || // up or down
    diff === 100 + 1; // (up or down) right
}

function arePointsOnSameLine(a, b) {
  var diff = Math.abs(b - a);
  return diff === 1 || // left or right
    diff === 100; // up or down
}

/* STD-BY
function scoopedOutToLine(scooped) {
  scooped = scooped.slice();
  if (scooped.length < 2) return scooped;

  var i = 0;

  var lines = [];

  while (scooped.length > 0 && i < 10000) {
    var last = scooped.shift();
    var line = [last];

    var start = last;
    while (current !== start) {
      var current = scooped.shift();
      if (arePointsAdjacent(current, last)) {
        line.push(current);
        last = current;
      } else {
        scooped.push(current);
      }
      i += 1;
    }
    lines.push(line);
  }
  return lines;
}
*/

function printLine(line) {
  var printable = line.map(function (xy) {
    return [xy % 100, Math.floor(xy / 100)]
  }).join(' | ');
  console.log(printable);
}

function drawBordersAndMiddles(context2, borders) {
  var points = borders.reduce(function (res, borders) {
    if (DEBUG)
    console.log(
      simplifiedX(borders[0]), simplifiedY(borders[0]), ':',
      simplifiedX(borders[1]), simplifiedY(borders[1])
    );
    return res.concat(borders);
  }, []);
  drawPointsInContext(context2, points, RGB.black);

  var middles = borders.map(function (borders) {
    return Math.floor((simplifiedX(borders[0]) + simplifiedX(borders[1])) / 2) +
      Math.round((simplifiedY(borders[0]) + simplifiedY(borders[1])) / 2) * 100;
  });
  drawPointsInContext(context2, middles, RGB.red);
}

function getHorizontalBorders(simplifiedData) {
  var index = simplifiedData.index;
  var points = simplifiedData.slice();
  var borders = [];

  var start, end;
  while (points.length > 0) {
    do {
      start = points.shift();
    } while (
      // if start right point is blank, skip it
      index[start + 1] === undefined &&
      points.length > 0
    );

    if (points.length === 0) break;

    do {
      end = points.shift();
    } while (
      // end's right point is not blank
      index[end + 1] !== undefined
    );
    if (start !== end) {
      borders.push([start, end]);
    }
  }
  return borders;
}

function getVerticalBorders(simplifiedData) {
  var index = simplifiedData.index;
  var points = simplifiedData.slice();
  var borders = [];

  var start, end;
  while (points.length > 0) {
    do {
      start = points.shift();
    } while (
      // if start down point is blank, skip it
      index[start + 100] === undefined &&
      points.length > 0
    );

    if (points.length === 0) break;

    do {
      end = points.shift();
    } while (
      // end's down point is not blank
      index[end + 100] !== undefined
    );
    if (start !== end) {
      borders.push([start, end]);
    }
  }
  return borders;
}

function toHorizontalData(simplifiedData) {
  var data = simplifiedData.slice();
  data.index = simplifiedData.index;

  return data.sort(function (a, b) {
    // horizontal diff
    return simplifiedY(a) - simplifiedY(b) ||
      // vertical diff
      simplifiedX(a) - simplifiedX(b);
  });
}

function toVerticalData(simplifiedData) {
  var data = simplifiedData.slice();
  data.index = simplifiedData.index;

  return data.sort(function (a, b) {
    // horizontal diff
    return simplifiedX(a) - simplifiedX(b) ||
      // vertical diff
      simplifiedY(a) - simplifiedY(b);
  });
}

function borderDetectionFromSimplifiedData(simplifiedData) {
  var horiz = getHorizontalBorders(simplifiedData);
  var verti = getVerticalBorders(toVerticalData(simplifiedData));
  return horiz.concat(verti);
}

function borderDetectionChar(context1, char1) {
  clearContext(context1);
  drawChar(context1, char1, '#f00');
  var simplifiedData = getSimplifiedDataFromImageData(getImageDataFromContext(context1));
  return borderDetectionFromSimplifiedData(simplifiedData);
}

function dissectAndDetectBorder(channel, char1, i) {
  var context2 = window['context' + (+channel)];
  dissectChar(context2, char1, function (forms) {
    i = i || 0;
    forms.slice(i, i + 1).forEach(function (form) {
      var context4 = window['context' + (+channel + 2)];
      scaleForm(context4, form);
      var simplifiedData = getSimplifiedDataFromImageData(getImageDataFromContext(context4));
      var context6 = window['context' + (+channel + 4)];
      drawBordersAndMiddles(context6,
        borderDetectionFromSimplifiedData(simplifiedData)
      );
    });
  });
}

function detectSimplisticEdgesFromScoopedData(scoopedData) {
  var index = scoopedData.index;
  var points = scoopedData.slice();

  return points.reduce(function (edges, x) {
    var around = getAround(scoopedData, x);
    if (
      around.length === 2 &&
      Math.abs(around[0] - around[1]) !== 2 &&
      Math.abs(around[0] - around[1]) !== 200
    ) {
      console.log(x);
      edges.push(x);
    }
    return edges;
  }, []);
}

function detectEdgesFromSimplifiedData(data) {
  var index = data.index;
  var points = data.slice();

  return points.reduce(function (edges, x) {
    var around = getAround(data, x);
    if (
      around.length === 3
    ) {
      console.log(x);
      edges.push(x);
    }
    return edges;
  }, []);
}

function detectExtendedEdgesFromSimplifiedData(data) {
  var index = data.index;
  var points = data.slice();

  return points.reduce(function (edges, x) {
    var around = getAround(data, x);
    if (
      around.length <= 4
    ) {
      console.log(x);
      edges.push(x);
    }
    return edges;
  }, []);
}

function len(x, y){
  return Math.sqrt(x * x + y * y);
}

function angleBetween(a, b, c, d) {
  var x1 = simplifiedX(b) - simplifiedX(a);
  var y1 = simplifiedY(b) - simplifiedY(a);
  var x2 = simplifiedX(d) - simplifiedX(c);
  var y2 = simplifiedY(d) - simplifiedY(c);
  return Math.acos((x1 * x2 + y1 * y2) / (len(x1, y1) * len(x2, y2)));
}

function relativeAngleBetween(coord, coordA, coordB){
  var x = simplifiedX(coord);
  var y = simplifiedY(coord);
  var x1 = simplifiedX(coordA) - x;
  var y1 = simplifiedY(coordA) - y;
  var x2 = simplifiedX(coordB) - x;
  var y2 = simplifiedY(coordB) - y;
  return Math.acos((x1 * x2 + y1 * y2) / (len(x1, y1) * len(x2, y2)));
}

function detectOrthoEdgesFromLines(lines) {
  var edges = lines.reduce(function (edges, line) {
    return edges.concat(
      line.reduce(function (lineEdges, coord, i, scooped) {
        var coordA = scooped[(i === 0 ? scooped.length : i) - 1];
        var coordB = scooped[i + 1];

        if (relativeAngleBetween(coord, coordA, coordB) <= Math.PI / 2) {
          lineEdges.push(coord);
        }
        return lineEdges;
      }, [])
    );
  }, []);
  console.log(edges);
  return edges;
}

function detectOrthoEdgesFromScoopedData(scooped) {
  var lines = getLinesFromScoopedData(scooped);
  return detectOrthoEdgesFromLines(lines);
}

function consumeStraightFromLine(line, ortho) {
  var straight = [];

  var prev;
  var prevDelta, delta;
  while (line.length > 0) {
    point = line[0];
    if (prev) {
      delta = point - prev;
    }
    if (
      point && prev && (
        (ortho && !arePointsOnSameLine(prev, point)) ||
        prevDelta && prevDelta !== delta
      )
    ) {
      break;
    }
    straight.push(point);
    prev = line.shift();
    prevDelta = delta;
  }
  return straight;
}

function consumeCurvedLineFromLine(line) {
  var curved = [];
  do {
    curved = curved.concat(consumeStraightFromLine(line));

    // get current curve last two points
    var a = curved[curved.length - 2];
    var b = curved[curved.length - 1];
    // get next first two points
    var c = line[0];
    var d = line[1];

    var angle;
    if (d - c === b - a) {
      angle = 0;
    } else {
      angle = angleBetween(b, a, b, c);
      if (angle !== Math.PI / 2) {
        angle = angleBetween(a, b, c, d);
        if (angle !== Math.PI / 2) {
          angle = 0;
        }
      }
    }
  } while (line.length > 0 && angle < 0.0001);
  if (false && line.length > 0) {
    line.unshift(curved[curved.length - 1]);
  }
  return curved;
}

function consumeCurvedLinesFromLine(line) {
  var curves = [];
  while (line.length > 0) {
    var curved = consumeCurvedLineFromLine(line);
    drawPointsInContext(context1, curved, RGB.green);
    curves.push(curved);
  }
  return curves;
}

function consumeCurvedLinesFromScoopedLines(lines) {
  return lines.map(consumeCurvedLinesFromLine);
}

function detectEdgesByConsumingCurvesFromChar(context, char1) {
  var lines = getLinesFromChar(context, char1);
  var linesCurves = consumeCurvedLinesFromScoopedLines(lines);
  var edges = linesCurves.reduce(
    function (edges, curves) {
      return edges.concat(
        curves.map(function (curve) { return curve[0]; })
      );
    },
    []
  );
  drawPointsInContext(context1, edges, RGB.blue);
}

detectEdgesByConsumingCurvesFromChar(context1, yong);

function getStraightsFromLine(line) {
  var straights = [];
  while (line.length > 1) {
    straight = consumeStraightFromLine(line);
    straights.push(straight);
    line.unshift(straight[straight.length - 1]);
  }
  return straights;
}

function getStraightsLinesFromLines(lines) {
  return lines.map(getStraightsFromLine);
}

function getFirstFromStraights(straights) {
  var edges = straights.reduce(
    function (edges, straight) {
      return edges.concat(straight.slice(0, 1));
    },
    []
  );
  return edges;
}

function getStraightsEdgesFromStraightsLines(lines) {
  return lines.map(function (straights) {
    return getFirstFromStraights(straights);
  });
}

function getEdgesFromLine(line) {
  return line.reduce(
    function (res, point, i, line) {
      if (
        i === 0 ||
        !arePointsAdjacent(line[i - 1], point) ||
        !arePointsAdjacent(line[i + 1], point)
      ) {
        res.push(point);
      }
      return res;
    },
    []
  );
}

function getSanitizedEdgesLinesFromLines(lines) {
  return lines.map(function (line) {
    return getEdgesFromLine(line);
  });
}

function getFirstInAdjacentPointsFromLine(line) {
  return line.reduce(
    function (firsts, point, i, line) {
      if (
        i === 0 ||
        (
          !arePointsAdjacent(line[i - 1], point)
        )
      ) {
        firsts.push(point);
      }
      return firsts;
    },
    []
  );
}

function getFirstInAdjacentPointsFromLines(lines) {
  return lines.map(getFirstInAdjacentPointsFromLine);
}

function getFirstInAdjacentPointsFromChar(context, char1) {
  // method comparison
  // removeStraightsFromChar(context4, char1);

  var scooped = getScoopedDataFromChar(context, char1);
  var lines = getLinesFromScoopedData(scooped);
  return [
    getStraightsLinesFromLines,
    getStraightsEdgesFromStraightsLines,
    getSanitizedEdgesLinesFromLines,
    getFirstInAdjacentPointsFromLines
  ].reduce(function (res, func, i) {
    res = func(res);

    var context = window['context' + (i + 1)];
    clearContext(context);
    drawPointsInContext(context, scooped, [255, 0, 0]);
    if (res) {
      drawPointsInContext(context, flatten(flatten(res)), [0, 0, 255]);
    }
    return res;
  }, lines.slice());
}

function detectOrthoLineEdgesFromScoopedData(scooped) {
  var lines = getLinesFromScoopedData(scooped);
  var edges = lines.slice(1, 2).reduce(function (edges, line) {
    line = line.slice();

    var start = line[0];
    var lineEdges = [start];
    var angle;
    var lineAB = consumeStraightFromLine(line), lineCD;
    var a, b, c, d, backup;
    while (line.length > 0) {
      a = lineAB[0];
      b = lineAB[lineAB.length - 1];
      lineCD = consumeStraightFromLine(line);
      c = lineCD[0];
      d = lineCD[lineCD.length - 1];

      drawPointsInContext(context1, lineAB.concat(lineCD), RGB.green);
      if (
        simplifiedX(d) < simplifiedX(c) ||
        simplifiedY(d) < simplifiedY(c)
      ) {
        backup = d;
        d = c;
        c = backup;
      } else if (
        simplifiedX(b) < simplifiedX(a) ||
        simplifiedY(b) < simplifiedY(a)
      ) {
        backup = d;
        d = c;
        c = backup;
      }
      angle = angleBetween(a, b, c, d);
      drawPointsInContext(context1, lineAB.concat(lineCD), RGB.red);
      if (angle === 0) {
        lineAB = lineAB.concat(lineCD);
      } else if (angle <= Math.PI / 2) {
        drawPointsInContext(context1, [b], RGB.blue);
        // pushing middle point
        lineEdges.push(b);
        lineAB = lineCD;
      }

    }
    return edges.concat(lineEdges);
  }, []);
  console.log(edges);
  return edges;
}

function detectLineEdgesFromChar(context, char1) {
  var scooped = getScoopedDataFromChar(context, char1);
  drawPointsInContext(context1, scooped, RGB.blue);
  var edges = detectOrthoLineEdgesFromScoopedData(scooped);
  drawPointsInContext(context1, edges, RGB.green);
  return edges;
}

function scoopAndDetectEdgesFromSimplifiedData(context, data) {
  var scooped = getScoopingFromSimplifiedData(data).scooped;
  drawPointsInContext(context, scooped, RGB.blue);
  var edges = detectOrthoEdgesFromScoopedData(scooped);
  drawPointsInContext(context, edges, RGB.green);
  return edges;
}

function getSimplifiedDataFromChar(context, char1, sanitized) {
  clearContext(context);
  drawChar(context, char1, '#f00');
  if (sanitized) {
    sanitize(context);
  }

  return getSimplifiedDataFromImageData(getImageDataFromContext(context));
}

function scoopAndDetectEdgesFromChar(context, char1) {
  var data = getSimplifiedDataFromChar(context1, char1);
  var edges = scoopAndDetectEdgesFromSimplifiedData(context, data);
  return edges;
}

function dissectScoopAndDetectEdges(context, char1) {
  dissectChar(context, char1, function (forms) {
    var edges = scoopAndDetectEdgesFromSimplifiedData(context, forms[1]);
    drawPointsInContext(context2, edges, RGB.red);
  });
}

function edgeDetection(context1, char1) {
  var scooped = getScoopedDataFromChar(context1, char1);

  window.edges = detectSimplisticEdgesFromScoopedData(scooped);
  clearContext(context2);
  drawPointsInContext(context2, edges, RGB.red);
}

function getHorizontalLine(simplifiedData, start, left) {
  left = left ? -1 : 1;

  var index = simplifiedData.index;
  var line = [];
  for (; index[start] >= 0; start += 1 * left) {
    line.push(start);
  }
  return line;
}

function getVerticalLine(simplifiedData, start, up) {
  up = up ? -1 : 1;

  var index = simplifiedData.index;
  var line = [];
  for (; index[start] >= 0; start += 100 * up) {
    line.push(start);
  }
  return line;
}

function detectHorizontalLinesFromScoopedData(scoopedData) {
  var index = scoopedData.index;
  var points = scoopedData.slice();

  return points.reduce(function (lines, x) {
    var prevLine = lines.slice(-1)[0];
    if (prevLine && x === prevLine.slice(-1)[0] + 1) {
      prevLine.push(x);
    } else {
      lines.push([x]);
    }
    return lines;
  }, []);
}

function detectVerticalLinesFromScoopedData(scoopedData) {
  var index = scoopedData.index;
  var points = scoopedData.slice();

  return points.reduce(function (lines, x) {
    var prevLine = lines.slice(-1)[0];
    if (
      prevLine &&
      x === prevLine.slice(-1)[0] + 100
    ) {
      prevLine.push(x);
    } else {
      if (prevLine && prevLine.length > 1) {
        drawPointsInContext(context2, prevLine, RGB.red);
      }
      lines.push([x]);
    }
    return lines;
  }, []);
}

function lineDetection(char1) {
  var scooped = getScoopedDataFromChar(context1, char1);

  var horizontal = detectHorizontalLinesFromScoopedData(scooped);
  var horizontalPoints = horizontal.reduce(function (res, line) {
    if (line.length > 1) {
      return res.concat(line);
    }
    return res;
  }, []);
  var vertical = detectVerticalLinesFromScoopedData(toVerticalData(scooped));
  var verticalPoints = vertical.reduce(function (res, line) {
    if (line.length > 1) {
      return res.concat(line);
    }
    return res;
  }, []);
  clearContext(context2);
  drawPointsInContext(context2, horizontalPoints, RGB.red)
  drawPointsInContext(context2, verticalPoints, RGB.red)
}

/* STD-BY
function eachLineMode(scoopedData, func) {
  var index = scoopedData.index;
  var totalLength = scoopedData.length;

  var data = scoopedData.slice();
  while (totalLength) {
    var start = data.shift();
    var next = start;
    do {
      if (data[0] === next + 1) {
        next = data.shift();
        func(next)
      }
    } while (next !== start);
  }
}

function testEachLineMode(char1) {
  var scooped = getScoopedDataFromChar(context1, char1);

  eachLineMode(scooped, function (line) {
    // ?
  });
}
*/

function sliceSimplifiedDataFromPoint(simplifiedData, start, i1, i2) {
  var index = simplifiedData.indexOf(start);
  if (index === -1) {
    return [];
  }

  return simplifiedData.slice(index + i1, index + i2);
}

function enterAndGoToMiddle(char1) {
  var scoopedData = getScoopedDataFromChar(context1, char1);
  var verticalData = toVerticalData(scoopedData);

  var lineStart = scoopedData[0];

  var line = getHorizontalLine(scoopedData, lineStart);
  var lineEnd = line[line.length - 1];
  var middleStart = (lineStart + lineEnd) / 2;
  var middleLine = getHorizontalLine(scoopedData, middleStart);
  var vertical = sliceSimplifiedDataFromPoint(verticalData, middleStart, 1, 2);
  var middleEnd = vertical[0];
  var horizontal = sliceSimplifiedDataFromPoint(scoopedData, middleEnd, -1, 0);
  var startMiddleEnd = horizontal[0];
  var baseY = Math.floor(startMiddleEnd / 100);

  middleLine.forEach(function (point) {
    var vertical = sliceSimplifiedDataFromPoint(verticalData, point, 1, 2);
    var middleEnd = vertical[0];
    console.log(vertical);
    if (Math.floor(middleEnd / 100) === baseY) {
      var middleMiddle = (point + middleEnd) / 2

      drawPointsInContext(context1, [point, middleMiddle, middleEnd], RGB.red);
    }
  });
}

function formNormalisation(char1) {
  dissectChar(context1, char1, function (forms) {
    forms.forEach(function (form, i) {
      if (i > 0) { return; }
      form.sort(function (a,b) { return a - b; });

      clearContext(context2);
      drawPointsInContext(context2, form, RGB.blue);
      getScoopedDataFromContext(context2);

      console.log(form);

      console.log(
        getStringFromSimplifiedPoint(form[0]),
        ':',
        getStringFromSimplifiedPoint(form.slice(-1)[0])
      );

      var xyForm = getXYFormFromSimplifiedData(form);

      var previous = 0;
      console.log(
        '|' + xyForm.map(function (point) {
          var str = point.join(',');
          if (point[1] > previous) {
            str += '\n';
            previous = point[1];
          }
          return str;
        }).join('|')
      );

      var vec = xyForm.reduce(function (res, point) {
        var x = point[0];
        var y = point[1];
        res[y] === undefined && (res[y] = [], res.length = y + 1);
        res[y].push(point);
        return res;
      }, []).reduce(function (res, line, y) {
        if (line) {
          res.push([[line[0][0], y], [line.slice(-1)[0][0], y]]);
        }
        return res;
      });
      console.log(vec);
    });
  });
}

function getFirstRectFromSimplifiedData(data) {
  var start = data.shift();
  var right = getHorizontalLine(data, start);
    var rightDown = getVerticalLine(data, right.slice(-1)[0]);
  var down = getVerticalLine(data, start);
  var downRight = getHorizontalLine(data, down.slice(-1)[0]);
  return [right, rightDown, down, downRight];
}

function flatten(arr) {
  return arr.reduce(
    function (res, el) {
      return res.concat(el);
    },
    []
  );
}

function getRectFromSimplifiedData(data) {
  var rect = getFirstRectFromSimplifiedData(data);
  if (DEBUG) {
    drawPointsInContext(
      context1,
      flatten(rect),
      RGB.blue
    );
  }
  var lastRight = rect[1].slice(-1)[0];
  var lastLeft = rect[3].slice(-1)[0];
  if (lastLeft === lastRight) {
    return 2;
  } else if (
    rect[1].indexOf(lastLeft) !== -1 ||
    rect[3].indexOf(lastRight) !== -1
  ) {
    return 1;
  }
}

function getRectFromChar(context, char1) {
  clearContext(context);
  drawChar(context, char1, '#f00');

  var data = getSimplifiedDataFromImageData(getImageDataFromContext(context));
  return getRectFromSimplifiedData(data);
}

function removeStraightsFromLineData(line) {
  var index = line.index;

  var prevAngle = Math.PI;
  var prev;
  return line.reduce(function (points, point, i, line) {
    if (prev) {
      var next = i < line.length - 1 ? line[i + 1] : line[0];
      var angle = relativeAngleBetween(point, prev, next);
      var rightAngle = prevAngle !== angle &&
        Math.PI - angle !== 0;
    }
    if (!prev || rightAngle) {
      points.push(point);
    }
    prev = point;
    prevAngle = angle;
    return points;
  }, []);
}

function sanitizePointedLine(pointedLine) {
  var prev;
  return pointedLine.reduce(function (points, point, i, line) {
    if (!prev || !arePointsAdjacent(prev, point)) {
      points.push(point);
    }
    prev = point;
    return points;
  }, []);
}

function removeStraightsFromChar(context, char1) {
  clearContext(context);
  var lines = getLinesFromChar(context, char1);

  drawPointsInContext(context, flatten(lines), RGB.red);

  var pointedLines = lines.map(function (line) {
    return removeStraightsFromLineData(line);
  });

  drawPointsInContext(context, flatten(pointedLines), RGB.blue);

  return pointedLines;
}

function incrementalStraightRemoval(context, char1) {
  var lines = removeStraightsFromChar(context, char1);

  var line = lines[1];

  // return;
  var pointedLine = sanitizePointedLine(line);
  drawPointsInContext(context2, pointedLine, RGB.blue);

  pointedLine = line;

  // return;
  var prev = pointedLine;
  var next = prev;
  while (prev === next || next.length !== prev.length) {
    prev = next;
    next = removeStraightsFromLineData(prev);
    console.log(prev.length, next.length);
  }

  drawPointsInContext(context2, next, RGB.blue);
  return next;
}

function getWidth(a, b) {
  return Math.abs(simplifiedX(a) - simplifiedX(b));
}

function getHeight(a, b) {
  return Math.abs(simplifiedY(a) - simplifiedY(b));
}

function getDistance(a, b) {
  return Math.round(Math.sqrt(Math.pow(getWidth(a, b), 2) +
    Math.pow(getHeight(a, b), 2)));
}

function getNextLine(points) {
  var start = points.shift();

  var front;
  do {
    front = points.shift();
  } while (
    points.index[front + 1] !== undefined
  );
  return [start, front];
}

function drawCharCenter(context1, char1, next) {
  // next = next || function () {};

  drawChar(context1, char1, '#f00');
  var simplifiedData = getSimplifiedDataFromImageData(getImageDataFromContext(context1));

  var index = simplifiedData.index;
  var points = simplifiedData.slice();
  points.index = index;
  var end = simplifiedData.slice(-1)[0];

  var previousLine = getNextLine(points);
  var previousStart = previousLine[0];
  var previousFront = previousLine[1];

  // do {
  function getStartEnd() {
    var line = getNextLine(points);
    var start = line[0];
    var front = line[1];
    var distance = getDistance(start, front);
    console.log(distance + ':', start, front);

    var distanceA = getDistance(previousStart, front);
    var distanceB = getDistance(start, previousFront);
    var minDistance = Math.min(distance, distanceA, distanceB);
    if (distance === minDistance) {
      previousStart = start;
      previousFront = front;
    } else if (minDistance === distanceA) {
      previousFront = front;
    } else {
      previousStart = start;
    }
    console.log(distance, distanceA, distanceB)

    drawPointsInContext(context2, [previousStart, previousFront], RGB.red);
    setTimeout((front !== end) ? getStartEnd : next, 33);
  }
  getStartEnd();
  // while (front !== end);
}
