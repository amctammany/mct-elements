var raf = require('./raf');
// Variable Declarations {
var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

var $up = document.getElementById('direction-up');
var $right = document.getElementById('direction-right');
var $down = document.getElementById('direction-down');
var $left = document.getElementById('direction-left');

var _dirty = true; // Dirty Checking for Animation Loop
var _cube, _currentFace = 0; // Loaded Cube and displayed face
var OPPOSITE_FACES = {
  0: 5,
  1: 3,
  2: 4,
  3: 1,
  4: 2,
  5: 0,
};
var ADJACENT_FACES = {
  0: [3,2,1,4],
  1: [0,2,5,4],
  2: [0,3,5,1],
  3: [0,4,5,2],
  4: [0,1,5,3],
  5: [1,2,3,4]
};

var BODY_TYPES = {
  source: 0,
  reflector: 1,
  collector: 2,
  stream: 3,
  collision: 4,
  transfer: 5,
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
  0: 'white',
  1: 'blue',
  2: 'red',
  3: 'brown',
};

// }
// Helper Functions {
var getRow = function (index, size) {
  return Math.floor(index/size);
};
var getColumn = function (index, size) {
  return index % size;
};
// }
// Cube {
var Cube = function (config) {
  this.size = config.size;
  this.length = canvas.width;
  this.dL = this.length / this.size;
  this.streams = [];
  this.faces = new Array(6);
  for (var i = 0; i < 6; i++) {
    this.faces[i] = new Face(i, this.size);
    this.faces[i].cube = this;
  }
  this.currentFace = this.faces[0];
  this.bodies = this.loadBodies(config.bodies);
};
Cube.prototype = {
  loadBodies: function (bodies) {
    var cube = this;
    return bodies.map(function (body) {
      return new Body(cube, body);
    });
  },
  shiftDirection: function (direction) {
    var origin = (direction + 2) % 4;
    var face = this.getFace(this.currentFace.getNeighbors()[direction]);
    face.setOrientation(this.currentFace.id, origin);
    this.currentFace = face;

  },
  getFace: function (id) {
    return this.faces[id];
  },
  addStream: function (face, index, element, direction) {
    this.streams.push(new Stream(face, index, element, direction));
  },
  initStreams: function () {
    this.bodies.forEach(function (body) {
      body.generateStreams();
    });
    this.propagateStreams();
  },
  propagateStreams: function () {
    var total = this.streams.length;
    var t = 0;
    this.streams.forEach(function (stream) {
      if (stream.completed) { return t += 1;}
      stream.propagate();
    });
    if (t < total) {
      return this.propagateStreams();
    } else {
      return this.checkVictoryConditions();
    }
  },
  checkVictoryConditions: function () {

  },
  drawFace: function (ctx) {
    var face = this.currentFace;
    var orientation = face.orientation;
    var dL = this.dL;
    for (var row = 0; row < this.size; row++) {
      for (var column = 0; column < this.size; column++) {
        var cell = face.getCell(row, column, orientation);
        ctx.beginPath();
        if (cell) {
          if (cell instanceof Body) {

            ctx.fillStyle = ELEMENT_FILL[cell.element] || 'yellow';
            ctx.arc((column + 0.5) * dL + 1, (row + 0.5) * dL + 1, dL/3, 0, 6.28, 0);
          } else if (cell instanceof Stream) {
            ctx.fillStyle = ELEMENT_FILL[cell.element] || 'yellow';
            if (cell.direction % 2 === 1) {
              ctx.rect(column * dL, (row + 0.4) * dL, dL, dL * 0.2);
            } else {
              ctx.rect((column + 0.4) * dL, row * dL, dL * 0.2, dL);
            }
          }
        } else {
          ctx.fillStyle = '#111';
          ctx.rect(dL * column, dL * row, dL - 1, dL - 1);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.fillStyle = 'white';
    ctx.font = '60px Verdana';
    ctx.fillText(this.currentFace.id + ' - ' + this.currentFace.orientation, 20, 50);

  }

};
// }
// Face {
var Face = function (id, size) {
  this.id = id;
  this.size = size;
  this.cells = {};
  this.orientation = 0;
  this.neighbors = ADJACENT_FACES[id];
};

Face.prototype = {
  getCell: function (row, column, orientation) {
    var index = this.getIndex(row, column, orientation);
    return this.cells[index];
  },
  getNeighbors: function () {
    //return this.neighbors;
    var orientation = this.orientation;
    var head = this.neighbors.slice(0, orientation);
    var tail = this.neighbors.slice(orientation);
    return tail.concat(head);
  },
  setOrientation: function (face, origin) {
    var i = this.neighbors.indexOf(face);
    if (i < 0) {
      console.warn('What the fucK!');
    }
    var dI = i - origin;
    this.orientation = (4 + dI) % 4;

  },
  getIndex: function (row, column, orientation) {
    var size = this.size - 1;
    if (orientation === undefined || orientation === 0) {
      return (row * this.size) + column;
    } else if (orientation === 1) {
      return this.getIndex(column, size - row);

    } else if (orientation === 2) {
      return this.getIndex(size - row, size - column);

    } else if (orientation === 3) {
      return this.getIndex(size - column, row);

    } else {
      console.error('Invalid orientation: ' + orientation);
    }
  },
  shiftIndex: function (index, direction) {
    if (direction % 2 === 0) {
      return index + (this.size * (direction === 0 ? -1 : 1));
    } else {
      return index + (direction === 1 ? 1 : -1 );
    }

  },
  checkBoundaries: function (index, direction) {
    var row = getRow(index, this.size);
    var column = getColumn(index, this.size);
    var border = -1;
    var size = this.size;
    switch (direction) {
      case 0:
        if (row === 0) {border = 0;}
        break;
      case 1:
        if (column === size - 1) {border = 1;}
        break;
      case 2:
        if (row === size - 1) {border = 2;}
        break;
      case 3:
        if (column === 0) {border = 3;}
        break;
      default:
        console.error('invalid direction');
        break;
    }
    return border;
  },
  getEdgePosition: function (index, border) {
    var row = getRow(index, this.size);
    var column = getColumn(index, this.size);
    var position = (border % 2) === 0 ? column : row;
    return position;
  },
  checkBorders: function (stream) {
    var index = stream.current;
    var border = this.checkBoundaries(index, stream.direction);
    if (border > -1) {
      var element = stream.element;
      var face = this.cube.getFace(this.getNeighbors()[border]);
      var position = this.getEdgePosition(index, border);
      face.transferStream(element, this.id, position);
      return 'foobar';

    } else {
      return false;
    }
  },
  transferStream: function (element, face, position) {
    var row, column;
    var border = this.neighbors.indexOf(face);
    switch (border) {
      case 0:
        row = 0;
        column = position;
        break;
      case 1:
        row = position;
        column = this.size - 1;
        break;
      case 2:
        row = this.size - 1;
        column = position;
        break;
      case 3:
        row = position;
        column = 0;
        break;
    }
    var index = this.getIndex(row, column, 0)
    this.cells[index] = 'foo';
    console.log('transfer stream at ' + index);
    return this.getIndex(row, column);

  },
};

// }
// Body {
var Body = function (cube, config) {
  this.cube = cube;
  this.type = config[0];
  this.element = config[1];
  this.face = cube.faces[config[2]];
  this.index = config[3];
  this.direction = config[4];
  this.inputs = [];
  this.outputs = [];

  this.face.cells[this.index] = this;
};

Body.prototype = {
  generateStreams: function () {
    var cube = this.cube;
    switch (this.type) {
      case 0: // Source
        cube.addStream(this.face, this.index, this.element, this.direction);
        //this.status = true;
        break;
      case 1: // Reflector
        break;
      case 2: // Collector
        break;
    }
  },
  collidesWith: function (stream) {
    console.log('stream body collision');
  },
};
// }
// Stream {
var Stream = function (face, index, element, direction) {
  this.face = face;
  this.element = element;
  this.direction = direction;
  this.path = [index];
  this.completed = false;
  this.current = this.face.shiftIndex(index, direction);
};

Stream.prototype = {
  propagate: function () {
    if (this.completed) { return; }
    this.path.push(this.current);
    var cell = this.face.cells[this.current];
    if (cell instanceof Stream) {
      cell.collidesWith(this, this.current);
    } else if (cell instanceof Body) {
      cell.collidesWith(this);
    } else {
      this.face.cells[this.current] = this;
    }
    if (this.face.checkBorders(this)) {
      this.completed = true;
    } else {
      this.current = this.face.shiftIndex(this.current, this.direction);
    }
    //this.completed = true;

  },
  collidesWith: function (stream, index) {
    console.log('stream collision');
  },
};
// }
// Edge Transfer {
var Transfer = function (stream, border) {
  this.face = _cube.getFace(stream.face.getNeighbors()[border]);
  this.face.cells[4] = stream;

}
// }
// Level Definitions {
var levels = [
  {
    size: 10,
    bodies: [
      [0, 0, 0, 44, 0],
      [0, 1, 0, 46, 1],
      [0, 2, 0, 66, 2],
      [0, 3, 0, 64, 3],
    ],
  },
  {
    size: 5,
    bodies: [
      [0, 0, 1, 12, 0],
      [0, 0, 2, 12, 0],
      [0, 0, 3, 12, 0],
      [0, 0, 4, 12, 0],
    ]
  }
];
// }
// Animation Loop {
_cube = new Cube(levels[1]);
raf.start(function (elapsed) {
  if (_dirty) {
    _cube.initStreams();
    _dirty = false;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  _cube.drawFace(ctx);
});
// }
// User Input {
$up.onclick = function () {
  _cube.shiftDirection(0);
  resetUI();
  //_dirty = true;
};
$right.onclick = function () {
  _cube.shiftDirection(1);
  resetUI();
  //_dirty = true;
};
$down.onclick = function () {
  _cube.shiftDirection(2);
  resetUI();
  //_dirty = true;
};
$left.onclick = function () {
  _cube.shiftDirection(3);
  resetUI();
  //_dirty = true;
};
function resetUI () {
  var neighbors = _cube.currentFace.getNeighbors();
  $up.innerHTML = neighbors[0];
  $right.innerHTML = neighbors[1];
  $down.innerHTML = neighbors[2];
  $left.innerHTML = neighbors[3];
}
resetUI();
// }
