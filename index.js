var rowsNumber = 24;
var columnsNum = 40;
var potionsNum = 10;
var enemiesNum = 10;
var swordsNum  = 2;
var wallMapRim = 1; // ободок из стены на крайних клетках карты

Game.prototype.fillFieldWithWalls = function() {
  this.field = []; // всё игровое поле, т. е. вся игровая карта

  for (var y = 0; y < rowsNumber; y++) {
    this.field.push([]);

    for (var x = 0; x < columnsNum; x++) {
      this.field[y].push('wall');
    }
  }
};

Game.prototype.carveRoomOrPassage = function(roomOrPass) {
  for (var y = roomOrPass.start.y; y <= roomOrPass.end.y; y++) {
    for (var x = roomOrPass.start.x; x <= roomOrPass.end.x; x++) {
      this.field[y][x] = 'tile';
    }
  }
};

function Game() {
  this.field   = [];
  this.rooms   = [];
  this.enemies = [];

  this.currentRoomId = 0;
}

function Passage() {
  this.start = { x: 0, y: 0 };
  this.end   = { x: 0, y: 0 };
}

function Room(center, start, end) {
  this.center = center;
  this.start  = start; // слева сверху
  this.end	  = end;  //  справа снизу

  this.id = null;

  this.neighbors = [];
}

function Player(health, damage, coords) {
  this.health = health;
  this.damage = damage;
  this.coords = coords;
}

Room.prototype.addNeighbor = function(room) {
  this.neighbors.push(room);
  room.neighbors.push(this);
};

Room.prototype.sharesCoordsWith = function(room, axis) {
  return room.end[axis] - this.start[axis] >= 1 &&
         this.end[axis] - room.start[axis] >= 1;
};

Room.prototype.overlapsOnAxis = function(axis, room) {  
  return (this.start[axis] - 1 <= room.end[axis] &&
          this.end[axis]   + 1 >= room.start[axis])
};

Room.prototype.overlaps = function(room) {
  return (this.overlapsOnAxis('x', room) &&
          this.overlapsOnAxis('y', room))
};

Room.prototype.placePassage = function(axis, room, passage) {
  var start = Math.max(this.start[axis], room.start[axis]);
  var end   = Math.min(this.end[axis], room.end[axis]);

  if (this.center[axis] >= start && this.center[axis] <= end) {
    passage.start[axis] = passage.end[axis] = this.center[axis];
  }

  return passage;
};

Room.prototype.addPassage = function(axis, room, passage) {
  passage.start[axis] = Math.min(this.end[axis], room.end[axis]);
  passage.end[axis] = Math.max(this.start[axis], room.start[axis]);

  passage = axis == 'y' ? this.placePassage('x', room, passage) :
                          this.placePassage('y', room, passage);

  game.carveRoomOrPassage(passage);

  this.addNeighbor(room);

  return passage
};

Room.prototype.generatePassage = function(room) {
  var passage = new Passage();
  
  passage = this.sharesCoordsWith(room, 'x') ?
            this.addPassage('y', room, passage) :
            this.addPassage('x', room, passage);
};

function generateSequentialRooms() {
  game.fillFieldWithWalls();

  baseRoom = addBaseRoom();

  var maxQuantityOfRooms = 17;

  while (game.rooms.length < 4) {
    for (var i = 0; i < maxQuantityOfRooms; i++) {
      var newRoom = addAdjacentRoom(baseRoom);
  
      if (!newRoom) continue;
  
      baseRoom.generatePassage(newRoom);
  
      baseRoom = newRoom;
    }
  }
  return true
}

function addBaseRoom() {
  var height = generateDimensions().height;
  var width  = generateDimensions().width;

  var genCenterCoord = function(maxCellsOfOneDimension, dim) {
    var limit = wallMapRim + Math.round(dim / 2);
    var range = maxCellsOfOneDimension - 4 * limit;

    return limit + Math.round(Math.random() * range);
  }

  var center = {
    x: genCenterCoord(columnsNum, width),
    y: genCenterCoord(rowsNumber, height)
  }

  var room = generateRoom(center, width, height);

  game.currentRoomId++;
  game.carveRoomOrPassage(room);
  game.rooms.push(room);

  return room;
}

