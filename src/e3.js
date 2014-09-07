var raf = require('./raf');
// Variable Declarations {
var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

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
// Cube {
var Cube = function (config) {
  this.size = config.size;
  this.length = canvas.width;
  this.dL = this.length / this.size;
  this.streams = [];
  this.faces = new Array(6);
  for (var i = 0; i < 6; i++) {
    this.faces[i] = new Face(i, this.size);
  }
  this.bodies = this.loadBodies(config.bodies);
};
Cube.prototype = {
  loadBodies: function (bodies) {
    var cube = this;
    return bodies.map(function (body) {
      return new Body(cube, body);
    });
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
  drawFace: function (ctx, f, orientation) {
    var face = this.faces[f];
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

  }

};
// }
// Face {
var Face = function (id, size) {
  this.id = id;
  this.size = size;
  this.cells = {};
};

Face.prototype = {
  getCell: function (row, column, orientation) {
    var index = this.getIndex(row, column, orientation);
    return this.cells[index];
  },
  getIndex: function (row, column, orientation) {
    var size = this.size;
    if (orientation === undefined || orientation === 0) {
      return (row * size) + column;
    } else if (orientation === 0) {

    } else if (orientation === 2) {

    } else if (orientation === 3) {

    } else {
      console.error('Invalid orientation');
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
    var row = Math.floor(index / this.size);
    var column = index % this.size;
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
  }
}
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
    var border = this.face.checkBoundaries(this.current, this.direction);
    if (border > -1) {
      this.completed = true;
    }
    this.current = this.face.shiftIndex(this.current, this.direction);
    //this.completed = true;

  },
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
];
// }
// Animation Loop {
raf.start(function (elapsed) {
  if (_dirty) {
    _cube.initStreams();
    _dirty = false;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  _cube.drawFace(ctx, _currentFace)
})
// }
_cube = new Cube(levels[0]);
