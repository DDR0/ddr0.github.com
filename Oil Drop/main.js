/*global createjs console _ $ iScore iMoney iTiles iCities iMatch*/// Thought we'd give jslint a try. What an annoying, useful program.
//Chromium: Run with --allow-file-access-from-files. Apparently it'll be fine in production.
mainWindowFunction = function() {
	"use strict";
	
	//This does not play a sound, unfortunantly, nor does it cause any errors.
	console.log(createjs.SoundJS.play("sounds/stream-waterfall_0.ogg", createjs.SoundJS.INTERRUPT_NONE, 0, 400, -1));
	
	//CONFIG
	var watched = {
		score: typeof iScore !== 'undefined' && iScore || 0,
		money: typeof iMoney !== 'undefined' && iMoney || 150,
		gameOver: false,
		won: false
	};
	
	var destructionCost = 1;
	
	var numTileTypes = typeof iTiles !== 'undefined' && iTiles || 3;
	var number_of_cities = typeof iCities !== 'undefined' && iCities || 3;
	var enableOilTanks = true;
	var overlayLayout = ['horisontal','vertical'][0];
	
	var minimumTileMatchCount = typeof iMatch !== 'undefined' && iMatch || 2;
	
	var victoryCallbacks = [];
	
	//SETUP
	var canvas = document.getElementById('main');
	var stage = new createjs.Stage(canvas); //Sadly, we have to expose this to kill it later.
	stage.snapToPixel = true;
	stage.enableMouseOver();
	
	var Width = canvas.width;                 var Height = canvas.height;
	var tileWidth = 32;                       var tileHeight = 32;
	var xTiles = Math.floor(Width/tileWidth); var yTiles = Math.floor(Height/tileHeight);
	
	var mouseX = 0; var mouseY = 0;
	
	//The 'tile' object exists to make coordinating an object less of a chore.
	//var tileClickEvent = false;
	var getNewTile = function(){
		var tilePrototype = new createjs.Bitmap("images/tile-base.png");
		var lemon = new createjs.Bitmap("images/cc-by-sa/ails english/I_C_Lemon.png");
		var cherry = new createjs.Bitmap("images/cc-by-sa/ails english/I_C_Cherry.png");
		var grapes = new createjs.Bitmap("images/cc-by-sa/ails english/I_C_Grapes.png");
		var pepper = new createjs.Bitmap("images/cc-by-sa/ails english/I_C_Watermellon.png");
		var radish = new createjs.Bitmap("images/cc-by-sa/ails english/I_C_Radish.png");
		
		var pipes = {
			'pipe-24': new createjs.Bitmap("images/pipe-24.png"),
			'pipe-26': new createjs.Bitmap("images/pipe-26.png"), //The keys didn't use to match up with the file-names. Let's leave this in here so that we can change the filenames easily if we need to.
			'pipe-48': new createjs.Bitmap("images/pipe-48.png"),
			'pipe-68': new createjs.Bitmap("images/pipe-68.png"),
			'pipe-246': new createjs.Bitmap("images/pipe-246.png"),
			'pipe-248': new createjs.Bitmap("images/pipe-248.png"),
			'pipe-268': new createjs.Bitmap("images/pipe-268.png"),
			'pipe-468': new createjs.Bitmap("images/pipe-468.png"),
			'pipe-28': new createjs.Bitmap("images/pipe-28.png"),
			'pipe-46': new createjs.Bitmap("images/pipe-46.png"),
			'pipe-2468': new createjs.Bitmap("images/pipe-2468.png"),
		};
		var pipeCodes = {
			'pipe-24': [2,4],
			'pipe-26': [2,6], //This is not the best way to do this. It is, however, the fastest -- considering I'd have to look up a bit of string-parsing the 'better' way.
			'pipe-48': [4,8],
			'pipe-68': [6,8],
			'pipe-246': [2,4,6],
			'pipe-248': [2,4,8],
			'pipe-268': [2,6,8],
			'pipe-468': [4,6,8],
			'pipe-28': [2,8],
			'pipe-46': [4,6],
			'pipe-2468': [2,4,6,8],
		};
		/*
		var overlays = {
			'city': new createjs.Bitmap("images/city.png"),
			'tank': new createjs.Bitmap("images/storage-0.png"),
		};
		*/
		//TODO: tilePrototype's image may not have loaded from disk yet. Make sure they have.
		//Perhaps something to do with pausing the event loop before the first 'cycle' could work?
		
		var int = 0.75;
		var red = new createjs.ColorFilter(1,int,int,1);
		var blue = new createjs.ColorFilter(int,int,1,1);
		var green = new createjs.ColorFilter(int,1,int,1);
		var yellow = new createjs.ColorFilter(1,1,int,1);
		var pink = new createjs.ColorFilter(1,(int/2+2)/3,(int/2+2)/3,1);
		
		//We'll be returning a composite type, here. It'll 'union' the layers together, and with map() the tiles should never 'fall apart'.
		//I'd prefer to have it so that when you set a property, the property was instead set in all children, and read from the 'base' tile only. However, my javascript-fu is weak, and I don't know how to do this well enough to make it work with easel.js. We will just go with mapping over the list of children (bits) for now.
		return function(type, pipe, row, column, index) { //x/y/z, z optional.
			var tileBackground = tilePrototype.clone();
			tileBackground.cache(0, 0, tileBackground.image.width || tileWidth, tileBackground.image.height || tileHeight); //TODO: Once the previous todo is fixed, remove the check against tileWidth/height.
			var tileIcon;
			switch(type) {
			case "lemon":
				tileIcon = lemon.clone();
				tileBackground.filters = [yellow];
				break;
			case "cherry":
				tileIcon = cherry.clone();
				tileBackground.filters = [red];
				break;
			case "grapes":
				tileIcon = grapes.clone();
				tileBackground.filters = [blue];
				break;
			case "pepper":
				tileIcon = pepper.clone();
				tileBackground.filters = [green];
				break;
			case "radish":
				tileIcon = radish.clone();
				tileBackground.filters = [pink];
				break;
			}
			tileBackground.updateCache();
			
			var tilePipe = pipes[pipe].clone();
			
			var bits = [tileBackground, tileIcon, tilePipe];
			
			var indexOffset = 0;
			bits.map(function(bit) {
				if(index===undefined) {
					stage.addChild(bit);
				} else {
					stage.addChildAt(bit, index + indexOffset);
					indexOffset += 1;
				}
				bit.xFromTile = function(x) {return x*tileWidth;};
				bit.yFromTile = function(y) {return y*tileWidth;};
				bit.x = bit.xFromTile(row);
				bit.y = bit.yFromTile(column);
			});
			
			var tileToReturn = {
				cost: 1000,
				type: type,
				tile: tileBackground,
				icon: tileIcon,
				pipe: tilePipe,
				bits: bits,
				x:row, y:column,
				connects: pipeCodes[pipe],
				oilLevel: 0
			};
			
			gamefield[row][column] = tileToReturn;
			return tileToReturn;
		};
	}();
	
	var getNewOverlay = function(){
		var overlays = {
			'city': new createjs.Bitmap("images/city.png"),
			'tank': new createjs.Bitmap("images/storage-0.png"),
			'well': new createjs.Bitmap("images/well.png"),
		};
		
		//TODO: overlay's image may not have loaded from disk yet.
		
		return function(type, row, column) { //x/y/z, z optional.
			var xFromTile = function(x) {return x*tileWidth;}; //Overlays don't move, so we won't expose this.
			var yFromTile = function(y) {return y*tileWidth;};
			var overlay = overlays[type].clone();
			overlay.x = xFromTile(row);
			overlay.y = yFromTile(column);
			stage.addChild(overlay);
			
			var supply = 0;
			var demand = 0;
			var storage = 0;
			switch(type) {
				case "city":
					demand = 100;
					storage = 100;
				break;
				case "tank":
					storage = 100;
				break;
				case "well":
					supply = 100;
				break;
			}
			
			var margin = 5;
			var offsetX = xFromTile(row) + tileWidth/2;
			var offsetY = yFromTile(column) + tileHeight + margin/2;
			
			var header = new createjs.Text("Header", "bold 11px Arial");
			header.y = offsetY + 2; //We'll compute x later.
			
			var text = new createjs.Text("Text", "10px Arial");
			text.y = offsetY + header.getMeasuredHeight() + margin - 2.5;
			
			var box = new createjs.Shape();
			box.snapToPixel = true;
			
			var redrawTextBox = function() {
				var bubbleArrowWidth = 10;
				var bubbleArrowTop = -bubbleArrowWidth;
				var bubbleWidth = Math.max(header.getMeasuredWidth(), text.getMeasuredWidth()) + margin*2;
				var bTop = 0;
				var bBottom = header.getMeasuredHeight() + text.getMeasuredHeight() + margin*2 - 3;
				var bLeft = -bubbleWidth/2;
				var bRight = bubbleWidth/2;
				var strokeWidth = 1.6;
				
				box.graphics.clear()
					.beginStroke(createjs.Graphics.getRGB(0,0,0))
					.beginFill(createjs.Graphics.getRGB(255,255,255,0.75))
					.setStrokeStyle(strokeWidth)
					.moveTo(bLeft,bTop)
					.lineTo(-bubbleArrowWidth,bTop)
					.lineTo(0,bubbleArrowTop)
					.lineTo(bubbleArrowWidth,bTop)
					.lineTo(bRight,bTop)
					.lineTo(bRight, bBottom)
					.lineTo(bLeft, bBottom)
					.closePath()
					.endStroke();
				//box.cache(bLeft-strokeWidth, bubbleArrowTop-strokeWidth, bubbleWidth+strokeWidth*2, bBottom - bubbleArrowTop+strokeWidth*2);
				//box.updateCache(); //Caching made it look bad. (box._cacheOffsetX was a decimal?)
				box.x = offsetX;
				box.y = offsetY;
				
				header.x = offsetX - bubbleWidth/2 + margin;
				text.x = offsetX - bubbleWidth/2 + margin;
			};
			redrawTextBox();
			
			stage.addChild(box, header, text);
			
			var setText = function(newHeader, newText) {
				if(text.text != newText || header.text != newHeader) {
					if(text.text != newText) {
						text.text = newText; }
					if(header.text != newHeader) {
						header.text = newHeader; }
					redrawTextBox();
				}
			};
			
			var setAlpha = function(value) {
				box.alpha = value;
				header.alpha = value;
				text.alpha = value;
			};
			setAlpha(0);
			
			[box, header, text].map(function(textBalloon) {
				createjs.Tween.get(textBalloon)
				.to({alpha:1}, 200, createjs.Ease.linear);
			});
			
			var tileToReturn = {
				x: row,
				y: column,
				type: type,
				supply: supply,
				demand: demand,
				storage: storage,
				graphic: overlay,
				setMsgText: setText,
				setMsgAlpha: setAlpha
			};
			
			overlayMap[row][column] = tileToReturn;
			return tileToReturn;
		};
	}();
	
	var makeField = function() {
		return _.range(xTiles)
		.map(function() {
			return _
			.range(yTiles)
			.map(function() {
				return null;
			});
		});
	};
	
	var gamefield = makeField();
	var overlayMap = makeField();
	
	//Various modes of the game.
	
	var getRandomType = function(tileTypes) {
		return tileTypes[_.random(0,tileTypes.length-1)];
	};
	var getRandomTileType = function() {
		return getRandomType(['cherry', 'lemon', 'grapes', 'pepper', 'radish'].slice(0,numTileTypes));
	};
	var getRandomPipeType = function() {
		var corners = ['pipe-24', 'pipe-26', 'pipe-48', 'pipe-68'];
		var straights = ['pipe-28', 'pipe-46'];
		var tees = ['pipe-246', 'pipe-248', 'pipe-468', 'pipe-268'];
		var crosses = ['pipe-2468'];
		return getRandomType([].concat(corners, corners, corners, straights, straights, tees, crosses));
	};
	
	//GetNewTile was once a simpler function, so it has been replaced by getRandomTile. getNewTile needs the long args because we'll want control for powerups.
	var getRandomTile = function(x,y,z) {return getNewTile(getRandomTileType(), getRandomPipeType(), x, y, z);};
	
	var frame = xTiles+yTiles; //It use to load from the top down, but I decided I wanted it to load from the bottom up. So... run time backwards, but we have to start with the right amount of time.
	var frame_last_modified = 0;
	var turn = 0;
	
	var callInitialRefreshCache = _.once(function() {
			_.last(_.last(gamefield)).tile.image.onload=refreshCache;
		});
	
	var spawnTiles = function() {
		var rowsSpawnedPerFrame = 3;
		var speedIn = 500;
		
		var spawnRow = function() {
			frame -= 1;
			//if(frame < Math.max(xTiles, yTiles)*2) {
			if(frame > 0) {
				_.range(frame)
				.filter(function(row) {
					return row < xTiles && frame-1-row < yTiles; //Clip corners as we grow to the triange to the second half of the square.
				})
				.map(function(row) {
					var tile = getRandomTile(row, frame-1-row);
					tile.bits.map(function(bit){ //We'll animate the tile coming in like this. One of the nice things about separating the tile x from the tile graphics' xs is that it turns out that they're actually two different things that merely look the same. The tile's x is used for logic. It's where the tile /should be treated as being/, and is also the tile's index in the game grid. (This helps us in a few cases, so we don't have to go looking for it and check every tile in the game.) This frees the graphics' xs to go shooting around, and in general be animated and laggy. Good stuff.
						bit.alpha = 0;
						bit.y = bit.yFromTile(tile.y)-100;
						createjs.Tween.get(bit)
						.to({alpha:1, y:bit.yFromTile(tile.y)}, speedIn, createjs.Ease.cubicIn);
					});
				});
			} else {
				createjs.Ticker.removeListener(spawnTiles);
				setTimeout(addOverlays, speedIn);
			}
		};
		_(rowsSpawnedPerFrame).times(spawnRow);
		callInitialRefreshCache();
	};
	
	var oilWells = [];
	var cities = [];
	var oilGraphic = null;
	var addOverlays = _.once(function() {
		var segments = number_of_cities;
		var segmentHeight = Math.floor(yTiles/segments);
		
		oilGraphic = new createjs.Shape();
		stage.addChild(oilGraphic);
		
		[].concat(
			_.range(1, segments+1).map(function(index) { //Cities, on the left.
				return [
					_.random(1,2),
					_.random(-1,1) + segmentHeight*index - Math.floor(segmentHeight/2)-1
				];
			}).map(function(loc) {
				var city = getNewOverlay('city', loc[0], loc[1]);
				cities.push(city);
				city.setMsgText("City", "Wants oil.");
				return city;
			}),
			
			_.range(1, segments+1).map(function(index) { //Oil wells, on the right.
				return [
					_.random(xTiles-3,xTiles-2),
					_.random(-1,1) + segmentHeight*index - Math.floor(segmentHeight/2)-1
				];
			}).map(function(loc) {
				var no = getNewOverlay('well', loc[0], loc[1]);
				oilWells.push(no);
				no.setMsgText("Oil Well", "Not connected.");
				return no;
			})
		).map(function(overlay) {
			var og = overlay.graphic;
			og.alpha = 0;
			createjs.Tween.get(og)
			.to({alpha:1}, 200, createjs.Ease.linear);
		});
		
		updateOilGraph();
		
		setTimeout(function() {createjs.Ticker.addListener(oilLogic);}, 500);
	});
	
	var oilLogic = function() {
		frame += 1;
		var gfx = oilGraphic.graphics;
		var halfTileX = tileWidth/2;
		var halfTileY = tileHeight/2;
		
		var oilSpeed = 0;
		if(frame - frame_last_modified > 10) {
			oilSpeed = 0.04; //percent of a tile
		}
		
		//Draw oil in pipes.
		gfx.clear();
		
		var printPath = function(tile, colour, pressure) {
			var pipe = tile.pipe;
			var lineRadius = 3;
			var lineLengthOut = {"-1": -14, 0:0, "1": 15};
			var legOutComplete = Math.min(tile.oilLevel*2, 1);
			var legInComplete = Math.min((Math.max(tile.oilLevel-0.5, 0))*2, 1);
			
			if(tile.oilLevel < 1) {
				tile.oilLevel += pressure;
			}
			
			tile.oilPathed.children.map(function(child) {
				var pipedir = [child.x-tile.x, child.y-tile.y];
				var cpipe = child.pipe;
				gfx
				.beginStroke(colour)
				.setStrokeStyle(lineRadius*2)
				.moveTo( //Draw line inside first pipe, to connector ring. The pipe is rendered as a cutaway O, or a u. The rings are a non-cut O, viewed from the top, so we shouldn't draw the oil on them.
					pipe.x+halfTileX+lineRadius*pipedir[0],
					pipe.y+halfTileY+lineRadius*pipedir[1])
				.lineTo(
					pipe.x+halfTileX+lineRadius*pipedir[0] + (lineLengthOut[pipedir[0]]-lineRadius*pipedir[0])*legOutComplete,
					pipe.y+halfTileY+lineRadius*pipedir[1] + (lineLengthOut[pipedir[1]]-lineRadius*pipedir[1])*legOutComplete)
				.moveTo( //Draw the line inside the second pipe, to the center.
					cpipe.x+halfTileX+lineLengthOut[-pipedir[0]],
					cpipe.y+halfTileY+lineLengthOut[-pipedir[1]])
				.lineTo(
					cpipe.x+halfTileX-(lineRadius*-pipedir[0])*legInComplete + lineLengthOut[-pipedir[0]]*(1-legInComplete),
					cpipe.y+halfTileY-(lineRadius*-pipedir[1])*legInComplete + lineLengthOut[-pipedir[1]]*(1-legInComplete))
				.endStroke();
				
				if(tile.oilLevel < 1) {
					//console.log("Drawing pipe lo="+legOutComplete+"/li="+legInComplete+".");
				} else {
					printPath(child, colour, pressure);
					child.hasOil = true;
				}
			});
		};
		oilWells.map(function(well) {
			if(well.highlighted) {
				printPath(gamefield[well.x][well.y], "rgba(60,60,200,0.8)", oilSpeed);
			} else {
				printPath(gamefield[well.x][well.y], "rgba(0,0,0,1)", oilSpeed);
			}
			well.setMsgText('Oil Well', 'Not connected.');
			well.connected = false;
		});
		cities.map(function(city) {
			
			var parentWalker = function(obj, depth, currentDepth) { //Return the object at depth in the chain or the last object, and the depth it was found at.
				depth = depth || 0;
				currentDepth = currentDepth || 0;
				if((depth && depth == currentDepth) || !obj.parent || !obj.parent.oilPathed){
					//console.log(["Didn't recurse.", depth, currentDepth, obj.parent]);
					return {object: obj, depth: currentDepth};
				} else {
					//console.log("Recursed. " + currentDepth);
					return parentWalker(obj.parent.oilPathed, depth, currentDepth+1);
				}
			};
			
			city.setMsgText('City', 'Wants oil.');
			city.connected = false;
			
			if(gamefield[city.x][city.y].hasOil && gamefield[city.x][city.y].oilPathed) {
				if(!city.initialWave) {
					createjs.Tween.get(city)
					.to({initialWave:500});
				}
				if(city.initialWave && city.initialWave < 500) {
					//Render backwards path here, width based on initialwave.
				}
				//city.addNewOilBlob; //This will render the oil flowing from the wells.
				//city.advanceExistingOilBlobs;
				
				city.setMsgText('City', 'Has oil supply!');
				var wellLoc = parentWalker(gamefield[city.x][city.y].oilPathed, 0).object.loc;
				overlayMap[wellLoc[0]][wellLoc[1]].setMsgText('Oil Well', 'Connected to city.');
				city.connected = true;
				overlayMap[wellLoc[0]][wellLoc[1]].connected = true;
				
			}
			
			if(!watched.gameOver && !_.find(
				[].concat(oilWells, cities),
				function(elem) {
					return !elem.connected;
				})) {
				victoryCallbacks.map(function(call) {
					call();
				});
				watched.won = true; //We should set this first.
				watched.gameOver = true;
			}
			
			
			
		});
	};
	
	var updateOilGraph = function () {
		var pipeMatches = {
			2: {match: 8, dir: [0,1]},
			4: {match: 6, dir: [-1,0]},
			6: {match: 4, dir: [1,0]},
			8: {match: 2, dir: [0,-1]}
		};
		
		var matchingPipeCoords = function(x,y) {
			return gamefield[x][y].connects.map(function(connection) {
				var target = pipeMatches[connection];
				var newColumn = gamefield[x+target.dir[0]];
				var newTile = newColumn && newColumn[y+target.dir[1]];
				return newTile && _.contains(newTile.connects, target.match) && newTile; //Note to self: newtile is being checked twice is because, first, we need to check that it exists so we don't throw errors looking up stuff it doesn't have. Second, we need to return newtile if there it does contain our match, and && returns the first false value or the last true value.
			}).filter(function(a) {
				return a;
			});
		};
		
		var seekCity = function seek (activeHeads, well) {
			if(_.head(activeHeads)) {
				var tile = _.head(activeHeads).tile;         //tile is an object from gamefield.
				var parent = _.head(activeHeads).tileParent; //Our potential parent. Because we had to wait in the queue to be processed, we could have already been processed -- and, thus, we already belong to a parent.
				
				if(!tile.oilPathed) { //Do we actually exist?
					tile.oilPathed = {
						children: [],
						parent: parent,
						loc: [tile.x, tile.y]
					};
					
					if(parent) {parent.oilPathed.children.push(tile);} //Hi, parental unit.
					
					if(overlayMap[tile.x][tile.y]===null || (overlayMap[tile.x][tile.y].type != 'city')) { //Stop. We've found our demand. 1 well -> 1 city.
						//console.log("recursed normally");
						seek(
							activeHeads
							.slice(1,activeHeads.length)
							.concat(matchingPipeCoords(tile.x, tile.y)
								.map(function(newTile){
									//console.log("at: " + tile.x + "/" + tile.y + ", got connected " + newTile.x + "/" + newTile.y + ".");
									return {
										tile: newTile,
										tileParent: tile
									};
								})
							),
							well
						);
					} else {
						//console.log("didn't recurse, found city");
						//console.log(overlayMap[tile.x][tile.y]);
						well.targetCity = overlayMap[tile.x][tile.y];
					}
				} else {
					//console.log("recursed, was alread pathed");
					//if(parent) {parent.oilPathed.children.push(tile);} //Enabling this line, even if it's not actually called, crashes the Chrome tab.
					seek(activeHeads.slice(1,activeHeads.length), well);
				}
			} else {
				//console.log("didn't recurse, no head");
			}
		};
		
		return function () {
			gamefield.map(function(column) {
				column.map(function(tile) {
					tile.oilPathed = false;
				});
			});
			oilWells.map(function(well) {
				well.targetCity = null;
				seekCity([{tile:gamefield[well.x][well.y]}], well);
			});
		
			gamefield.map(function(column) {
				column.map(function(tile) {
					if(!tile.oilPathed) {
						tile.oilLevel = 0;
					}
				});
			});
		};
	}();
	
	//MOUSE
	var pixToTile = function(dist, tsize) {
		return Math.floor(dist/tsize);
	};
	
	var endMouseEvent = function(evt) {
		evt.nativeEvent.preventDefault();
		evt.nativeEvent.stopPropagation();
	};
	
	var selectedColor = function() { //Sort of
		var int = -50;
		var filter1 = new createjs.ColorFilter(1,1,1,1,int,int,int,0); //r,g,b,a,ro,go,bo,ao. Yep. :|
		return filter1;
	}();
	
	//I'm not sure if it's guaranteed, but we'll assume every mouse down event has a corresponding mouse up event sometime in the future.
	var selectedObjects = [];
	stage.onMouseDown = function(evt) { //Register which tile we're over.
		if(evt.nativeEvent.which==1) {
			if(watched.money) {
				var overTileX = pixToTile(evt.stageX, tileWidth);
				var overTileY = pixToTile(evt.stageY, tileHeight);
				if(overTileX >= xTiles || overTileY >= yTiles) {return;}
				var selectedObject = gamefield[overTileX][overTileY];
				
				//console.log(selectedObject);
				
				selectedObjects = [selectedObject];
				selectedObject.tile.filters.push(selectedColor);
				selectedObject.tile.updateCache();
			}
			endMouseEvent(evt);
		}
	};
	
	stage.onMouseMove = function(evt) { //Add more tiles as we move.
		var overTileX = pixToTile(evt.stageX, tileWidth);
		var overTileY = pixToTile(evt.stageY, tileHeight);
		if(evt.nativeEvent.which==1) {
			if(overTileX >= xTiles || overTileY >= yTiles) {return true;} //If we aren't over a tile, then abort the function.
			var selectedObject = gamefield[overTileX][overTileY];
			
			if(!_.contains(selectedObjects, selectedObject)) {
				var adjacentXY = _.find(selectedObjects, function(adj){
					var comp_x = Math.abs(adj.x - selectedObject.x);
					var comp_y = Math.abs(adj.y - selectedObject.y);
					return comp_x === 1 && comp_y === 0 || comp_x === 0 && comp_y === 1;
				});
				if(selectedObjects.length && selectedObject.type == _.head(selectedObjects).type && adjacentXY) {
					selectedObjects.push(selectedObject);
					selectedObject.tile.filters.push(selectedColor);
					selectedObject.tile.updateCache();
				}
			}
			
			endMouseEvent(evt);
		}
		
		[].concat(cities, oilWells).map(function(over) {
			var maxDist = Math.max(Math.abs(over.graphic.x - evt.stageX + tileWidth/2), Math.abs(over.graphic.y - evt.stageY + tileHeight*1.5)/1.5);
			over.setMsgAlpha(maxDist/100-0.5);
		});
		
		oilWells.map(function(well) {
			well.highlighted = well.x == overTileX && well.y == overTileY;
		});
		
		mouseX = Math.floor(evt.stageX);
		mouseY = Math.floor(evt.stageY);
	};
	
	stage.onMouseUp = function(evt) { //And, finally, remove tiles, recompute stuff, add new tiles.
		if(evt.nativeEvent.which==1) {
			if(selectedObjects.length < minimumTileMatchCount) { //Reset.
				selectedObjects.map(function(obj) {
					obj.tile.filters.pop();
					obj.tile.updateCache();
				});
			} else { //Remove object from play, shuffle objects above it down a space, and spawn new objects at the top.
				watched.money -= destructionCost; //Destruction is a flat-rate buisiness. This provides incentive to do more complicated destroys.
				watched.score += Math.floor(Math.pow(selectedObjects.length, 1.4));
				frame_last_modified = frame;
				
				if(watched.money <= 0) {
					watched.gameOver = true;
				}
				
				var columnsAffected = {}; //Will be a [] later.
				selectedObjects.map(function(obj) {
					obj.bits.map(function(bit) { //Ease out existing objects and remove them from stage.
						var easeOutTime = 200;
						createjs.Tween.get(bit)
						.to({alpha:0, y:bit.y+5}, easeOutTime, createjs.Ease.cubicOut)
						.call(stage.removeChild, bit, stage);                          //This has no effect.
						setTimeout(function() {stage.removeChild(bit);}, easeOutTime); //So we'll do it manually.
					});
					columnsAffected[obj.x] = true;
					gamefield[obj.x][obj.y] = null;
					
				});
				columnsAffected = _.keys(columnsAffected).map(function(key) {
						return parseInt(key, 10);
					});
				
				// Lesson time.
				// Here is comment #1, written yesterday, after the above parseInt was commented out.
				//     "As long as we've got assasinine type conversions we might as well roll with it."
				// Here is comment #2, written today after about 20 min. trying to figure out why pathing was breaking after 20 tiles or so.
				//     "Needs to be parsed as int. x values of new objects (but not their y values) were being set to a string, and it was breaking pathing somehow."
				// If Javascript seems to think it's a good idea, you probably shouldn't do it. It's that 'one kid' from school of programming languages.
				
				columnsAffected.map(function(x) {
					_.range(yTiles-1, -1, -1).map(function(y) {
						var tile = gamefield[x][y];
						if(tile) {
							var newY = gamefield[x].lastIndexOf(null);
							if(newY > y) {
								tile.bits.map(function(bit) {
									createjs.Tween.get(bit)
									.to(
										{y:bit.yFromTile(newY)},
										Math.sqrt(Math.abs(tile.y-newY)*50000), //Maybe add 50*tile here, to add in a bit of inital inertia simulation. Break up blocks falling down on top of other falling blocks a bit.
										createjs.Ease.cubicIn); //bounceOut also works nicely here, but it's a bit distracting.
								});
								tile.y = newY;
								gamefield[x][y] = null;
								gamefield[tile.x][tile.y] = tile;
							}
						}
					});
					_.range(0, gamefield[x].lastIndexOf(null)+1).map(function(y) {
						var tile = getRandomTile(x, y, 0); //This is probably a least-efficient way to insert zorders, since I think it bumps up all existing zorders for each overlay on each added tile. Ohhh well.
						tile.bits.map(function(bit) {
							bit.alpha = 0;
							createjs.Tween.get(bit)
							.wait(50*y) //"Matrix-style"
							.to({alpha:1}, 500, createjs.Ease.cubicIn);
						});
					});
				});
				updateOilGraph();
			}
			
			//Before we destroy this, deal with these objects' destruction.
			selectedObjects=[];
			endMouseEvent(evt);
		}
	};
	
	stage.onMouseOut = function(evt) {
		[].concat(cities, oilWells).map(function(over) {
			over.setMsgAlpha(1);
		});
	};
	
	var refreshCache = function() {
		gamefield.map(function(column) {
			column.map(function(tile) {
				if(tile) {
					tile.tile.updateCache();
				}
			});
		});
	};
	
	createjs.Ticker.addListener(stage);
	createjs.Ticker.addListener(spawnTiles);
	
	return watched; //Use 'mainWindow.watch(key, function)' to get stuff when changed. :)
};

mainWindow = mainWindowFunction();