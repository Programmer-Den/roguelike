Game.prototype.fillFieldWithWalls = function() {
  this.field = [];

  for (var y = 0; y < 24; y++) {
    this.field.push([]);

    for (var x = 0; x < 40; x++) {
      this.field[y].push('wall');
    }
  }
}
var game = new Game();

game.fillFieldWithWalls();

displayField();

function Game() {
  this.field   = [];
  this.rooms   = [];
  this.enemies = [];

  this.curRoomId = 0;
}

function Room(center, start, end) {
  this.center = center;
  this.start  = start; // слева сверху
  this.end	  = end;  //  справа снизу

  this.id = null;

  this.neighbors = [];
}

function displayField() {
  var fields = document.getElementsByClassName('field');

  for (var y = 0; y < 24; y++) {
    for (var x = 0; x < 40; x++) {
      var image = document.createElement('img');

      switch (game.field[y][x]) {
        case 'wall': image.className += 'wall';
        default:		 image.className += ' tile';
      }
      image.style.height = '20.48px';
      image.style.width  = '20.48px';
      image.style.left 	 = 20.48 * x + 'px';
      image.style.top 	 = 20.48 * y + 'px';

      fields[0].appendChild(image);
    }
  }
}
