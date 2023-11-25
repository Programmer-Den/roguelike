function returnCoordinatesAroundEnemyOrPlayer(subject) {
  return [
    {y: subject.coords.y - 1, x: subject.coords.x},     // север
    {y: subject.coords.y - 1, x: subject.coords.x + 1}, // СВ
    {y: subject.coords.y,     x: subject.coords.x + 1}, // восток
    {y: subject.coords.y + 1, x: subject.coords.x + 1}, // ЮВ
    {y: subject.coords.y + 1, x: subject.coords.x},     // юг
    {y: subject.coords.y + 1, x: subject.coords.x - 1}, // ЮЗ
    {y: subject.coords.y,     x: subject.coords.x - 1}, // запад
    {y: subject.coords.y - 1, x: subject.coords.x - 1}  // СЗ
  ]
}

var rowsNumber = 24;
var columnsNum = 40;
var potionsNum = 10;
var enemiesNum = 10;
var swordsNum  = 2;
var wallMapRim = 3; // ободок из стены на крайних клетках карты

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
  } // когда тут элемент 'tile', соответствующая клетка свободна
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
function Player(coords, health, damage) {
  this.coords = coords;
  this.health = health;
  this.damage = damage;
}
function Enemy(coords, health, damage) {
  this.coords = coords;
  this.health = health;
  this.damage = damage;
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

  var maxQuantityOfRooms = 10;

  while (game.rooms.length < 5) {
    for (var i = 0; i < maxQuantityOfRooms; i++) {
      var newRoom = addAdjacentRoom(baseRoom);
  
      if (!newRoom) continue;
  
      baseRoom.generatePassage(newRoom);
  
      baseRoom = newRoom;
    }
  }
}
function addBaseRoom() {
  var height = generateDimensions().height;
  var width  = generateDimensions().width;

  var genCenterCoord = function(maxCellsOfOneDimension, dim) {
    var limit = wallMapRim + Math.round(dim / 2);
    var range = maxCellsOfOneDimension - wallMapRim * limit;

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
    
    viableRooms.splice(0, viableRooms.length);

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
  var extraRange = roomType == 'tall' ? height : width;
  var additional = Math.round(Math.random() * extraRange);

  roomType == 'tall' ? height += additional : width += additional;
  
  return { height: height, width: width }
}

function displayField() {
  var fields = document.getElementsByClassName('field');

  var removeOldEl = function(finalPartOfElementId) {
    var existingElement = document.getElementById(
      y.toString() + x.toString() + finalPartOfElementId
    );
    if (existingElement) existingElement.remove();
  };

  for (var y = 0; y < 24; y++) {
    for (var x = 0; x < 40; x++) {
      removeOldEl('image');
      removeOldEl('playerBar');
      removeOldEl('ememyBar');
      
      if (game.field[y][x] == 'enemy') {
        var healthBar = document.createElement('meter');

        fields[0].appendChild(healthBar);

        healthBar.id = y.toString() + x.toString() + 'enemyBar';

        healthBar.value = game.enemies.find(
          function(obj) {
            return obj.coords.y == y && obj.coords.x == x
          }
        ).health;
        
        healthBar.max = 100;
        healthBar.min = 1;
        healthBar.low = 50.75;
        healthBar.high = 75.25;

        healthBar.style.height = '9.84px';
        healthBar.style.zIndex = 5;
        healthBar.style.backgroundColor = 'red';
      }

      else if (game.field[y][x] == 'player') {
        var healthBar = document.createElement('progress');
              
        fields[0].appendChild(healthBar);

        healthBar.id = y.toString() + x.toString() + 'playerBar';
        healthBar.value = player.health;
        healthBar.max = 100; // это для отображения, а так можно >

        healthBar.style.height = '13.28px';
        healthBar.style.zIndex = 11;
      }

      if (game.field[y][x] == 'player' ||
          game.field[y][x] == 'enemy')
      {
        styleHealthBar(healthBar,
          '20.48px', 20.48 * x + 'px', 20.48 * y - 7 + 'px'
        )
      }
      function styleHealthBar(healthBar, width, left, top) {
        healthBar.style.width  = width;
        healthBar.style.left   = left;
        healthBar.style.top    = top;
      }

      var image = document.createElement('img');
    
      fields[0].appendChild(image);

      image.classList.add('tile');

      image.id = y.toString() + x.toString() + 'image';

      image.style.height = '20.48px';
      image.style.width  = '20.48px';
      image.style.left 	 =  20.48 * x + 'px';
      image.style.top 	 =  20.48 * y + 'px';

      switch (game.field[y][x]) {
        case 'wall':   image.classList.add('wall');  break;
        case 'player': image.classList.add('char');  break;
        case 'enemy':  image.classList.add('enemy'); break;
        case 'sword':  image.classList.add('sword'); break;
        case 'potion': image.classList.add('HP')
      }
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

function generateMapElement(elementName) {
  var emptyTile = findOutEmptyTile();

  addElementOntoMap(emptyTile, elementName);

  switch (elementName) {
    case 'player': return new Player(emptyTile, 100, 12.5);
    case 'enemy':  return new Enemy (emptyTile, 100, 12.5)
  }
}

function addElementOntoMap(coords, elementName) {
  game.field[coords.y][coords.x] = elementName;
}

function generateEnemies(enemiesQuantity) {
  var enemy = generateMapElement('enemy');

  if (game.enemies.push(enemy) === enemiesQuantity) return;

  return generateEnemies(enemiesQuantity);
}

function generateLotOfEl(elementsQuantity, elementName) {
  for (var i = 0; i < elementsQuantity; i++) {
    generateMapElement(elementName);
  }
}

var game = new Game();

generateSequentialRooms();

var player = generateMapElement('player');

generateEnemies(enemiesNum);
generateLotOfEl(potionsNum, 'potion');
generateLotOfEl(swordsNum, 'sword');

displayField();

document.addEventListener('keydown', function(event) {
  var y = player.coords.y;
  var x = player.coords.x;

  if (player.health > 0) {
    switch (event.code) {
      case 'KeyW': move(--y, x); break;
      case 'KeyA': move(y, --x); break;
      case 'KeyS': move(++y, x); break;
      case 'KeyD': move(y, ++x); break;

      case 'Space': attack([
        {y: y - 1, x: x},     {y: y - 1, x: x + 1}, // север,  СВ
        {y: y,     x: x + 1}, {y: y + 1, x: x + 1}, // восток, ЮВ
        {y: y + 1, x: x},     {y: y + 1, x: x - 1}, // юг,     ЮЗ
        {y: y,     x: x - 1}, {y: y - 1, x: x - 1}  // запад,  СЗ
      ],
        'player' // название производящего атаку действующего лица
      );
      break;  default: return
    }  
  }
  displayField();

  function move(newY, newX) {
    if (game.field[newY][newX] != 'wall' &&
        game.field[newY][newX] != 'enemy')
    {
      updateSubjectPosition(newY, newX, player, 'player');
    }
  } // move выше — функция передвижения игрока, ниже — противника
});
function move(newY, newX, enemy) {
  if (game.field[newY][newX] == 'tile') {
    updateSubjectPosition(newY, newX, enemy, 'enemy');
  }
}
var moving = setInterval(function() { // интервал движения врагов
  outer:
  for (var i = 0; i < game.enemies.length; i++) {
    var enemy = game.enemies[i];

    for (var j = 0;
             j < returnCoordinatesAroundEnemyOrPlayer(enemy);
             j++)
    {
      var y = coordinatesAroundEnemy[j].y;
      var x = coordinatesAroundEnemy[j].x;

      if (y == player.coords.y && x == player.coords.x) {
        move(enemy.coords.y, enemy.coords.x, enemy);
        
        continue outer
      }
    }
    var y = enemy.coords.y;
    var x = enemy.coords.x;

    if (!(direction in enemy) ) {
      var direction = Math.random() > 0.5 ? true : false;

      enemy.direction = direction;      //  ↑ ↓  :  ← →
    }
                       // по вертикали; сначала вверх, затем вниз
    if (enemy.direction === true) {
      if (game.field[y - 1][x] == 'tile') {
        updateSubjectPosition(y - 1, x, enemy, 'enemy')
      }
      else if (game.field[y - 1][x] == 'player') continue;
      else {
        enemy.direction = !enemy.direction;

        move(y + 1, x, enemy);
      }
    }      // по горизонтали; сначала влево, затем вправо
    else {
      if (game.field[y][x - 1] == 'tile') {
        updateSubjectPosition(y, x - 1, enemy, 'enemy')
      }
      else if (game.field[y][x - 1] == 'player') continue;
      else {
        enemy.direction = !enemy.direction;
        
        move(y, x + 1, enemy);
      }
    }
  }
}, 1000);

var attacking = setInterval(function() { // интервал атаки врагом
  attack(returnCoordinatesAroundEnemyOrPlayer(player), 'enemy');

  displayField();
}, 500); // каждые полсекунды атака противником, когда прям подле

function attack(coordinatesAroundHero, attackingSubjectName) {
  for (var i = 0; i < coordinatesAroundHero.length; i++) {
    for (var j = 0; j < game.enemies.length; j++) {
      var y = coordinatesAroundHero[i].y;
      var x = coordinatesAroundHero[i].x;

      if (y == game.enemies[j].coords.y &&
          x == game.enemies[j].coords.x)
      {
        if (attackingSubjectName == 'player') {
          game.enemies[j].health -= player.damage

          if (game.enemies[j].health <= 0) {          
            displayField();

            removeSubjectFromMap(y, x);

            game.enemies.splice(j, 1);

            setTimeout(function() {
              if (game.enemies.length === 0) {
                alert('Враг повержен, ура!');

                location.reload() // обновляет страницу с картой
              }
            }, 500)
          }
        }
        else {
          player.health -= game.enemies[j].damage;

          displayField();

          if (player.health <= 0) {          
            removeSubjectFromMap(player.coords.y, player.coords.x);

            clearInterval(attacking);

            setTimeout(function() {
              alert('Вы полегли доблестно...')

              location.reload() // обновляет страницу с картой
            }, 500)
          }
        }
      }
    }
  }
}
function removeSubjectFromMap(y, x) { game.field[y][x] = 'tile' }

function updateSubjectPosition(newY, newX, subject, subjectStr) {
  removeSubjectFromMap(subject.coords.y, subject.coords.x);

  subject.coords.y = newY;
  subject.coords.x = newX;

  if (subject == player) realizeConsequencesOfHeroStep();

  game.field[subject.coords.y][subject.coords.x] = subjectStr;

  displayField();
}

function realizeConsequencesOfHeroStep() {
  switch (game.field[player.coords.y][player.coords.x]) {
    case 'potion': player.health += 25;  break;
    case 'sword':  player.damage *= 2; // без — 12.5, c ⚔ — 25—50
  }
}
