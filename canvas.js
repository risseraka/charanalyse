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

function clearCanvas(context) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}

function getCanvasData(context, w, h) {
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

function simplifiedPointToString(coord) {
  return '(' + simplifiedX(coord) + ',' + simplifiedY(coord) + ')';
}

function simplifiedDataToCoord(simplifiedData) {
  var start = simplifiedData[0];
  var startX = simplifiedX(start);
  var startY = simplifiedY(start);

  return simplifiedData.map(function (coord) {
      return [simplifiedX(coord) - startX, simplifiedY(coord) - startY];
  });
}

function getSimplifiedImageData(imageData) {
  var simplified = [];

  eachPoints(imageData.data, function (el, i, data) {
    if (!isPointBlank(data, i)) {
      simplified.push(i / 4);
    }
  });
  return simplified;
}

function getSimplifiedImageDataWithIndex(imageData) {
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

  function loop() {
    var func = funcs.shift();

    if (!func) return typeof end === 'function' && end();

    setTimeout(func.bind(this, loop), 0);
  }
  loop();
}

function toCallback(func) {
  return function (callback) {
    func();
    typeof callback === 'function' && callback();
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

  typeof next === 'function' && next(context);
}

function bind(func/*, args, ...*/) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function () {
    func.apply(this, args.concat(Array.prototype.slice.call(arguments)));
  };
}

function drawBothChars(car1, car2, next) {
  clearCanvas(context1);
  clearCanvas(context2);
  series(
    bind(drawChar, context1, car1, '#f00'),
    bind(drawChar, context2, car2, '#00f'),
    function () {
      var img1, img2;

      img1 = getCanvasData(context1);
      img2 = getCanvasData(context2);

      typeof next === 'function' && next(img1, img2);
    }
  );
}

function getCommon(car1, car2, next) {
  drawBothChars(car1, car2, function (img1, img2) {
    var common,
      data1 = getSimplifiedImageData(img1),
      data2 = getSimplifiedImageData(img2);

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
    drawPointsInContext(context1, common, [255, 200, 150], getCanvasData(context1).data);
    drawPointsInContext(context2, common, [150, 200, 255], getCanvasData(context2).data);
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

function dissectChar(context, char1, next) {
  clearCanvas(context);
  drawChar(context, char1, '#f00', function (context) {
    if (false) {
      var img = getCanvasData(context);
      eachPoints(img.data, function (el, i, data) {
        data[i + 0] = (data[i + 0] < 200) ? 0 : 255;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = (data[i + 3] < 254) ? 0 : 255;
      });
      context.putImageData(img, 0, 0);
    }

    var data = getSimplifiedImageDataWithIndex(getCanvasData(context));

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
        getCanvasData(context).data
      );
    });
    typeof next === 'function' && next(forms);
  });
}

function isPointBlank(data, i) {
  return data[i] === 0 &&
    data[i + 1] === 0 &&
    data[i + 2] === 0 ||
    data[i + 3] === 0;
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
  clearCanvas(context);
  drawChar(context, car, '#f00', function () {
    var img = getCanvasData(context),
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

function drawPointsInContext(context, points, rgb, data) {
  points = points.slice();
  var canvas = context.canvas;

  !data && (data = getCanvasData(context).data);
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
    drawPointsInContext(context, form, [0, 255, 0], data);
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
  clearCanvas(context);
  drawChar(
    context,
    car,
    '#f00',
    function () {
      var img = getCanvasData(context),
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
  clearCanvas(context2);

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
  clearCanvas(context1);
  drawChar(context1, char1, '#f00', function () {
     var img = getCanvasData(context1),
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

  drawPointsInContext(context3, common, [0, 255, 0]);
  drawPointsInContext(context4, common, [0, 255, 0]);

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
  clearCanvas(context1);
  dissectChar(context1, char1, function (forms1) {
    clearCanvas(context2);
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
        clearCanvas(context1);

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
  clearCanvas(context);
  clearCanvas(scaleContext);
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
  drawPointsInContext(scaleContext, form, [255, 0, 0]);
  // context.scale(Math.floor(1000 / xs.max) / 10, Math.floor(1000 / maxY) / 10);
  context.drawImage(
    scaleContext.canvas,
    xs.min, minY,
    xs.max - xs.min, maxY - minY,
    0, 0, 100, 100
  );
}

function compareHaiBu(char1, char2, next) {
  dissectChar(context1, '还', function (forms1) {
    dissectChar(context2, '不', function (forms2) {
      scaleForm(context3, forms1[1]);
      scaleForm(context4, forms2[0].concat(forms2[1]));

      var form1 = getSimplifiedImageData(getCanvasData(context3));
      var form2 = getSimplifiedImageData(getCanvasData(context4));
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

      var form1 = getSimplifiedImageData(getCanvasData(context3));
      var form2 = getSimplifiedImageData(getCanvasData(context4));
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

      var form1 = getSimplifiedImageData(getCanvasData(context3));
      var form2 = getSimplifiedImageData(getCanvasData(context4));
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


        var form1 = getSimplifiedImageData(getCanvasData(context3));
        var form2 = getSimplifiedImageData(getCanvasData(context4));
        window.intersection = compareForms(form1, form2);
        // console.log(intersection);

        window.exclusion1 = filterRGB(getCanvasData(context3).data, [255, 0, 0]);
        window.exclusion2 = filterRGB(getCanvasData(context4).data, [255, 0, 0]);
        drawPointsInContext(
          context5,
          exclusion1,
          [255, 0, 0]
        );
        drawPointsInContext(
          context6,
          exclusion2,
          [255, 0, 0]
        );
    });
  });
}

function isOnCanvasBorder(coord) {
  var y = Math.floor(coord / 100);
  var x = coord % 100;

  return x === 0 ||
    x === 100 ||
    y === 0 ||
    y === 100;
}

function scoopFromSimplifiedData(data) {
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
        index[coord + 100] >= 0
      ) || // down
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

function scoopContext(context) {
  var data = getSimplifiedImageDataWithIndex(getCanvasData(context));

  var scooping = scoopFromSimplifiedData(data);
  drawPointsInContext(context, scooping.scooped, [0, 0, 255]);
  // removing everything inside
  drawPointsInContext(context, scooping.fillins, [255, 255, 255]);
  return scooping.scooped;
}

function scoopChar(context, char1) {
  clearCanvas(context);
  drawChar(context, char1, '#f00');

  return scoopContext(context);
}

function arePointsAdjacent(a, b) {
  var diff = b - a;
  return diff === 0 - 1 || // left
    diff === 100 - 1 || // up left
    diff === 100 || // up
    diff === 100 + 1 || // up right
    diff === 0 + 1 || // right
    diff === -100 + 1 || // down right
    diff === -100 || // down;
    diff === -100 - 1 // down left;
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
  drawPointsInContext(context2, points, [0, 0, 0]);

  var middles = borders.map(function (borders) {
    return Math.floor((simplifiedX(borders[0]) + simplifiedX(borders[1])) / 2) +
      Math.round((simplifiedY(borders[0]) + simplifiedY(borders[1])) / 2) * 100;
  });
  drawPointsInContext(context2, middles, [255, 0, 0]);
}

function getHorizontalBorders(simplifiedData) {
  var points = simplifiedData.slice();
  var borders = [];
  var index = simplifiedData.index;

  var start = points.shift();
  while (points.length > 0) {
    // if start right point is blank, continue
    if (index[start + 1] === undefined) {
      start = points.shift();
      continue;
    }

    var end = points.shift();
    // end is on the same line as start
    if (simplifiedY(start) === simplifiedY(end)) {
      // end's right point is blank
      if (index[end + 1] === undefined) {
        borders.push([start, end]);
        start = points.shift();
      }
    } else {
      start = end;
    }
  }
  return borders;
}

function getVerticalBorders(simplifiedData) {
  var points = simplifiedData.slice();
  var borders = [];
  var index = simplifiedData.index;

  var start = points.shift();
  while (points.length > 0) {
    // if start down point is blank, continue
    if (index[start + 100] === undefined) {
      start = points.shift();
      continue;
    }

    var end = points.shift();
    // end is on the same column as start
    if (simplifiedX(start) === simplifiedX(end)) {
      // end's down point is blank, line is complete
      if (index[end + 100] === undefined) {
        borders.push([start, end]);
        start = points.shift();
      }
    } else {
      start = end;
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

var clockWiseOrder = [
  1, // right
  100 + 1, // down right
  100, // down
  100 - 1, // down left
  -1, // left
  -100 - 1, // up left
  -100, // up
  -100 + 1, // up right
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

function scoopedDataToLines(scoopedData) {
  var index = scoopedData.index;
  var points = scoopedData.slice();
  var total = points.length;

  var lines = [];
  var pushed = 0;
  while (pushed < total) {
    var start;
    points.some(function(coord, i, points) {
      start = coord;
      delete points[i];
      delete index[start];
      pushed += 1;
      return true;
    });
    if (start === undefined) break;

    var line = [start];
    var next = start;
    do {
      next = getNextClockWise(scoopedData, next, line.slice(-2)[0]);
      if (next !== start) {
        line.push(next);
        delete points[index[next]];
        delete index[next];
        pushed += 1;
      }
    } while (next !== start && next !== undefined);
    lines.push(line);
  }
  return lines;
}

function borderDetection(char1) {
  clearCanvas(context1);
  drawChar(context1, char1, '#f00');
  var simplifiedData = getSimplifiedImageDataWithIndex(getCanvasData(context1));

  clearCanvas(context2);
  var borders = getHorizontalBorders(simplifiedData);
  drawBordersAndMiddles(borders, simplifiedData);
  var borders = getVerticalBorders(toVerticalData(simplifiedData));
  drawBordersAndMiddles(borders, simplifiedData);
}

function detectEdgesFromScoopedData(scoopedData) {
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

function edgeDetection(char1) {
  var scooped = scoopChar(context1, char1);

  window.edges = detectEdgesFromScoopedData(scooped);
  clearCanvas(context2);
  drawPointsInContext(context2, edges, [255, 0, 0])
}

function getHorizontalLine(simplifiedData, start) {
  var index = simplifiedData.index;
  var line = [];
  for (; index[start] >= 0; start += 1) {
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
        drawPointsInContext(context2, prevLine, [255, 0, 0]);
      }
      lines.push([x]);
    }
    return lines;
  }, []);
}

function lineDetection(char1) {
  var scooped = scoopChar(context1, char1);

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
  clearCanvas(context2);
  drawPointsInContext(context2, horizontalPoints, [255, 0, 0])
  drawPointsInContext(context2, verticalPoints, [255, 0, 0])
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
  var scooped = scoopChar(context1, char1);

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
  var scoopedData = scoopChar(context1, char1);
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

      drawPointsInContext(context1, [point, middleMiddle, middleEnd], [255, 0, 0]);
    }
  });
}

function formNormalisation(char1) {
  dissectChar(context1, char1, function (forms) {
    forms.forEach(function (form, i) {
      if (i > 0) { return; }
      form.sort(function (a,b) { return a - b; });

      clearCanvas(context2);
      drawPointsInContext(context2, form, [0, 0, 255]);
      scoopContext(context2);

      console.log(form);

      console.log(
        simplifiedPointToString(form[0]),
        ':',
        simplifiedPointToString(form.slice(-1)[0])
      );

      var xyForm = simplifiedDataToCoord(form);

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
      }, []).reduce(function(res, line, y) {
        if (line) {
          res.push([[line[0][0], y], [line.slice(-1)[0][0], y]]);
        }
        return res;
      });
      console.log(vec);
    });
  });
}
