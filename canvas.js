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

function createCanvas(id) {
    var canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.width = 100;
    canvas.height = 100;

    document.body.appendChild(canvas);
    return canvas;
}

function clearCanvas(canvas, context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function getCanvasData(canvas, context) {
    return context.getImageData(0, 0, canvas.width, canvas.height);
}

var canvas1 = createCanvas('myCanvas');
var context1 = canvas1.getContext('2d');

var canvas2 = createCanvas('myCanvas2');
var context2 = canvas2.getContext('2d');

function drawChar(context, car, color, next) {
    context.font = '100px Microsoft Yahei';
    context.fillStyle = color;
    context.fillText(car, 0, 80);
    typeof next === "function" && next(context);
}

function draw2Chars(chars, colors, next) {
    clearCanvas(canvas1, context1);
    clearCanvas(canvas2, context2);

    drawChar(context1, chars[0], colors[0], function () {
        drawChar(context2, chars[1], colors[1], next);
    });
}

function compareChars(car1, car2, next) {
    draw2Chars(
        [car1, car2],
        ['#f00', '#00f'],
        function () {
            var img1, img2;

            img1 = getCanvasData(canvas1, context1);
            img2 = getCanvasData(canvas2, context2);

            next(img1, img2);
        }
    );
}

function getCommon(car1, car2) {
    compareChars(car1, car2, function (img1, img2) {
        var common = [], data1 = img1.data, data2 = img2.data;

        console.log(img1, img2);
        var i, j;
        for (i = 0, j = data1.length; i < j; i += 4) {
            if (
                (
                    data1[i] !== 0 ||
                    data1[i + 1] !== 0 ||
                    data1[i + 2] !== 0 &&
                    data1[i + 3] !== 0
                ) &&
                (
                    data2[i] !== 0 ||
                    data2[i + 1] !== 0 ||
                    data2[i + 2] !== 0 &&
                    data2[i + 3] !== 0
                )
            ) {
                common.push([
                    data1[i],
                    data1[i + 1],
                    data1[i + 2],
                    data1[i + 2]
                ]);
            } else {
                common.push(0);
            }
        }
        console.log(common);
        var total = common.reduce(
            function (result, el) {
                 return result + (el != 0);
            },
            0
        );
        console.log('total:', total);
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

function setPointColor(data, start, color) {
    data[start] = color[0];
    data[start + 1] = color[1];
    data[start + 2] = color[2];
    data[start + 3] = color[3];
}

function drawPoint(context, img, data, start, color) {
    setPointColor(data, start, color);
    context.putImageData(img, 0, 0);
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

function testIfYi(canvas, context, car) {
    clearCanvas(canvas, context);
    drawChar(context, car, '#f00', function () {
        var img = getCanvasData(canvas, context),
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

    function addIfNotVisitedNotBlank(i, func) {
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
            addIfNotVisitedNotBlank(leftPos(current), form.unshift);
            addIfNotVisitedNotBlank(rightPos(current), form.unshift);
            addIfNotVisitedNotBlank(upPos(current), form.push);
            addIfNotVisitedNotBlank(downPos(current), form.push);
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
        var imgd = context.createImageData(100, 100),
            data2 = imgd.data;

        forEach(data, function (el, i) {
            data2[i] = el;
        });
        form.forEach(function (el) {
            setPointColor(data2, el, [0, 255, 0, 255]);
        });
        context.putImageData(imgd, 0, 0);
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

function getForms(canvas, context, car, next) {
    clearCanvas(canvas, context);
    drawChar(
        context,
        car,
        '#f00',
        function () {
            var img = getCanvasData(canvas, context),
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
  var result = new Array();
  while( a.length > 0 && b.length > 0 )
  {  
     if      (a[0] < b[0] ){ a.shift(); }
     else if (a[0] > b[0] ){ b.shift(); }
     else /* they're equal */
     {
       result.push(a.shift());
       b.shift();
     }
  }

  return result;
}

function compareChars(char1, char2) {
    getForms(canvas1, context1, char1, function (forms1) {
        getForms(canvas2, context2, char2, function (forms2) {
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
    clearCanvas(canvas2, context2);

    var imgd = context2.createImageData(100, 100),
        data = imgd.data;

    forms.forEach(
        function (form) {
            form.forEach(
                function (line) {
                    line.forEach(function (i) {
                        setPointColor(data, i, [255, 0, 0, 255]);
                    });
                }
            );
        }
    );
    context2.putImageData(imgd, 0, 0);
}

function dissectChar(char1) {
    clearCanvas(canvas1, context1);
    drawChar(context1, char1, '#f00', function () {
         var img = getCanvasData(canvas1, context1),
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

function sanitize(data) {
    eachPoints(
        data,
        function (el, i) {
            if (!isPointBlank(data, i)) {
                setPointColor(data, i, [255, 0, 0, 255]);
            }
        }
    );
}

function getWidth(a, b) {
    return Math.abs(a % 400 - b % 400) / 4;
}

function getHeight(a, b) {
    return Math.abs(Math.floor(a / 400) - Math.floor(b / 400));
}

function getDistance(a, b) {
    return Math.sqrt(Math.pow(getWidth(a, b), 2) +
        Math.pow(getHeight(a, b), 2));
}

function getX(a) {
    return a % 400;
}

function getY(a) {
    return Math.floor(a / 400);
}

function pointToString(a) {
    return a + "(" + getX(a) + "," + getY(a) + ")";
}

function compose(func1, func2) {
    var that = func1;

    function composition() {
        var res = that.apply(composition, arguments);
        return func2.apply(composition, res);
    }
    return composition;
}

function arrify(func) {
    return function arrifiedFunction() {
        return [func.apply(this, arguments)];
    };
}

function composeFromSingle(func1, func2) {
    return compose(
        arrify(func1),
        func2
    );
}

function drawCharCenter(char1, canvas) {
    canvas = canvas || canvas1;
    context = canvas === canvas1 ? context1 : context2

    clearCanvas(canvas, context);
    drawChar(context, char1, '#f00',
        function () {
            var img = getCanvasData(canvas, context),
                data = img.data,
                edges = getEdges(data),
                forms = [];

            sanitize(img.data);

            var start = 0,
                begin,
                line,
                end,
                middle,
                prevBegin,
                prevEnd,
                prevLineLength,
                visited = [];

            var middles = [];

            function computeHoriz() {
                function selectBegin() {
                    var tempBegin,
                        tempEnd;

                    if (prevBegin === undefined) {
                        tempBegin = getFirstPointPos(data, start);
                        line = getPixelLineFrom(data, tempBegin);
                        tempEnd = line.slice(line.length - 1)[0];
                    } else {
                        tempBegin = getBlankSurroundedDownPoint(prevBegin);
                        tempEnd = prevEnd;
                    }

                    var beginToEndWidth = getWidth(tempBegin, tempEnd);
                    var distance = getDistance(prevBegin, tempEnd);
                    console.log();
                    if (
                        prevLineLength !== undefined &&
                        beginToEndWidth > distance ||
                        getX(tempBegin) > getX(prevBegin)
                    ) {
                        begin = prevBegin;
                    } else {
                        begin = tempBegin;
                        line = getPixelLineFrom(data, tempBegin);
                        drawPoint(context, img, data, begin, [0, 255, 0, 255]);
                    }
                    console.log(
                        "begin:" + pointToString(tempBegin),
                        "prevEnd:" + pointToString(tempEnd),
                        "distance:", Math.floor(distance));
                }

                function getSurroundingBlanksCount(a) {
                    return isPointBlank(data, upPos(a)) +
                        isPointBlank(data, upPos(rightPos(a))) +
                        isPointBlank(data, rightPos(a)) +
                        isPointBlank(data, rightPos(downPos(a))) +
                        isPointBlank(data, downPos(a)) +
                        isPointBlank(data, downPos(leftPos(a))) +
                        isPointBlank(data, leftPos(a)) +
                        isPointBlank(data, leftPos(upPos(a)));
                }

                function getBlankSurroundedDownPoint(prev) {
                    var getPoses = [
                        downPos,
                        composeFromSingle(downPos, rightPos),
                        composeFromSingle(downPos, leftPos),
                        leftPos,
                        rightPos,
                    ];

                    return getPoses.reduce(
                        function (result, getPos) {
                            var pos = getPos(prev),
                                count;

                            if (
                                visited[pos] === true ||
                                isPointBlank(data, pos)
                            ) {
                                return result;
                            }
                            count = getSurroundingBlanksCount(pos);
                            if (count > result.max) {
                                result.max = count;
                                result.pos = pos;
                            }
                            return result;
                        }, {
                            "pos": 0,
                            "max": 0
                        }
                    ).pos;
                }

                function getDirectLeftBlankedDownPoint(prev) {
                    var down = downPos(prev);

                    while (
                        !isPointBlank(data, leftPos(down)) &&
                        !isPointBlank(data, upPos(down))) {
                        down = leftPos(down);
                    }
                    return down;
                }

                function getDirectRightBlankDownPoint(prev) {
                    var down = downPos(prev);

                    while (isPointBlank(data, down)) {
                        down = leftPos(down);
                    }
                    return down;
                }

                function selectEnd() {
                    if (!prevEnd) {
                        end = line.slice(line.length - 1)[0];
                    } else {
                        end = getBlankSurroundedDownPoint(prevEnd);
                        visited[end] = true;
                        if (end === 0) {
                            end = prevEnd;
                        }
                    }

                    if (prevEnd === end) {
                        console.log('prevend === end');
                        return;
                    }

                    drawPoint(context, img, data, end, [0, 255, 0, 255]);

                    //middle = line.slice(line.length / 2)[0];
                    middle = Math.min(getX(begin), getX(end)) +
                        Math.round(getWidth(begin, end) / 2) * 4 +
                        getY(Math.min(begin, end)) * 400 +
                        Math.floor(Math.abs(
                            (getY(end) - getY(begin)) / 2
                        )) * 400;
                    //middle += 4 - middle % 4;
                    middles.push(middle);

                    drawPoint(context, img, data, middle, [0, 0, 0, 255]);

                    prevLineLength = (end % 400 - begin % 400) / 4;
                    prevBegin = begin;
                    prevEnd = end;
                    start = end + 4;
                    setTimeout(computeHoriz, 33);
                }

                selectBegin();
                if (begin === -1) {
                    return;
                }
                setTimeout(selectEnd, 33);
            }
            computeHoriz();

            function draw() {
                if (middles.length === 0) {
                    return;
                }

                var middle = middles.shift();

                setPointColor(data, middle, [0, 0, 0, 255]);

                context.putImageData(img, 0, 0);
                setTimeout(draw, 33);
            }
        }
    );
}

document.getElementById('draw').onclick = function () {
    drawCharCenter("丿");
};
