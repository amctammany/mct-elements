var raf = require('./raf');

var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');
var w, h;

var _dirty = true;

var rows, columns, maxIndex;

var BODY_TYPES = {
  source: 0,
  reflector: 1,
  collector: 2,
  stream: 3
};

var ELEMENT_TYPES = {
  air: 0,
  water: 1,
  fire: 2,
  earth: 3
};
var ELEMENT_MIX = {
  0: {
    0: 0,
    1: 0,
    2: 2,
    3: 0,
  },
  1: {
    0: 1,
    1: 1,
    2: 0,
    3: 1,
  },
  2: {
    0: 2,
    1: 0,
    2: 2,
    3: 2,
  },
  3: {
    0: 3,
    1: 3,
    2: 3,
    3: 3
  },
};
var ELEMENT_FILL = {
  0: 'lightgray',
  1: 'blue',
  2: 'red',
  3: 'brown',
};

// Object Notation = [ELEMENT_TYPE, ROW, COLUMN, DIRECTION]
var levels = [
  {
    rows: 20,
    columns: 20,
    sources: [
      [0, 4, 3, 1],
      [2, 1, 7, 2],
      [1, 8, 3, 1],
    ],
    reflectors: [
      [0, 5, 10, 3],
      [2, 6, 6, 2],
    ],
    collectors: [
      [1, 15, 15, 0],
      [0, 18, 18, 0],
    ]
  }
];

var currentLevel = {};
var sources = [];
var streams = [];
var reflectors = [];
var collectors = [];

var _bodies = [];
var _sources = [];


var Stream = function (source, element, direction) {
  this.type = 4;
  this.source = source;
  this.element = element;
  this.direction = direction;
  this.path = [];
  this.completed = false;
  this.collisions = [];
  this.current = shiftIndex(this.source.index, this.direction);
  //this.propagate();
};

Stream.prototype = {
  propagate: function () {
    if (this.completed) { return; }
    var cell = selectedLevel[this.current];
    if (cell instanceof Stream) {
      this.completed = true;
      var collision = new Collision(this.current, cell, this);
      this.output = collision;
      this.collisions.push(collision);
      selectedLevel[this.current] = collision;
      return;
    } else if (cell instanceof Body) {
      this.completed = true;
      this.output = cell;
      this.cull(this.current);
      cell.collidesWith(this);
      return;
    } else {
      selectedLevel[this.current] = this;
      this.path.push(this.current);
      if (!checkBoundaries(this.current)) { this.completed = true;}
      this.current = shiftIndex(this.current, this.direction);
      this.propagate();
    }
  },
  cull: function (index) {
    var i = this.path.indexOf(index);
    if (i >= 0) {
      if (this.output !== undefined) {
        this.output.inputs.splice(this.output.inputs.indexOf(this),1);
      }
      var tail = this.path.slice(i);
      tail.forEach(function(j) {
        selectedLevel[j] = undefined;

      });
      this.path.splice(i, tail.length);
    }
  },
};

var Collision = function (index, c1, c2) {
  this.index = index;
  this.c1 = c1;
  this.c2 = c2;
  if (this.c1 instanceof Stream) {
    this.c1.cull(index);
    this.c1.collisions.push(this);
  }
  if (this.c2 instanceof Stream) {
    this.c2.cull(index);
    this.c2.collisions.push(this);
  }
  this.generateStreams();
};
Collision.prototype = {
  generateStreams: function () {
    var e1 = ELEMENT_MIX[this.c1.element][this.c2.element];
    var e2 = ELEMENT_MIX[this.c2.element][this.c1.element];
    if (this.c1 instanceof Stream) {
      var s1 = new Stream(this, e1, this.c1.direction);
      streams.push(s1);
    }
    if (this.c2 instanceof Stream) {
      var s2 = new Stream(this, e2, this.c2.direction);
      streams.push(s2);
    }

  }
};

var Body = function (type, configArray) {
  this.type = BODY_TYPES[type];
  this.element = configArray[0];
  this.index = getIndex(configArray[1], configArray[2]);
  this.direction = configArray[3];

  this.status = false;

  this.inputs = [];
  this.outputs = [];
};

