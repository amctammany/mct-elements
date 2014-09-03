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
var $cubeContainer = document.getElementById('cube-container');
var $cube = document.getElementById('cube');
var $faces = {
  0: document.getElementById('cube-top'),
  1: document.getElementById('cube-front'),
  2: document.getElementById('cube-right'),
  3: document.getElementById('cube-back'),
  4: document.getElementById('cube-left'),
  5: document.getElementById('cube-bottom'),
};
for (var face in $faces) {
  var $f = $faces[face];
  $f.face = face;
  $f.onclick = function (e) {
    currentFace = this.face;
    _dirty = true;
  };
}
var FACE_ORIENTATIONS = {
  0: 0,
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0
};

var ADJACENT_FACES = {
  0: [3,2,1,4],
  1: [0,2,5,4],
  2: [0,3,5,1],
  3: [0,4,5,4],
  4: [0,1,5,3],
  5: [3,4,1,2]
};
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
      case 5: // Transfer
        streams.push(new Stream(this, this.element, this.direction));
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
    } else if (cell instanceof Transfer) {
      console.log('fail');
      //return;
    } else if (cell instanceof Body) {
      cell.collidesWith(this);
    } else {
      cells[this.current] = this;
    }
    var border = checkBoundaries(this.current, this.direction);
    if (border > -1) {
      this.completed = true;
      transfers.push(new Transfer(this, border));
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
var Transfer = function (stream, border) {
  this.f1 = faces[stream.face];
  this.i1 = stream.current;
  if (this.f1.cells[this.i1] instanceof Body) {
    return;
  }
  this.f1.cells[this.i1] = 'transfer';
  this.f2 = faces[this.f1.getNeighbors()[border]];
  if (!this.f2) {console.warn('fail?'); return;}
  console.log(this.f2);
  this.f2.setOrientationToFace(stream.face);
  this.i2 = reorientIndex(this.i1, this.f2.orientation);
  var row = getRow(this.i2);
  var col = getRow(this.i2);
  var body = new Body(BODY_TYPES['transfer'], [stream.element, this.f2.id, row, col, (ADJACENT_FACES[this.f1.id][border] + 2) % 4 ]);
  //body.generateStreams();
  this.f2.cells[this.i2] = body;

  //this.faces = faces;
  //this.flanks = flanks;
  //this.position = position;
  //this.stream = stream;

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
  this.orientation = 0;

  this.cells = {};
  //this.cells[0] = 'foo'
};
Face.prototype = {
  setOrientationToFace: function (face) {
    this.orientation = this.neighbors.indexOf(face);
  },
  getNeighbors: function () {
    var orienation = this.orientation;
    var head = this.neighbors.slice(0, orientation);
    var tail = this.neighbors.slice(orientation);
    return tail.concat(head);
  }
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
  var border = -1;
  switch (direction) {
    case 0:
      if (row === 0) {border = 0;}
      break;
    case 1:
      if (col === columns - 1) {border = 1;}
      break;
    case 2:
      if (row === rows - 1) {border = 2;}
      break;
    case 3:
      if (col === 0) {border = 3;}
      break;
    default:
      console.error('invalid direction');
      break;
  }
  return border;
}

// }
// Indexing Functions {
function getIndex(row, column, orientation) {
  if (orientation === undefined || orientation === 0) {
    return (row * columns) + column;
  } else if (orientation === 1) {
    return getIndex(columns - column - 1, row);
  } else if (orientation === 2) {
     return getIndex(rows - row - 1, columns - column - 1);
  } else if (orientation === 3) {
    return getIndex(column, rows - row - 1);
  }
}
function reorientIndex(index, orientation) {
  var row = getRow(index);
  var column = getColumn(index);
  return getIndex(row, column, orientation);
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
          if ((cell.direction + orientation) % 2 === 1) {
            ctx.rect(j * w, (i + 0.4) * h, w, h * 0.2);
          } else {
            ctx.rect((j + 0.4) * w, i * h, w * 0.2, h);
          }
        }
        // Reflector Drawing
        else if (cell.type === 1) {
          ctx.save();
          ctx.beginPath();
          ctx.translate((j + 0.35) * w, (i - 0.15) * h);
          if ((cell.direction + orientation) % 2 === 0) {
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
  ctx.font = '60px Verdana';
  ctx.fillText(face, canvas.width / 2, canvas.height / 2);

}

  // }
function rotateCube(direction) {
  var next = faces[currentFace].getNeighbors()[direction];
  currentFace = next;
}
function drawCube() {
  for (var face in $faces) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFace(face, FACE_ORIENTATIONS[face]);
    if (face === currentFace) {
      $faces[face].className = 'active';
    } else {
      $faces[face].className = '';
    }
    var dataURL = canvas.toDataURL();
    $faces[face].src = dataURL;
  }

}
raf.start(function (elapsed) {
  if (_dirty) {
    initStreams();
    _dirty = false;
    drawCube();
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFace(currentFace, 0);
});
// }
// User Input {
var $tl = document.getElementById('cube-arrow-tl');
var $tr = document.getElementById('cube-arrow-tr');
var $bl = document.getElementById('cube-arrow-bl');
var $br = document.getElementById('cube-arrow-br');
var _rX = 0, _rY = 0, _rZ = 0;

var transform = 'translateZ(-1200px) rotateX(-30deg) rotateY(40deg)';
var _aX = 0;
$cube.style.transform = transform;
$tl.onclick = function (e) {
  _rX = (_rX + 90);// % 360;
  _aX = (_aX+1) % 2;
  setCubeStyle();
};

$tr.onclick = function (e) {
  console.log(_aX);
  if(_aX === 0) {
    _rZ = (_rZ + 90);// % 360;
  } else if (_aX === 1) {
    _rX = _rX + 90;
  }
  setCubeStyle();
};
$bl.onclick = function (e) {
  if(_aX === 0) {
    _rZ = (_rZ - 90);// % 360;
  } else if (_aX === 1) {
    //_rZ = _rZ - 90;
  }
  setCubeStyle();
};
$br.onclick = function (e) {
  _rX = (_rX - 90);// % 360;
  _aX = (_aX+1) % 2;
  setCubeStyle();
};
function setCubeStyle() {
  $cube.style.transform = transform + 'rotateX('+_rX+'deg) rotateY('+_rY+'deg) rotateZ('+_rZ+'deg)';
}


// }
var levels = [
  {
    rows: 7,
    columns: 7,
    bodies: [
      [0, 0, 0, 3, 3, 0],
      [1, 2, 0, 0, 3, 0],
      [1, 2, 4, 3, 0, 0],
      [2, 0, 1, 3, 3, 0]
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
  },
  {
    rows: 5,
    columns: 5,
    bodies: [
      [0, 0, 0, 2, 2, 0],
      [2, 0, 0, 2, 2, 0],
      [2, 0, 1, 2, 2, 0],
      [2, 0, 2, 2, 2, 0],
      [2, 0, 3, 2, 2, 0],
      [2, 0, 4, 2, 2, 0],
      [2, 0, 5, 2, 2, 0],

    ]
  }
];

loadLevel(levels[2]);
