//

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

function isPointBlank(data, i) {
  return data[i + 3] === 0 ||
    data[i] === 255 &&
    data[i + 1] === 255 &&
    data[i + 2] === 255;
}

function getXY(i) {
  var x = i / 4 % 100,
    y = Math.floor(i / 4 / 100);

  return [x, y];
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

function filterRGBFromData(data, rgb) {
  var points = [];

  eachPoints(data, function (r, i, data) {
    if (
      data[i] === rgb[0] &&
      data[i + 1] === rgb[1] &&
      data[i + 2] === rgb[2] &&
      (!rgb[3] || data[i + 3] === rgb[3])
    ) {
      points.push(i);
    }
  });
  return points;
}

function applyDataOnData(target, source) {
  forEach(source, function (el, i) {
    target[i] = el;
  });
}

function applySimplifiedPointsOnData(target, points, rgb) {
  var isWhite = rgb[0] + rgb[1] + rgb[2] === 255 * 3;

  points.forEach(function (el) {
    el *= 4;
    target[el] = rgb[0];
    target[el + 1] = rgb[1];
    target[el + 2] = rgb[2];
    // setting alpha to 0 if color is actually 'white'
    target[el + 3] = isWhite ? 0 : 255;
  });
}

function drawSimplifiedPointsInContext(context, points, rgb, data) {
  var imgd = context.getImageData(context.canvas.width, context.canvas.height);

  applySimplifiedPointsOnData(imgd.data, points, rgb);
  context.context.putImageData(imgd, 0, 0);

  return context;
}

function imageDataIndicesToSimplified(data) {
  return data.map(function (coord) {
    return coord / 4;
  });
}

function getFilteredSimplifiedDataFromContext(context, rgb) {
  return compose(
    context.getData,
    rightBind(filterRGBFromData, rgb),
    imageDataIndicesToSimplified
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

function getDataFromImageData(imageData) {
  return imageData.data;
}

function toSimplified(i) {
  return i / 4;
}

function SimplifiedData() {
  var that = {};

  var points = [];
  var index = {};
  points.index = index;

  function fromData(data) {
    points.length = 0;
    eachPoints(data, function (el, i, data) {
      if (!isPointBlank(data, i)) {
        var point = toSimplified(i);
        index[point] = points.push(point) - 1;
      }
    });
  }

  function fromSimplifiedData(data) {
    points.length = 0;
    Array.prototype.push.apply(points, data);
    index = data.index;
    points.index = index;
  }

  function fromSimplifiedObject(object) {
    points.length = 0;
    Array.prototype.push.apply(points, object.points);
    index = object.points.index;
    points.index = index;
  }

  function getMaxMin() {
    return points.reduce(
      function (maxmin, coord) {
        var x = simplifiedX(coord);
        var y = simplifiedY(coord);

        x > maxmin.x.max && (maxmin.x.max = x);
        x < maxmin.x.min && (maxmin.x.min = x);
        y > maxmin.y.max && (maxmin.y.max = y);
        y < maxmin.y.min && (maxmin.y.min = y);
        return maxmin;
      },
      {
        x: { max: 0, min: Infinity },
        y: { max: 0, min: Infinity }
      }
    );
  }

  function getDirectionLine(start, directionFunc) {
    var dir = directionFunc(0);

    var line = [];
    for (; index[start] >= 0; start += dir) {
      line.push(start);
    }
    return line;
  }

  function getHorizontalLine(start, right) {
    return getDirectionLine(start, right ? simplifiedRight : simplifiedLeft);
  }

  function getVerticalLine(start, up) {
    return getDirectionLine(start, up ? simplifiedUp : simplifiedDown);
  }

  function getFirstRect() {
    var start = points[0];
    var right = getHorizontalLine(start);
    var rightDown = getVerticalLine(right.slice(-1)[0]);
    var down = getVerticalLine(start);
    var downRight = getHorizontalLine(down.slice(-1)[0]);
    return [right, rightDown, down, downRight];
  }

  function getScooping() {
    return getScoopingFromSimplifiedData(points);
  }

  function getXYForm() {
    var start = points[0];
    var startX = simplifiedX(start);
    var startY = simplifiedY(start);

    return points.map(function (coord) {
        return [simplifiedX(coord) - startX, simplifiedY(coord) - startY];
    });
  }

  function drawInContext(context, rgb) {
    drawSimplifiedPointsInContext(context, points, rgb);
    return that;
  }

  /* properties */
  that.points = points;
  /* builders */
  that.fromData = fromData;
  that.fromSimplifiedData = fromSimplifiedData;
  that.fromSimplifiedObject = fromSimplifiedObject;
  /* getters */
  that.getMaxMin = getMaxMin;
  that.getHorizontalLine = getHorizontalLine;
  that.getVerticalLine = getVerticalLine;
  that.getFirstRect = getFirstRect;
  that.getScooping = getScooping;
  that.getXYForm = getXYForm;
  /* doers */
  that.drawInContext = drawInContext;
  return that;
}

var SimplifiedDataFactory = (function() {
  var methods = [
    'fromData',
    'fromSimplifiedData',
    'fromSimplifiedObject'
  ];

  return methods.reduce(
    function (factory, method) {
      factory[method] = function (data) {
        var simple = SimplifiedData();
        simple[method](data);
        return simple;
      };
      return factory;
    },
    {}
  );
}());

function getRectFromSimplifiedData(context, data) {
  var rect = data.getFirstRect();
  if (DEBUG) {
    context.drawSimplifiedPoints(flatten(rect), RGB.blue);
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
  return 0;
}

function getRectFromChar(context, char1) {
  return compose(
    context.clear,
    leftBind(context.drawChar, char1, RGB.red),
    context.getSimplifiedData,
    leftBind(getRectFromSimplifiedData, context)
  );
}

function Context(canvas) {
  var that = {};

  var context = canvas.getContext('2d');

  function toString() {
    return 'context object';
  }

  function valueOf() {
    return 'context object';
  }

  function clear() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    return that;
  }

  function drawChar(char1, rgb, next) {
    context.font = '100px Microsoft Yahei';
    context.fillStyle = 'rgb(' + rgb.join(',') + ')';
    context.fillText(char1, 0, 85);

    typeof next === 'function' && next(context);
    return that;
  }

  function getImageData(w, h) {
    return context.getImageData(
      0,
      0,
      w || canvas.width,
      h || canvas.height
    );
  }

  var getData = composition(
    getImageData,
    getDataFromImageData
  );

  var getSimplifiedData = composition(
    getData,
    SimplifiedDataFactory.fromData
  );

  var drawSimplifiedPoints = drawSimplifiedPointsInContext.bind(that, that);

  function getScoopedData() {
    var data = getSimplifiedData();
    var scooping = data.getScooping();

    drawSimplifiedPoints(scooping.scooped, RGB.blue);

    // removing everything inside
    drawSimplifiedPoints(scooping.fillins, RGB.white);

    return scooping.scooped;
  }

  var getSimplifiedDataFromChar = function(char1, rgb) {
    that.drawChar(char1, rgb);
    return that.getSimplifiedData();
  };

  that.canvas = canvas;
  that.context = context;
  that.toString = toString;
  that.valueOf = valueOf;
  that.clear = clear;
  that.drawChar = drawChar;
  that.getImageData = getImageData;
  that.getData = getData;
  that.getSimplifiedData = getSimplifiedData;
  that.getSimplifiedDataFromChar = getSimplifiedDataFromChar;
  that.drawSimplifiedPoints = drawSimplifiedPoints;
  that.getScoopedData = getScoopedData;
  return that;
}

function Canvas(id, hidden) {
  var canvas = document.createElement('canvas');

  canvas.id = id;
  canvas.width = 100;
  canvas.height = 100;

  if (hidden) {
    canvas.style.display = 'none';
  }
  document.body.appendChild(canvas);

  function getContext() {
    return Context(canvas);
  }

  return {
    canvas: canvas,
    getContext: getContext
  };
}

function bigCanvas(canvas) {
  canvas.style.height = '200px';
}

// SIMPLIFIED METHODS

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

// SIMPLIFIED METHODS

// hidden scaling helper canvas
var scaleCanvas = Canvas('myCanvas', true);
var scaleContext = scaleCanvas.getContext(scaleCanvas);

var canvas1 = Canvas('myCanvas');
var context1 = canvas1.getContext(canvas1);

var canvas2 = Canvas('myCanvas2');
var context2 = canvas2.getContext(canvas2);

var canvas3 = Canvas('myCanvas3');
var context3 = canvas3.getContext(canvas3);

var canvas4 = Canvas('myCanvas4');
var context4 = canvas4.getContext(canvas4);

var canvas5 = Canvas('myCanvas5');
var context5 = canvas5.getContext(canvas5);

var canvas6 = Canvas('mycanvas6');
var context6 = canvas6.getContext(canvas6);

function sanitizeImageData(img, rgb) {
  var img = context.getImageData();

  eachPoints(img.data, function (el, i, data) {
    data[i + 0] = (data[i + 0] < 200) ? 0 : 255;
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = (data[i + 3] < 254) ? 0 : 255;
  });
  context.putImageData(img, 0, 0);
}

function sanitizeContext(context, rgb) {
  var filtered = getFilteredSimplifiedDataFromContext(context, rgb);

  context.clear();
  context.drawSimplifiedPoints(filtered, rgb);
}

function pushIfWithin(arr, arr2, el) {
  if (arr2.index[el] >= 0) {
    arr.push(el);
  }
}

function simplifiedLeft(x) {
  return x - 1;
}

function simplifiedUp(x) {
  return x - 100;
}

function simplifiedRight(x) {
  return x + 1;
}

function simplifiedDown(x) {
  return x + 100;
}

function getAround(data, start) {
  var around = [];

  pushIfWithin(around, data, simplifiedLeft(start));
  pushIfWithin(around, data, simplifiedLeft(simplifiedUp(start)));
  pushIfWithin(around, data, simplifiedUp(start));
  pushIfWithin(around, data, simplifiedUp(simplifiedRight(start)));
  pushIfWithin(around, data, simplifiedRight(start));
  pushIfWithin(around, data, simplifiedRight(simplifiedDown(start)));
  pushIfWithin(around, data, simplifiedDown(start));
  pushIfWithin(around, data, simplifiedDown(simplifiedLeft(start)));

  return around;
}

var RGB = {
  red: [255, 0, 0],
  green: [0, 255, 0],
  blue: [0, 0, 255],

  black: [0, 0, 0],
  white: [255, 255, 255]
};

function getCommon(char1, char2, next) {
  var data1 = context1.getSimplifiedDataFromChar(char1, RGB.red).points,
      data2 = context2.getSimplifiedDataFromChar(char2, RGB.red).points,
      common;

  common = intersect(data1, data2);
  typeof next === 'function' && next(common);
  return common;
}

function highlightCommon(char1, char2) {
  getCommon(char1, char2, function (common) {
    context1.drawSimplifiedPoints(common, [255, 200, 150]);
    context2.drawSimplifiedPoints(common, [150, 200, 255]);
  });
}

function drawGradientForms(context, forms) {
  forms.forEach(function (form, i) {
    context.drawSimplifiedPoints(
      form,
      [50, 255 * (forms.length - i) / forms.length + 50, 50]
    );
  });
}

function dissectSimplifiedPoints(points, next) {
  points = points.slice();
  setArrayIndex(points);

  var forms = [];

  var visited = {};
  var notVisited = points;
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
    form.index = index;
    forms.push(
      SimplifiedDataFactory.fromSimplifiedData(toHorizontalData(form))
    );
  }

  typeof next === 'function' && next(forms);
  return forms;
}

function dissectContext(context, next) {
  return dissectSimplifiedPoints(context.getSimplifiedData().points);
}

function dissectChar(context, char1, next) {
  context.clear();
  context.drawChar(char1, RGB.red);
  return dissectContext(context, next);
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

function testIfYi(context, char1) {
  context.clear();
  context.drawChar(char1, RGB.red, function () {
    var data = context.getData();

    // console.log(data);
    getYi(data);
  });
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
    context.drawSimplifiedPoints(form, RGB.green, data);
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

function getForms(context, char1, next) {
  context.clear();
  context.drawChar(
    char1,
    RGB.red,
    function () {
      var data = context.getData();

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
  context2.clear();

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
  context1.clear();
  context1.drawChar(char1, RGB.red, function () {
     var data = context1.getData(),
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

  var match1 = Math.round(100 * common.length / form1.length);
  var match2 = Math.round(100 * common.length / form2.length);
  return {
    match1: match1,
    match2: match2,
    common: common
  };
}

var DEBUG = false;

function printMatches(char1, char2, i1, i2, common, form1, form2, match1, match2) {
  console.log(
    char1,
    'n:', i1,
    common.length + '/' + form1.length,
    '(' + match1 + '%)',
    '|',
    char2,
    'n:', i2,
    common.length + '/' + form2.length,
    '(' + match2 + '%)'
  );
}

function compareCharForms(char1, char2, next) {
  context1.clear();
  context2.clear();

  var forms1 = dissectChar(context1, char1);
  var forms2 = dissectChar(context2, char2);
  var matches = [];

  forms1.forEach(function (form1, i1) {
    forms2.forEach(function (form2, i2) {
      var intersection = compareForms(form1.points, form2.points);
      var common = intersection.common;
      var match1 = intersection.match1;
      var match2 = intersection.match2;
      if (match1 > 90 && match2 > 90) {
        printMatches(char1, char2, i1, i2, common, form1.points, form2.points, match1, match2);
        matches = [char1, char2];
      } else if (DEBUG) {
        printMatches(char1, char2, i1, i2, common, form1.points, form2.points, match1, match2);
      }
    });
  });
  matches = matches.length > 0 ? matches : undefined;
  typeof next === 'function' && next(matches);
  return matches;
}

function drawAllChars(chars, rate) {
  var funcs = arraySlice(chars).map(function (char1) {
    return function (callback) {
      setTimeout(function () {
        context1.clear();

        dissectChar(context1, char1);
        // context1.drawChar(char1);

        callback();
      }, rate ? 1000 / rate : 0);
    };
  });

  funcs.push(function end() {
    console.log(end);
  });

  series.apply(this, funcs);
}

function scaleSimplifiedData(context, data) {
  context.clear();
  scaleContext.clear();

  var maxmin = data.getMaxMin();

  scaleContext.drawSimplifiedPoints(data.points, RGB.red);
  context.context.drawImage(
    scaleContext.context.canvas,
    maxmin.x.min, maxmin.y.min,
    maxmin.x.max - maxmin.x.min + 1, maxmin.y.max - maxmin.y.min + 1,
    0, 0,
    100, 100
  );
}

var hai = '还';
var bu = '不';
var yong = '永';
var hui = '回';
var pairs = [
  ['字', '学'],
  ['蓝', '孟'],
  ['牛', '年'],
  ['仟', '仠'],
  ['生', '主']
];

function compareHaiBu(char1, char2) {
  var forms1 = dissectChar(context1, hai);
  var forms2 = context2.drawChar(bu, RGB.red).getSimplifiedData();

  scaleSimplifiedData(context3, forms1[1]);
  scaleSimplifiedData(context4, forms2);

  var form1 = context3.getSimplifiedData().points;
  var form2 = context4.getSimplifiedData().points;

  return compareForms(form1, form2);
}

function compareFormsAtPos(char1, pos1, char2, pos2) {
  var forms1 = dissectChar(context1, char1);
  var forms2 = dissectChar(context2, char2);

  scaleSimplifiedData(context3, forms1.slice(pos1)[0]);
  scaleSimplifiedData(context4, forms2.slice(pos2)[0]);

  var form1 = context3.getSimplifiedData().points;
  var form2 = context4.getSimplifiedData().points;

  return compareForms(form1, form2);
}

var clockWiseOrder = [
  simplifiedLeft,
  composition(simplifiedLeft, simplifiedUp),
  simplifiedUp,
  composition(simplifiedUp, simplifiedRight),
  simplifiedRight,
  composition(simplifiedRight, simplifiedDown),
  simplifiedDown,
  composition(simplifiedDown, simplifiedLeft)
];

function getNextClockWise(data, start, visited) {
  var index = data.index;

  return clockWiseOrder.reduce(function (res, delta) {
    if (res !== undefined) return res;

    var next = delta(start);
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

function getScoopedDataFromChar(context, char1) {
  context.clear();
  context.drawChar(char1, RGB.red);

  return context.getScoopedData();
}

function getLinesFromChar(context, char1) {
  var scooped = getScoopedDataFromChar(context, char1);
  return getLinesFromScoopedData(scooped);
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

function isOnCanvasBorder(coord) {
  var y = Math.floor(coord / 100);
  var x = coord % 100;

  return x === 0 ||
    x === 100 ||
    y === 0 ||
    y === 100;
}

function getScoopingFromSimplifiedData(data) {
  var index = data.index;
  data = data.slice();

  var scooped = [];
  var fillins = [];
  var scoopedIndex = {};
  var fillinsIndex = {};
  scooped.index = scoopedIndex;
  fillins.index = fillinsIndex;

  data.forEach(function (coord) {
    if (
      !(
        index[simplifiedLeft(coord)] >= 0 &&
        index[simplifiedUp(coord)] >= 0 &&
        index[simplifiedRight(coord)] >= 0 &&
        index[simplifiedDown(coord)] >= 0
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

function printLine(line) {
  var printable = line.map(function (xy) {
    return [simplifiedX(xy), simplifiedY(xy)];
  }).join(' | ');
  console.log(printable);
}

function drawBordersAndMiddles(context, borders) {
  var points = flatten(borders);
  context.drawSimplifiedPoints(points, RGB.black);

  var middles = borders.map(function (borders) {
    return Math.floor((simplifiedX(borders[0]) + simplifiedX(borders[1])) / 2) +
      Math.round((simplifiedY(borders[0]) + simplifiedY(borders[1])) / 2) * 100;
  });
  context.drawSimplifiedPoints(middles, RGB.red);
}

function getDirectionBorders(simplifiedData, directionFunc) {
  var index = simplifiedData.index;
  var points = simplifiedData.slice();
  var borders = [];

  var start, end;
  while (points.length > 0) {
    do {
      start = points.shift();
    } while (
      // if start down point is blank, skip it
      index[directionFunc(start)] === undefined &&
      points.length > 0
    );

    if (points.length === 0) break;

    do {
      end = points.shift();
    } while (
      // end's down point is not blank
      index[directionFunc(end)] !== undefined
    );
    if (start !== end) {
      borders.push([start, end]);
    }
  }
  return borders;
}

function getHorizontalBorders(simplifiedData) {
  return getDirectionBorders(simplifiedData, simplifiedRight);
}

function getVerticalBorders(simplifiedData) {
  return getDirectionBorders(simplifiedData, simplifiedDown);
}

function setArrayIndex(data) {
  data.index = data.reduce(
    function (index, x, i) {
      index[x] = i;
      return index;
    },
    {}
  );
  return data;
}

function toHorizontalData(simplifiedData) {
  return setArrayIndex(
    simplifiedData.slice().sort(function (a, b) {
      // only a basic sort is needed
      return a - b;
    })
  );
}

function toVerticalData(simplifiedData) {
  return setArrayIndex(
    simplifiedData.slice().sort(function (a, b) {
      // horizontal diff
      return simplifiedX(a) - simplifiedX(b) ||
        // vertical diff
        simplifiedY(a) - simplifiedY(b);
    })
  );
}

function borderDetectionFromSimplifiedData(simplifiedData) {
  var horiz = getHorizontalBorders(simplifiedData);
  var verti = getVerticalBorders(toVerticalData(simplifiedData));
  return horiz.concat(verti);
}

function borderDetectionChar(context, char1) {
  var simplifiedData = context.getSimplifiedDataFromChar(char1, RGB.red).points;
  return borderDetectionFromSimplifiedData(simplifiedData);
}

function dissectAndDetectBorder(channel, char1, i) {
  var context2 = window['context' + (+channel)];
  var forms = dissectChar(context2, char1);
  i = i || 0;
  forms.slice(i, i + 1).forEach(function (form) {
    var context4 = window['context' + (+channel + 2)];
    scaleSimplifiedData(context4, form);
    var simplifiedData = context4.getSimplifiedData().points;
    var context6 = window['context' + (+channel + 4)];
    drawBordersAndMiddles(context6,
      borderDetectionFromSimplifiedData(simplifiedData)
    );
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

var radDeg = 180 / Math.PI;
var degRad = Math.PI / 180;

function radToDeg(rad) {
  return radDeg * rad;
}

function degToRad(deg) {
  return degRag * deg;
}

function angleBetween(a, b, c, d) {
  var x1 = simplifiedX(b) - simplifiedX(a);
  var y1 = simplifiedY(b) - simplifiedY(a);
  var x2 = simplifiedX(d) - simplifiedX(c);
  var y2 = simplifiedY(d) - simplifiedY(c);
  var angle = (x1 * x2 + y1 * y2) / (len(x1, y1) * len(x2, y2));
  var rounded = Math.round(angle * 1000) / 1000;
  return Math.acos(rounded);
}

function relativeAngleBetween(coord, coordA, coordB){
  var x = simplifiedX(coord);
  var y = simplifiedY(coord);
  var x1 = simplifiedX(coordA) - x;
  var y1 = simplifiedY(coordA) - y;
  var x2 = simplifiedX(coordB) - x;
  var y2 = simplifiedY(coordB) - y;
  var angle = (x1 * x2 + y1 * y2) / (len(x1, y1) * len(x2, y2));
  var rounded = Math.round(angle * 1000) / 1000;
  return Math.acos(rounded);
}

function getLineEdgesFromLine(line) {
  return line.reduce(function (lineEdges, coord, i, scooped) {
    var coordA = scooped[(i === 0 ? scooped.length : i) - 1];
    var coordB = scooped[i + 1];

    if (relativeAngleBetween(coord, coordA, coordB) <= Math.PI / 2) {
      lineEdges.push(coord);
    }
    return lineEdges;
  }, []);
}

function detectOrthoEdgesFromLines(lines) {
  return mapAndConcat(getLineEdgesFromLine)(lines);
}

var detectOrthoEdgesFromScoopedData = composition(
  getLinesFromScoopedData,
  detectOrthoEdgesFromLines
);

function consumeStraightFromLine(line, ortho, touch) {
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
        (touch && !arePointsAdjacent(prev, point)) ||
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
  return curved;
}

function consumeCurvedLinesFromLine(line) {
  var curves = [];
  while (line.length > 0) {
    var curved = consumeCurvedLineFromLine(line);
    curves.push(curved);
  }
  return curves;
}

function detectEdgesByConsumingCurvesFromChar(context, char1) {
  var lines = getLinesFromChar(context, char1);
  var linesCurves = toMap(consumeCurvedLinesFromLine)(lines);
  return mapAndConcat(getFirstFromArraysOfArrays)(linesCurves);
}

context1.drawSimplifiedPoints(
  detectEdgesByConsumingCurvesFromChar(context1, yong),
  RGB.red
);

function getStraightsFromLine(line, ortho, touch) {
  var straights = [];
  var limit = ortho ? 0 : 1;
  while (line.length > limit) {
    var straight = consumeStraightFromLine(line, ortho, touch);
    straights.push(straight);

    // add very first point to last straight (closing the line)
    if (line.length === 0 && straights.length > 0) {
      straight.push(straights[0][0]);
    }

    if (!ortho && !touch) {
      line.unshift(straight[straight.length - 1]);
    }
  }
  return straights;
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

function getFirstInAdjacentPointsFromLine(line) {
  return line.reduce(
    function (firsts, point, i, line) {
      if (
        i === 0 ||
        !arePointsAdjacent(line[i - 1], point)
      ) {
        firsts.push(point);
      }
      return firsts;
    },
    []
  );
}

function getFirstInAdjacentPointsFromChar(context, char1) {
  // method comparison
  // removeStraightsFromChar(context4, char1);

  var scooped = getScoopedDataFromChar(context, char1);
  var lines = getLinesFromScoopedData(scooped);
  return [
    toMap(getStraightsFromLine),
    getFirstFromArraysOfArrays,
    toMap(getEdgesFromLine),
    toMap(getFirstInAdjacentPointsFromLine)
  ].reduce(function (res, func, i) {
    res = func(res);

    var context = window['context' + (i + 1)];
    context.clear();
    context.drawSimplifiedPoints(scooped, RGB.red);
    if (res) {
      context.drawSimplifiedPoints(flatten(flatten(res)), RGB.blue);
    }
    return res;
  }, lines.slice());
}

function keepFirstAndCall(/*func, arg1, arg2...*/) {
  var func = rightBind.apply(this, arguments);
  return function (arr) {
    var start = arr.slice(0, 1);
    var res = func.apply(this, arguments);
    return start.concat(res);
  };
}

function getStraightsLastsFromLine(line, ortho, touch) {
  line = line.slice();

  // var start = line[0];
  // lasts.unshift(start);
  return keepFirstAndCall(function (line, ortho, touch) {
    var straights = getStraightsFromLine(line, ortho, touch);
    var lasts = toMap(getLastFromArray)(straights);
    return lasts;
  })(line, ortho, touch);

  // return lasts;
}

function getStraightEdgesFromLine(line) {
  var lasts2 = getStraightsLastsFromLine(line.slice());
  return getStraightsLastsFromLine(lasts2.slice(), false, true);
}

function detectOrthoLineEdgesFromScoopedData(context, scooped) {
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

      context.drawSimplifiedPoints(lineAB.concat(lineCD), RGB.green);
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
      context.drawSimplifiedPoints(lineAB.concat(lineCD), RGB.red);
      if (angle === 0) {
        lineAB = lineAB.concat(lineCD);
      } else if (angle <= Math.PI / 2) {
        context.drawSimplifiedPoints([b], RGB.blue);
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
  context.drawSimplifiedPoints(scooped, RGB.blue);
  var edges = detectOrthoLineEdgesFromScoopedData(context, scooped);
  context.drawSimplifiedPoints(edges, RGB.green);
  return edges;
}

function scoopAndDetectEdgesFromSimplifiedData(context, data) {
  var scooped = getScoopingFromSimplifiedData(data.points).scooped;
  context.drawSimplifiedPoints(scooped, RGB.blue);
  var edges = detectOrthoEdgesFromScoopedData(scooped);
  context.drawSimplifiedPoints(edges, RGB.green);
  return edges;
}

function scoopAndDetectEdgesFromChar(context, char1) {
  var data = context.getSimplifiedDataFromChar(char1, RGB.red);
  var edges = scoopAndDetectEdgesFromSimplifiedData(context, data);
  return edges;
}

function dissectScoopAndDetectEdges(context, char1) {
  var forms = dissectChar(context, char1);
  var edges = scoopAndDetectEdgesFromSimplifiedData(context, forms[1]);
  context2.drawSimplifiedPoints(edges, RGB.red);
}

function edgeDetection(context1, char1) {
  var scooped = getScoopedDataFromChar(context1, char1);

  window.edges = detectSimplisticEdgesFromScoopedData(scooped);
  context2.clear();
  context2.drawSimplifiedPoints(edges, RGB.red);
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
      x === simplifiedDown(prevLine.slice(-1)[0])
    ) {
      prevLine.push(x);
    } else {
      if (prevLine && prevLine.length > 1) {
        context2.drawSimplifiedPoints(prevLine, RGB.red);
      }
      lines.push([x]);
    }
    return lines;
  }, []);
}

function lineDetection(char1) {
  var scooped = getScoopedDataFromChar(context1, char1);

  var horizontal = detectHorizontalLinesFromScoopedData(scooped);
  var horizontalPoints = flatten(horizontal.filter(function (line) {
    return line.length > 1;
  }));
  var vertical = detectVerticalLinesFromScoopedData(toVerticalData(scooped));
  var verticalPoints = flatten(vertical.filter(function (line) {
    return line.length > 1;
  }));
  context2.clear();
  context2.drawSimplifiedPoints(horizontalPoints, RGB.red)
  context2.drawSimplifiedPoints(verticalPoints, RGB.red)
}

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

      context1.drawSimplifiedPoints([point, middleMiddle, middleEnd], RGB.red);
    }
  });
}

function formNormalisation(char1) {
  var forms = dissectChar(context1, char1);
  forms.forEach(function (form, i) {
    if (i > 0) { return; }
    form.sort(function (a,b) { return a - b; });

    context2.clear();
    context2.drawSimplifiedPoints(form, RGB.blue);
    context.getScoopedData(2);

    console.log(form);

    console.log(
      getStringFromSimplifiedPoint(form[0]),
      ':',
      getStringFromSimplifiedPoint(form.slice(-1)[0])
    );

    var xyForm = form.getXYForm();

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
}

function removeStraightsFromLine(line) {
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
  context.clear();
  var lines = getLinesFromChar(context, char1);

  context.drawSimplifiedPoints(flatten(lines), RGB.red);

  var pointedLines = toMap(removeStraightsFromLine)(lines);

  context.drawSimplifiedPoints(flatten(pointedLines), RGB.blue);

  return pointedLines;
}

function incrementalStraightRemoval(context, char1) {
  var lines = removeStraightsFromChar(context, char1);

  var line = lines[1];

  // return;
  var pointedLine = sanitizePointedLine(line);
  context2.drawSimplifiedPoints(pointedLine, RGB.blue);

  pointedLine = line;

  // return;
  var prev = pointedLine;
  var next = prev;
  while (prev === next || next.length !== prev.length) {
    prev = next;
    next = removeStraightsFromLine(prev);
    console.log(prev.length, next.length);
  }

  context2.drawSimplifiedPoints(next, RGB.blue);
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

function getNextHorizontalLine(points) {
  var start = points.shift();

  var front;
  do {
    front = points.shift();
  } while (
    points.index[sipmlifiedRight(front)] !== undefined
  );
  return [start, front];
}

function drawCharCenter(context1, char1, next) {
  // next = next || function () {};

  context1.drawChar(char1, RGB.red);
  var simplifiedData = context1.getSimplifiedData().points;

  var index = simplifiedData.index;
  var points = simplifiedData.slice();
  points.index = index;
  var end = simplifiedData.slice(-1)[0];

  var previousLine = getNextHorizontalLine(points);
  var previousStart = previousLine[0];
  var previousFront = previousLine[1];

  // do {
  function getStartEnd() {
    var line = getNextHorizontalLine(points);
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

    context2.drawSimplifiedPoints([previousStart, previousFront], RGB.red);
    setTimeout((front !== end) ? getStartEnd : next, 33);
  }
  getStartEnd();
  // while (front !== end);
}
