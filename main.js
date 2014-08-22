//var raf = require('./raf');
//var rng = require('./rng');

//var canvas = document.querySelector('#game');
//var ctx = canvas.getContext('2d');

//var rand = rng();

//var rows = 20,
    //cols = 20,
    //cells = [];

//var maxIndex = rows * cols;

//var elementFill = {
  //earth: 'brown',
  //air: 'lightgray',
  //fire: 'red',
  //water: 'blue',
//};
//function getIndex(row, col) {
  //return row * cols + col;
//}
//function shiftIndex(index, direction) {
  //if (direction % 2 === 0) {
    //return index + (cols * (direction === 0 ? -1 : 1));
  //} else {
    //return index + (direction === 1 ? 1 : -1 );
  //}

//}

//function getIndexFromMouse (x, y) {
  //var row = Math.floor(y / h);
  //var col = Math.floor(x / w);
  //return getIndex(row, col);
//}

//var selectedBody = undefined;

//canvas.onmousedown = function (e) {
  //var index = getIndexFromMouse(e.offsetX, e.offsetY);
  //var cell = cells[index];
  //if (cell) {
    //selectedBody = cell;
  //}
  //console.log(cell || index);
//};
//canvas.onmousemove = function (e) {
  //if (!selectedBody) { return; }
  //var index = getIndexFromMouse(e.offsetX, e.offsetY);
  //var cell = cells[index];
  //if (!cell) {
    //selectedBody.move(index);
  //}
//};
//canvas.onmouseup = function (e) {
  //if (!selectedBody) {return;}
  //selectedBody = undefined;
//};
//function getRow(index) {
  //return Math.floor(index/cols);
//}
//function getCol(index) {
  //return index % cols;
//}

//function getRowAndCol(index) {
  //var col = index % cols;
  //var row = Math.floor((index) / cols);
  //return {col: col, row: row};
//}


//var elements = ['air', 'earth', 'water', 'fire'];
//var elementMix = {
  //'air': {
    //'earth': 'earth',
    //'fire': 'fire',
    //'water': 'water',
    //'air': 'air',
  //},
  //'fire': {
    //'earth': 'earth',
    //'fire': 'fire',
    //'water': 'air',
    //'air': 'fire',
  //},
  //'earth': {
    //'earth': 'earth',
    //'fire': 'fire',
    //'water': 'water',
    //'air': 'air',
  //},
  //'water': {
    //'earth': 'earth',
    //'fire': 'air',
    //'water': 'water',
    //'air': 'water',
  //},
//};

//var w = canvas.width / cols;
//var h = canvas.height / rows;
////for (var i = 0; i < rows; i++) {
  ////for (var j = 0; j < cols; j++) {
    ////cells[getIndex(i, j)] = {
      ////element: rand.pick(elements),
      ////row: i,
      ////col: j
    ////};
  ////}
////}
////
//var Body = function (type, index, element, direction) {
  //this.type = type;
  //this.index = index;
  //this.element = element;
  //this.direction = direction;
  //cells[this.index] = this;
//};
//Body.prototype = {
  //move: function (i) {
    //cells[this.index] = undefined;
    //this.index = i;
    //cells[this.index] = this;
  //}
//}

//var Stream = function (source, element, direction) {
  //this.source = source;
  //this.type = 'stream';
  //this.element = element || source.element;
  //this.direction =  typeof direction === 'number' ? direction : source.direction;
  //this.current = this.source.index;
  //this.path = [source.index];
  //this.completed = false;
  //this.propagate();
//};
//Stream.prototype = {
  //propagate: function () {
    //if (this.completed) {return;}
    //var row = getRow(this.current);
    //var col = getCol(this.current);
    //if (row < 0 || row === rows || col === 0 || col === cols - 1) {
      //this.state = true;
      ////cells[this.current] = undefined;
      //return false;
    //} else {

      //this.current = shiftIndex(this.current, this.direction);
      //if (this.current > maxIndex) { return; }
      //var cell = cells[this.current];
      //if (cell && (cell instanceof Body || cell instanceof Stream)) {
        //this.completed = true;
        //console.log(cell);
        ////if (cell instanceof Stream) {
          ////cell.cull(this.current);
        ////}
        //new Collision(this.current, cell, this);
        //return false;
      //} else {
        //this.path.push(this.current);
        //cells[this.current] = this;
        ////console.log(cells);
        //return this.propagate();

      //}
    //}

  //},
  //cull: function (index) {
    //var i = this.path.indexOf(index);
    //if (i < 0) {return;}
    //var tail = this.path.slice(i);
    //tail.forEach(function (j) {cells[j] = undefined;});
    //this.path.splice(i, tail.length);
  //},
//};