function addAdjacentRoom(room) {
  var height = generateDimensions().height;
  var width  = generateDimensions().width;

  var gaugeDistanceBetweenRoomCenters = function(axis) {
    var passageLength = 1;
    var sizeOfOldRoom = room.end[axis] - room.start[axis] + 1;
    var sizeOfNewRoom = axis == 'y' ? height : width;

    return (
      Math.ceil(sizeOfOldRoom / 2) +
      Math.ceil(sizeOfNewRoom / 2) + passageLength
    )
  };

  var withinMapLimits = function(room) {
    return (
      room.start.y > wallMapRim &&
      room.start.x > wallMapRim &&
      room.end.y < rowsNumber - wallMapRim &&
      room.end.x < columnsNum - wallMapRim
    )
  };

  var returnRoomCenters = function() {
    return [
      {
        y: room.center.y - gaugeDistanceBetweenRoomCenters('y'),
        x: room.center.x
      }, 
      {
        y: room.center.y + gaugeDistanceBetweenRoomCenters('y'),
        x: room.center.x
      }, 
      { 
        y: room.center.y,
        x: room.center.x - gaugeDistanceBetweenRoomCenters('x')
      }, 
      { 
        y: room.center.y,
        x: room.center.x + gaugeDistanceBetweenRoomCenters('x')
      } 
    ]
  };

  var overlapsAny = function(room) {
    for (var gameRoomIndex = 0;
             gameRoomIndex < game.rooms.length;
             gameRoomIndex++)
    {
      if (room.overlaps(game.rooms[gameRoomIndex], 1) ) {
        return true;
      }
    }
    return false;
  };
  
  var viableRooms = [];

  for (var centerIndex = 0;
           centerIndex < returnRoomCenters().length;
           centerIndex++)
  {
    var roomCenter = returnRoomCenters()[centerIndex];
    var viableRoom = generateRoom(roomCenter, width, height);
    
    if (withinMapLimits(viableRoom) && !overlapsAny(viableRoom) ) {
       viableRooms.push(viableRoom);
    }
  }

  if (viableRooms.length > 0) {
    var index = Math.floor(Math.random() * viableRooms.length);
  
    var newRoom = viableRooms[index];
  
    game.currentRoomId++;
    game.carveRoomOrPassage(newRoom);
    game.rooms.push(newRoom);
    
    return newRoom;
  }
}

function setRoomCoords(center, width, height) {
  var halfW = Math.round(width / 2);
  var halfH = Math.round(height / 2);  
  var start = {
    x: center.x - halfW,
    y: center.y - halfH
  };
  var end = {
    x: center.x + halfW,
    y: center.y + halfH
  };
  return { start: start, end: end }
}

function generateRoom(center, width, height) {
  var start = setRoomCoords(center, width, height).start;
  var end   = setRoomCoords(center, width, height).end;

  var room = new Room(center, start, end);

  room.id = game.currentRoomId;

  return room;
}

function generateDimensions() {
  var height = 3;
  var width  = 5;

  var roomType = Math.random() < 0.5 ? 'tall' : 'wide';
  
  var extraRange = roomType == 'tall' ? 4.5 : 7.5;
  var additional = Math.round(Math.random() * extraRange);

  roomType == 'tall' ? height += additional : width += additional;
  
  return { height: height, width: width }
}

function displayField() {
  var fields = document.getElementsByClassName('field');

  for (var y = 0; y < 24; y++) {
    for (var x = 0; x < 40; x++) {
      var image = document.createElement('img');

      switch (game.field[y][x]) {
        case 'player': image.className += ' char';
        case 'wall':   image.className += ' wall';
        default:		   image.className += ' tile';
      }
  
      image.style.height = '20.48px';
      image.style.width  = '20.48px';
      image.style.left 	 = 20.48 * x + 'px';
      image.style.top 	 = 20.48 * y + 'px';

      fields[0].appendChild(image);
    }
  }
}

function findOutEmptyTile() {
  do {
    var y = Math.floor(Math.random() * rowsNumber);
    var x = Math.floor(Math.random() * columnsNum);
  }
  while (game.field[y][x] != 'tile');

  return { y: y, x: x }
}

function generatePlayerOnMap() {
  var emptyTile = findOutEmptyTile();

  addElementOntoMap(emptyTile, 'player');

  return new Player(100, 12.5, emptyTile);
}

function addElementOntoMap(coords, elementName) {
  game.field[coords.y][coords.x] = elementName;
}

var game = new Game();

var player = generateSequentialRooms() && generatePlayerOnMap();

displayField();