Body.prototype = {
  generateStreams: function () {
    switch (this.type) {
      case 0:
        streams.push(new Stream(this, this.element, this.direction));
        this.status = true;
        break;
      case 1:
        //console.log('reflector');
        var e, dir;
        var self = this;
        var input = this.inputs[0];

        //this.inputs.forEach(function (input) {
        if (input) {
          e = ELEMENT_MIX[input.element][this.element];
          dir = (this.direction + 1) % 4;
          var s = new Stream(this, e, dir);
          console.log(s);
        }
          //streams.push(new Stream(self, e, dir));
        //});
        break;
      case 2:
        //console.log('collector');
        break;
      case 3:
        //console.log('stream');
        break;
    }
  },
  move: function (i) {
    if (i === this.index) { return false; }
    _selectedLevel[this.index] = undefined;
    this.inputs = [];
    this.outputs = [];
    this.index = i;
    _selectedLevel[this.index] = this;
    _dirty = true;
  },
  collidesWith: function (stream) {
    if (this.element === undefined) {return;}
    this.inputs.push(stream);
    var elm = (stream.element === this.element) ? this.element : ELEMENT_MIX[stream.element][this.element];
    var dir = (this.direction + 1) % 4;
    this.generateStreams();
    //var s1 = new Stream(this, elm, dir);
    //console.log(s1);
  },
  draw: function (row, column) {
    switch (this.type) {
      case 0:
    }
  }
};

function checkBoundaries(index) {
  if (index < 0 || index >= maxIndex) { return false; }
  var row = getRow(index);
  var col = getColumn(index);
  if (row < 0 || row >= rows || col <= 0 || col >= columns - 1) {
    return false;
  }
  return true;
}
var _selectedLevel = {};
function loadLevel(level){
  rows = level.rows;
  columns = level.columns;
  maxIndex = rows * columns;
  w = canvas.width / columns;
  h = canvas.height / rows;
  selectedLevel = {};
  level.sources.forEach(function (s) {
    var body = new Body('source', s);
    body.status = 'ready';
    _bodies.push(body);
    _selectedLevel[body.index] = body;
  });
  level.reflectors.forEach(function (r) {
    var body = new Body('reflector', r);
    _bodies.push(body);
    _selectedLevel[body.index] = body;
  });
  level.collectors.forEach(function (c) {
    var body = new Body('collector', c);
    _bodies.push(body);
    _selectedLevel[body.index] = body;
  });
  return _selectedLevel;
}
function initStreams() {
  selectedLevel = Object.create(_selectedLevel);
  streams = [];
  _bodies.forEach(function (s) {
    if (s.type === 0) { s.status = 'ready';}
    if (s.status === 'ready') {
      s.generateStreams.call(s);
    }
  });
  propagateStreams();
}
function propagateStreams() {
  var total = streams.length;
  var t = 1;
  streams.forEach(function (stream) {
    if (stream.completed) {return t += 1;}
    stream.propagate.call(stream);
  });
  if (t < total) { return propagateStreams();}
}
function getIndex(row, column) {
  return row * columns + column;
}
function getRow(index) {
  return Math.floor(index/columns);
}
function getColumn(index) {
  return index % columns;
}

function shiftIndex(index, direction) {
  if (direction % 2 === 0) {
    return index + (columns * (direction === 0 ? -1 : 1));
  } else {
    return index + (direction === 1 ? 1 : -1 );
  }
}
function getIndexFromMouse (x, y) {
  var row = Math.floor(y / h);
  var col = Math.floor(x / w);
  return getIndex(row, col);
}

var selectedBody;

canvas.onmousedown = function (e) {
  var index = getIndexFromMouse(e.offsetX, e.offsetY);
  var cell = selectedLevel[index];
  if (cell) {
    selectedBody = cell;
  }
  console.log(cell || index);
};
canvas.onmousemove = function (e) {
  if (!selectedBody) { return; }
  var index = getIndexFromMouse(e.offsetX, e.offsetY);
  var cell = _selectedLevel[index];
  if (!cell) {
    if (selectedBody.type === 0 || selectedBody.type === 1 || selectedBody.type === 2) {
      selectedBody.move(index);
    }
  }
};
canvas.onmouseup = function (e) {
  if (!selectedBody) {return;}
  selectedBody = undefined;
};


var selectedLevel = loadLevel(levels[0]);

function drawLevel (cells) {
  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < columns; j++) {
      var cell = cells[getIndex(i, j)];
      ctx.beginPath();
      if (cell) {
        ctx.fillStyle = ELEMENT_FILL[cell.element] || 'white';
        if (cell.type === 0) {
          ctx.arc((j + 0.5) * w + 1, (i + 0.5) * h + 1, w/3, 0, 6.28, 0);
        } else if (cell.type === 4) {
          if (cell.direction % 2 === 1) {
            ctx.rect(j * w, (i + 0.5) * h, w, 3);
          } else {
            ctx.rect((j + 0.5) * w, i * h, 3, h);
          }

        }else {
          ctx.rect(j * w + 1, i * h + 1, w - 2, h - 2);
        }
      } else {
        ctx.fillStyle = '#111';
        ctx.rect(j * w + 1, i * h + 1, w - 2, h - 2);
      }
      ctx.closePath();
      ctx.fill();
      //ctx.fillRect(j * w + 1, i * h + 1, w - 2, h - 2);
    }
  }

}

raf.start(function (elapsed) {
  if (_dirty) {
    //console.log(streams);
    initStreams();
    _dirty = false;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawLevel(selectedLevel);
});

