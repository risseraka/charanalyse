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

function getSimplifiedImageData(imageData) {
  var simplified = [];

  eachPoints(imageData.data, function(el, i, data) {
    if (!isPointBlank(data, i)) {
      simplified.push(i / 4);
    }
  });
  return simplified;
}

function series() {
  var funcs = Array.prototype.slice.call(arguments);
  var end = funcs.pop();

  function loop() {
    var func = funcs.shift();

    if (!func) return end();

    setTimeout(func.bind(this, loop), 0);
  }
  loop();
}

var canvas1 = createCanvas('myCanvas');
var context1 = canvas1.getContext('2d');

var canvas2 = createCanvas('myCanvas2');
var context2 = canvas2.getContext('2d');

var canvas3 = createCanvas('myCanvas3');
var context3 = canvas3.getContext('2d');

var canvas4 = createCanvas('myCanvas4');
var context4 = canvas4.getContext('2d');

var canvas5 = createCanvas('myCanvas5', true);
var context5 = canvas5.getContext('2d');

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

function printSimplifiedData(data) {
  var lines = data.reduce(function(result, el) {
    var xy = getXY(el * 4);
    if (!result[xy[1]]) {
      result[xy[1]] = [];
    }
    result[xy[1]].push(xy[0]);
    return result;
  }, {});

  Object.keys(lines).forEach(function(i) {
    console.log('y:', i, '|', lines[i].reduce(function(str, point) {
      return str + (str ? ' ' : '') + point;
    }, ''));
  });
}

function getCommon(car1, car2, next) {
  drawBothChars(car1, car2, function (img1, img2) {
    var common,
      data1 = getSimplifiedImageData(img1),
      data2 = getSimplifiedImageData(img2);

    console.log(data1, data2);
    common = intersect(data1, data2);
    printSimplifiedData(common);
    //console.log('commons:', str);
    console.log('total:', common.length);
    typeof next === 'function' && next(common);
  });
}

function highlightCommon(char1, char2) {
  getCommon(char1, char2, function(common) {
    drawPointsInContext(context1, common, [255, 200, 150], getCanvasData(context1).data);
    drawPointsInContext(context2, common, [150, 200, 255], getCanvasData(context2).data);
  });
}

function pushIfWithin(arr, arr2, el) {
  if (arr2.index[el]) {
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
    var img = getCanvasData(context);
    var dataIndex = {};
    eachPoints(img.data, function(el, i, data) {
      data[i + 0] = (data[i + 0] < 200) ? 0 : 255;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = (data[i + 3] < 254) ? 0 : 255;
      if (data[i + 0]) {
        dataIndex[i / 4] = true;
      }
    });
    context.putImageData(img, 0, 0);

    var data = getSimplifiedImageData(getCanvasData(context));
    data.index = dataIndex;

    //console.log(data);

    var forms = [];

    var visited = {};
    var notVisited = data;
    while (notVisited.length > 0) {
      var form = [];
      var edge = notVisited.shift();

      if (visited[edge]) continue;

      var toVisit = [edge];
      while (toVisit.length > 0) {
        var x = toVisit.shift();

        if (visited[x]) continue;
        visited[x] = true;

        toVisit = toVisit.concat(getAround(notVisited, x));
        form.push(x);
      }
      // console.log('visited:', visited);
      // console.log('notVisited:', notVisited);
      forms.push(form);
    }
    // console.log(forms.length, forms);

    if (DEBUG)
    forms.forEach(function(form, i) {
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
    data[i + 2] === 0 &&
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
    console.log(start, last, ':', line, lastLine);
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
    console.log(start, last, ':', line, lastLine);
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

    console.log(data);
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
    //console.log(current);
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

function drawPointsInContext(context, points, color, data) {
  points = points.slice();
  var canvas = context.canvas;

  !data && (data = getCanvasData(context).data);
  var imgd = context.createImageData(canvas.width, canvas.height),
    data2 = imgd.data;

  if (data)
  forEach(data, function (el, i) {
    data2[i] = el;
  });
  points.forEach(function (el) {
    el *= 4;
    data2[el] = color[0];
    data2[el + 1] = color[1];
    data2[el + 2] = color[2];
    data2[el + 3] = 255;
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

  console.log(form);

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

      console.log(data);
      consumeForms(
        context,
        data,
        [],
        function (forms) {
          console.log(forms);
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
      console.log(common);
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

    console.log(data, edges);

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
    console.log(forms);
    drawForms(forms);
   });
}

var DEBUG = false;
function compareCharForms(char1, char2, next) {
  clearCanvas(context1);
  dissectChar(context1, char1, function(forms1) {
    clearCanvas(context2);
    dissectChar(context2, char2, function(forms2) {
      var matches = [];

      forms1.slice(0, 1).forEach(function(form1, i1) {
        forms2.slice(0, 1).forEach(function(form2, i2) {
          intersection = intersect(
            form1.sort(function(a, b){return a - b;}),
            form2.sort(function(a, b){return a - b;})
          );
          var match1 = Math.round(100 * intersection.length / form1.length);
          var match2 = Math.round(100 * intersection.length / form2.length);
          drawPointsInContext(context1, intersection, [255, 0, 0]);
          drawPointsInContext(context2, intersection, [255, 0, 0]);
          if (match1 > 90 && match2 > 90) {
            console.log(
              char1, '|', char2,
              'form1:', i1, ', form2:', i2,
              intersection.length + '/' + form1.length,
              '(' + match1 + '%)',
              '/',
              '(' + match2 + '%)'
            );
            matches = [char1, char2];
          } else if (DEBUG) {
            console.log(
              char1, '|', char2,
              'form1:', i1, ', form2:', i2,
              intersection.length + '/' + form1.length,
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
  var funcs = Array.prototype.slice.call(chars).map(function(char1) {
    return function(callback) {
      setTimeout(function() {
        clearCanvas(context1);

        dissectChar(char1)
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
  clearCanvas(context5);
  context.save();

  form = form.slice().sort(function(a, b) { return a - b; });
  console.log(form);

  var maxX = form.reduce(function(max, x) { x = x % 100; return x > max ? x : max; }, 0),
    maxY = Math.round(form[form.length - 1] / 100);

  drawPointsInContext(context5, form, [0, 255, 0]);
  context.scale(Math.round(1000 / maxX) / 10, Math.round(1000 / maxY) / 10);
  context.drawImage(context5.canvas, 0, 0);
  context.restore();
}
