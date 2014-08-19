var raf = require('./raf');
var rng = require('./rng');

var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

var rand = rng();

var rows = 10,
    cols = 10,
    cells = [];

var maxIndex = rows * cols;

var elementFill = {
  earth: 'brown',
  air: 'lightgray',
  fire: 'red',
  water: 'blue',
};
function getIndex(row, col) {
  return row * cols + col;
}
function shiftIndex(index, direction) {
  if (direction % 2 === 0) {
    return index + (cols * (direction === 0 ? -1 : 1));
  } else {
    return index + (direction === 1 ? 1 : -1 );
  }

}

function getIndexFromMouse (x, y) {
  var row = Math.floor(y / h);
  var col = Math.floor(x / w);
  return getIndex(row, col);
}

canvas.onmousedown = function (e) {
  var index = getIndexFromMouse(e.offsetX, e.offsetY);
  console.log(cells[index]);
};
function getRow(index) {
  return Math.floor(index/cols);
}
function getCol(index) {
  return index % cols;
}

function getRowAndCol(index) {
  var col = index % cols;
  var row = Math.floor((index) / cols);
  return {col: col, row: row};
}


var elements = ['air', 'earth', 'water', 'fire'];
var elementMix = {
  'air': {
    'earth': 'air',
    'fire': 'fire',
    'water': 'water',
    'air': 'air',
  },
  'fire': {
    'earth': 'earth',
    'fire': 'fire',
    'water': 'air',
    'air': 'fire',
  },
  'earth': {
    'earth': 'earth',
    'fire': 'fire',
    'water': 'air',
    'air': 'fire',
  },
  'water': {
    'earth': 'earth',
    'fire': 'fire',
    'water': 'air',
    'air': 'fire',
  },
};

var w = canvas.width / cols;
var h = canvas.height / rows;
//for (var i = 0; i < rows; i++) {
  //for (var j = 0; j < cols; j++) {
    //cells[getIndex(i, j)] = {
      //element: rand.pick(elements),
      //row: i,
      //col: j
    //};
  //}
//}
//
var Body = function (type, index, element, direction) {
  this.type = type;
  this.index = index;
  this.element = element;
  this.direction = direction;
  cells[this.index] = this;
};

var Stream = function (source, element, direction) {
  this.source = source;
  this.element = element || source.element;
  console.log(typeof direction)
  this.direction =  typeof direction === 'number' ? direction : source.direction;
  console.log(this.direction);
  this.current = this.source.index;
  this.path = [source.index];
  this.state = false;
  this.propagate();
};
Stream.prototype = {
  propagate: function () {
    if (this.state) {return;}
    var row = getRow(this.current);
    var col = getCol(this.current);
    if (row < 0 || row === rows || col === 0 || col === cols - 0) {
      this.state = true;
      cells[this.current] = undefined;
      console.log('out of bounds')
      return false;
    } else {

      this.path.push(this.current);
      this.current = shiftIndex(this.current, this.direction);
      var cell = cells[this.current];
      if (cell) {
        this.state = true;
        if (cell instanceof Stream) {
          cell.cull(this.current);
        }
        console.log('collision at ' + this.current);
        cells[this.current] = new Collision(this.current, cell, this);
        return;
      }
      cells[this.current] = this;
      //console.log(cells);
      return this.propagate();
    }

  },
  cull: function (index) {
    var i = this.path.indexOf(index);
    var tail = this.path.slice(i);
    tail.forEach(function (j) {cells[j] = undefined;});
    console.log(tail);
    this.path.splice(i, tail.length);
    console.log(this.path);
  },
};

var Collision = function (index, s1, s2) {
  this.index = index;
  this.s1 = s1;
  this.s2 = s2;
  console.log(this);
  this.generateStreams();
};
Collision.prototype = {
  generateStreams: function () {
    var element = elementMix[this.s1.element][this.s2.element];
    console.log(element);
    var s1 = new Stream(this, element, this.s1.direction);// + 2 % 4);
    var s2 = new Stream(this, element, this.s2.direction);// + 2 % 4);
    console.log(s1);

  },
};
var cannon = new Body('cannon', getIndex(3, 1), 'fire', 1);
var stream = new Stream(cannon)
var cannon1 = new Body('cannon', getIndex(5, 6), 'water', 0);
var stream1 = new Stream(cannon1)

function drawLevel (cells) {
  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < cols; j++) {
      var cell = cells[getIndex(i, j)];
      ctx.beginPath()
      if (cell) {
        ctx.fillStyle = elementFill[cell.element] || 'white';
        if (cell.type === 'cannon') {
          ctx.arc((j + 0.5) * w + 1, (i + 0.5) * h + 1, w/3, 0, 6.28, 0);
        } else {
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawLevel(cells);
  //cells.forEach(function (cell) {
    //ctx.fillStyle = elementFill[cell.element];
    //ctx.beginPath();
    //ctx.rect(cell.col * w + 1, cell.row * h + 1, w - 2, h - 2);
    //ctx.closePath();
    //ctx.fill();
  //})
});

//var balls = [];
//var colors = [
  //'#7FDBFF', '#0074D9', '#01FF70', '#001F3F', '#39CCCC',
  //'#3D9970', '#2ECC40', '#FF4136', '#85144B', '#FF851B',
  //'#B10DC9', '#FFDC00', '#F012BE',
//];

//for (var i = 0; i < 50; i++) {
  //balls.push({
    //x: rand.int(canvas.width),
    //y: rand.int(canvas.height / 2),
    //radius: rand.range(15, 35),
    //dx: rand.range(-100, 100),
    //dy: 0,
    //color: rand.pick(colors)
  //});
//}

//raf.start(function(elapsed) {
  //// Clear the screen
  //ctx.clearRect(0, 0, canvas.width, canvas.height);

  //// Update each balls
  //balls.forEach(function(ball) {
    //// Gravity
    //ball.dy += elapsed * 1500;

    //// Handle collision against the canvas's edges
    //if (ball.x - ball.radius < 0 && ball.dx < 0 || ball.x + ball.radius > canvas.width && ball.dx > 0) ball.dx = -ball.dx * 0.7;
    //if (ball.y - ball.radius < 0 && ball.dy < 0 || ball.y + ball.radius > canvas.height && ball.dy > 0) ball.dy = -ball.dy * 0.7;

    //// Update ball position
    //ball.x += ball.dx * elapsed;
    //ball.y += ball.dy * elapsed;

    //// Render the ball
    //ctx.beginPath();
    //ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2, true);
    //ctx.closePath();
    //ctx.fillStyle = ball.color;
    //ctx.fill();
  //});
//});
