// Variable Declarations {
var raf = require('./raf');

var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');
// Cell Width/Height
var w, h;
var _selectedLevel; // Level Config
var currentLevel; // Level Instance
var orientation; // Cube Orientation
var rows, columns, maxIndex;
var _dirty = true;
var currentFace = 0;
var bodies = [];
var streams = [];
var transfers = [];
var faces = {};

var ADJACENT_FACES = {
  0: [3,2,1,4],
  1: [0,2,5,4],
  2: [0,3,5,1],
  3: [0,4,5,4],
  4: [0,1,5,3],
  5: [3,4,1,2]
};

var BODY_TYPES = {
  source: 0,
  reflector: 1,
  collector: 2,
  stream: 3,
  collision: 4
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

// }
// Body {
// (BODY_TYPES, [element, face, row, column, direction])
var Body = function (type, config) {
  this.type = type;
  this.element = config[0];
  this.face = config[1];
  this.index = getIndex(config[2], config[3]);
  this.direction = config[4];


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
          var d = (this.direction % 2 === 0) ? 3 : 1;
          console.log(d);
          dir = (input.direction + d) % 4;
          var s = new Stream(this, e, dir);
          streams.push(s);
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
  collidesWith: function (stream) {
    stream.cull(this.index);
    stream.output = this;
    stream.completed = true;
    this.inputs.push(stream);
    this.generateStreams();

  },
  move: function (index) {

  },
  draw: function () {

  }
};
// }
// Stream {
var Stream = function (source, element, direction) {
  this.source = source;
  this.face = source.face;
  this.element = element;
  this.direction = direction;
  this.path = [];
  this.output = false;
  this.completed = false;
  this.current = shiftIndex(source.index, this.direction);
};

Stream.prototype = {
  propagate: function () {
    if (this.completed) {return;}
    this.path.push(this.current);
    var cells = faces[this.face].cells;
    var cell = cells[this.current];
    if (cell instanceof Stream) {
      cell.collidesWith(this, this.current);
    } else if (cell instanceof Body) {
      cell.collidesWith(this);
    } else {
      cells[this.current] = this;
    }
    if (!checkBoundaries(this.current, this.direction)) {
      this.completed = true;
      transfers.push(new Transfer());
    }
    this.current = shiftIndex(this.current, this.direction);

  },
  cull: function (index) {

  },
  collidesWith: function (stream) {

  }
};
// }
// Transfer {
var Transfer = function (faces, flanks, position, stream) {
  this.faces = faces;
  this.flanks = flanks;
  this.position = position;
  this.stream = stream;

};
// }
// Collision {
var Collision = function (index, s1, s2) {
  this.index = index;
  this.s1 = s1;
  this.s2 = s2;
};

Collision.prototype = {
  resolve: function () {

  }
};
// }
// Face {
var Face = function (id) {
  this.id = id;
  this.neighbors = ADJACENT_FACES[id];

  this.cells = {};
};
// }
// Game Loop {
function initStreams() {
  currentLevel = currentLevel || Object.create(_selectedLevel);
  bodies.forEach(function (b) {
    b.generateStreams();
  });
  propagateStreams();
}
function propagateStreams() {
  var total = streams.length;
  var t = 0;
  streams.forEach(function (stream) {
    if (stream.completed) {return t += 1;}
    stream.propagate();
  });
  if (t < total) {
    return propagateStreams();
  } else {
    checkVictoryConditions();
  }
}
function checkVictoryConditions() {

}

// }
// Level Management + Instantiation {
function loadLevel(level) {
  _selectedLevel = level;
  rows = level.rows;
  columns = level.columns;
  maxIndex = rows * columns;
  w = canvas.width / columns;
  h = canvas.height / rows;

  bodies = level.bodies.map(function (b) {
    return createBody.apply(null, b);
  });
  populateCube();
}
function populateCube() {
  streams = [];
  faces = createFaces(6);
  bodies.forEach(function (b) {
    faces[b.face].cells[b.index] = b;
  });
}
function createBody(type, element, face, row, column, direction) {
  return new Body(type, [element, face, row, column, direction]);
}
function createFaces(n) {
  var f = {};
  for (var i = 0; i < n; i++) {
    f[i] = new Face(i);
  }
  return f;
}
function checkBoundaries(index, direction) {
  if (index < 0 || index >= maxIndex) { return false; }
  var row = getRow(index);
  var col = getColumn(index);
  var inBounds = true;
  switch (direction) {
    case 0:
      if (row === 0) {inBounds = false;}
      break;
    case 1:
      if (col === columns - 1) {inBounds = false;}
      break;
    case 2:
      if (row === rows - 1) {inBounds = false;}
      break;
    case 3:
      if (col === 0) {inBounds = false;}
      break;
    default:
      console.error('invalid direction');
      break;
  }
  return inBounds;
}

// }
// Indexing Functions {
function getIndex(row, column, orientation) {
  if (orientation === undefined) {
    return (row * columns) + column;
  } else {
    var index;
    switch (orientation) {
      case 0:
        index = getIndex(row, column)
        break;
      case 1:
        index = getIndex(column, rows - row - 1)
        break;
      default:
        index = row * columns + column;
        break;

    }

  }
  return index;
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
  //console.log('row: ' + row + '; col: ' + col);
  return getIndex(row, col);
}
// }
// Drawing and Animation {
  // Draw Face {
function drawFace (face, orientation) {
  var cells = faces[face].cells;
  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < columns; j++) {
      var cell = cells[getIndex(i, j, orientation)];
      ctx.beginPath();
      if (cell) {
        ctx.fillStyle = ELEMENT_FILL[cell.element] || 'white';
        // Source Drawing
        if (cell.type === 0) {
          ctx.arc((j + 0.5) * w + 1, (i + 0.5) * h + 1, w/3, 0, 6.28, 0);

        }
        // Stream Drawing
        else if (cell instanceof Stream) {
          if (cell.direction % 2 === 1) {
            ctx.rect(j * w, (i + 0.5) * h, w, 3);
          } else {
            ctx.rect((j + 0.5) * w, i * h, 3, h);
          }
        }
        // Reflector Drawing
        else if (cell.type === 1) {
          ctx.save();
          ctx.beginPath();
          ctx.translate((j + 0.35) * w, (i - 0.15) * h);
          if (cell.direction % 2 === 0) {
            ctx.rotate((-Math.PI / 4) * 1);
            ctx.rect(0 - w/2, 0 + h/8, w/4, h);
          } else {
            ctx.rotate((Math.PI / 4) * 1);
            ctx.rect(0 + w/2, 0 - h/8, w/4, h);
          }
          ctx.closePath();
          ctx.restore();
          ctx.fill();
        }
        // Collision Drawing
        else if (cell instanceof Collision) {
          ctx.fillStyle = 'red';
          ctx.arc((j + 0.5) * w + 1, (i + 0.5) * h + 1, w/3, 0, 6.28, 0);
        }
        // Otherwise Drawing
        else {
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

  ctx.fillStyle = 'white';
  ctx.font = '20px Verdana';
  ctx.fillText(face, 20, 20);

}

  // }
function rotateCube(direction) {
  var next = faces[currentFace].neighbors[direction];
  currentFace = next;
}
function drawCube() {
  // TOP
  ctx.save();
  ctx.fillStyle = 'red';
  ctx.translate(250, 250);
  ctx.rotate(-Math.PI / 4);
  ctx.beginPath();
  ctx.rect(-50, -150, 200, 200);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

}
raf.start(function (elapsed) {
  if (_dirty) {
    initStreams();
    _dirty = false;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFace(currentFace);
  //drawCube();
});
// }
// User Input {
canvas.onmousedown = function (e) {
  var x = e.offsetX;
  var y = e.offsetY;
  if (x < 25) { rotateCube(3); }
  if (x > canvas.width - 25) { rotateCube(1); }
  if (y < 25) { rotateCube(0); }
  if (y > canvas.height - 25) { rotateCube(2); }
};
// }
var levels = [
  {
    rows: 7,
    columns: 7,
    bodies: [
      [0, 0, 0, 3, 3, 0],
      [1, 2, 0, 0, 3, 0],
    ]
  },
  {
    rows: 15,
    columns: 15,
    bodies: [
      [0, 0, 0, 7, 7, 0],
      [1, 0, 0, 3, 7, 0],
      [0, 1, 1, 7, 7, 1],
      [0, 2, 2, 7, 7, 2],
      [0, 3, 3, 7, 7, 3],
      [2, 0, 3, 10, 7, 0],
      [2, 3, 4, 7, 10, 0],
      [2, 3, 5, 3, 7, 0],
    ]
  }
];

loadLevel(levels[0]);