//var Collision = function (index, s1, s2) {
  //if (!cells[index]) return;
  //this.index = index;
  //this.s1 = s1;
  //this.s2 = s2;
  //if (this.s1 instanceof Stream){
    //this.s1.cull(index);
  //}
  //if (this.s2 instanceof Stream){
    //this.s2.cull(index);
  //}

  //console.log(this);
  //this.generateStreams();
//};
//Collision.prototype = {
  //generateStreams: function () {
    //console.log(this.s1.element);
    //console.log(this.s2.element);
    //var e1 = elementMix[this.s1.element][this.s2.element];
    //var e2 = elementMix[this.s2.element][this.s1.element];
    //if (this.s1 instanceof Stream) var s1 = new Stream(this, e1, this.s1.direction);// + 2 % 4);
    //if (this.s2 instanceof Stream) var s2 = new Stream(this, e2, this.s2.direction);// + 2 % 4);

  //},
//};
//var reflector = new Body('reflector', getIndex(10, 6), 'fire', 1);
//var source = new Body('source', getIndex(3, 1), 'fire', 1);
//var source1 = new Body('source', getIndex(1, 6), 'water', 2);
//var source2 = new Body('source', getIndex(7, 2), 'fire', 1);
//var stream = new Stream(source);
//var stream1 = new Stream(source1);
//var stream2 = new Stream(source2);
//console.log(reflector.element);


//function drawLevel (cells) {
  //for (var i = 0; i < rows; i++) {
    //for (var j = 0; j < cols; j++) {
      //var cell = cells[getIndex(i, j)];
      //ctx.beginPath()
      //if (cell) {
        //ctx.fillStyle = elementFill[cell.element] || 'white';
        //if (cell.type === 'source') {
          //ctx.arc((j + 0.5) * w + 1, (i + 0.5) * h + 1, w/3, 0, 6.28, 0);
        //} else if (cell.type === 'stream') {
          //if (cell.direction % 2 === 1) {
            //ctx.rect(j * w, (i + 0.5) * h, w, 3);
          //} else {
            //ctx.rect((j + 0.5) * w, i * h, 3, h);
          //}

        //}else {
          //ctx.rect(j * w + 1, i * h + 1, w - 2, h - 2);
        //}
      //} else {
        //ctx.fillStyle = '#111';
        //ctx.rect(j * w + 1, i * h + 1, w - 2, h - 2);
      //}
      //ctx.closePath();
      //ctx.fill();
      ////ctx.fillRect(j * w + 1, i * h + 1, w - 2, h - 2);
    //}
  //}


//}

//raf.start(function (elapsed) {
  //ctx.clearRect(0, 0, canvas.width, canvas.height);
  //drawLevel(cells);
  ////cells.forEach(function (cell) {
    ////ctx.fillStyle = elementFill[cell.element];
    ////ctx.beginPath();
    ////ctx.rect(cell.col * w + 1, cell.row * h + 1, w - 2, h - 2);
    ////ctx.closePath();
    ////ctx.fill();
  ////})
//});

////var balls = [];
////var colors = [
  ////'#7FDBFF', '#0074D9', '#01FF70', '#001F3F', '#39CCCC',
  ////'#3D9970', '#2ECC40', '#FF4136', '#85144B', '#FF851B',
  ////'#B10DC9', '#FFDC00', '#F012BE',
////];

////for (var i = 0; i < 50; i++) {
  ////balls.push({
    ////x: rand.int(canvas.width),
    ////y: rand.int(canvas.height / 2),
    ////radius: rand.range(15, 35),
    ////dx: rand.range(-100, 100),
    ////dy: 0,
    ////color: rand.pick(colors)
  ////});
////}

////raf.start(function(elapsed) {
  ////// Clear the screen
  ////ctx.clearRect(0, 0, canvas.width, canvas.height);

  ////// Update each balls
  ////balls.forEach(function(ball) {
    ////// Gravity
    ////ball.dy += elapsed * 1500;

    ////// Handle collision against the canvas's edges
    ////if (ball.x - ball.radius < 0 && ball.dx < 0 || ball.x + ball.radius > canvas.width && ball.dx > 0) ball.dx = -ball.dx * 0.7;
    ////if (ball.y - ball.radius < 0 && ball.dy < 0 || ball.y + ball.radius > canvas.height && ball.dy > 0) ball.dy = -ball.dy * 0.7;

    ////// Update ball position
    ////ball.x += ball.dx * elapsed;
    ////ball.y += ball.dy * elapsed;

    ////// Render the ball
    ////ctx.beginPath();
    ////ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2, true);
    ////ctx.closePath();
    ////ctx.fillStyle = ball.color;
    ////ctx.fill();
  ////});
////});
