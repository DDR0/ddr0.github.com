/*global createjs console _ $ averageRGB isFL iTiles iMode iScore iMoves iTime iJelly*/// JSLint is good at catching errors, but it has it's own, strange, ideas about style.
//Chromium: Run with --allow-file-access-from-files. It'll be fine in production, once we get it on a remote server.

/* === PROGRAM OVERVIEW ===
startNewGame, defined in this file, is called by load game.js when all the required framework files have been loaded. Its return value is set to mainWindow, there, and that is used to hook the HTML display (defined in htmlInterface.js) into the internal score and x remaining vars. (We can't use object.watch, even with a shim, because in ie8 it's unshimable.) However, the object.watch idea is still valid, so we'll just use the clunkier, hand-rolled watchWith provided by watchableCounter. This file relies upon a <canvas> id'd as 'main' in index.html. htmlInterface.js relies on some text id'd as 'score' and 'money'.
This means that you can say stuff like "mainWindow.watchScoreWith(function(foo) {console.log('new value: ' + foo)})" after the game has been initialized, over in htmlInterface.js.
*/

startNewGame = function() {
	"use strict";
	
// →→→ Function Definitions ←←←
	var watchableCounter = function(initial_value) {
		var counter = initial_value;
		var watchers = [];
		var runWatchers = function(counter) {
			watchers.map(function(watcher){
				watcher(counter);
			});
		};
		return {
			add: function(amount) {
				counter += amount;
				if(amount !== 0) {
					runWatchers(counter);
				}
			},
			set: function(amount) {
				if(counter !== amount) {
					runWatchers(amount);
				}
				counter = amount;
			},
			value: function() {return counter;},
			watchWith: function(watcher) {
				watchers.push(watcher);
				watcher(counter); //Call the watcher when it's set, because in our context we'll want to update the score/remaining counters as soon as we start the game.
			},
		};
	};
	
	
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
	
	var makeTileLocatable = function(tileToReturn, x, y) {
			tileToReturn.tileX = x;
			tileToReturn.tileY = y;
			tileToReturn.xFromTile = function(x) {return (typeof x === 'number' ? x : tileToReturn.tileX) * tileWidth;};
			tileToReturn.yFromTile = function(y) {return (typeof y === 'number' ? y : tileToReturn.tileY) * tileHeight;};
			tileToReturn.x = tileToReturn.xFromTile();
			tileToReturn.y = tileToReturn.yFromTile();
		};
	
	var getNewTile = function(){
		var starburst = function(x,y) {
			var starburst = new createjs.BitmapAnimation(
				new createjs.SpriteSheet({
					images: ["images/Burst_FX_EJS/Burst_FX.png"],
					frames: [
						[0,		0,		124,	135,	0,	61,	71],
						[124,	0,		124,	135,	0,	61,	71],
						[248,	0,		124,	135,	0,	61,	71],
						[372,	0,		124,	135,	0,	61,	71],
						[0,		135,	124,	135,	0,	61,	71],
						[124,	135,	124,	135,	0,	61,	71],
						[248,	135,	124,	135,	0,	61,	71],
						[372,	135,	124,	135,	0,	61,	71],
						[0,		270,	124,	135,	0,	61,	71],
						[124,	270,	124,	135,	0,	61,	71],
						[248,	270,	124,	135,	0,	61,	71],
						[372,	270,	124,	135,	0,	61,	71]
					]}));
			starburst.x = x; starburst.y = y;
			starburst.play();
			effectContainer.addChild(starburst);
			starburst.onAnimationEnd = function() {
				effectContainer.removeChild(starburst);
			};
			return starburst;
		};

		
		return function getNewTileInternal (x,y, isBonus, type) { //x/y are in terms of tiles from the origin. type is the index of the bitmap. isBonus can be undefined or the type of bonus.
			if(!_.contains([undefined, "hor", "ver", "point", "like"], isBonus) && undefined !== isBonus) { //_.contains doesn't work in ie8 with undefined.
				console.warn("isBonus is '" + isBonus + "', shouldn't be.");
				throw "bad isBonus value";
			}
			
			var tileIndex = (typeof type!=="number") ? _.random(numTileTypes) : type;
			var tileToReturn = spriteSheetB.clone();
			tileToReturn.sourceRect = !isBonus ? tileSourceRects.normal[tileIndex].clone() : tileSourceRects[isBonus][tileIndex].clone();
			
			if(isBonus === "like") {
				tileToReturn.regY = 3;
			}
			
			tileToReturn.index = tileIndex; //Because new tiles are cloned from the prototypes, we can't set the index in the prototype.
			
			makeTileLocatable(tileToReturn, x, y);
			
			tileToReturn.isBonus = !!isBonus;
			tileToReturn.bonuses = [];
			
			tileToReturn.remove = function(_, quietly) { //Note: Only call if you've actually added this tile to the stage. Set "quietly" to true if you're subbing out this tile for another one. If "quietly", score popup is suppressed and jelly isn't removed.
				gamefield[tileToReturn.tileX][tileToReturn.tileY] = null;
				if(!quietly) {
					if(jelly && jellyfield[tileToReturn.tileX][tileToReturn.tileY]) jellyfield[tileToReturn.tileX][tileToReturn.tileY].remove();
					drawTileScore(Math.floor(40 * (matchesMadeThisMove/2+1)), tileToReturn.x+tileWidth/2, tileToReturn.y+tileHeight/2, 30, ["#F8DB63", "#CF8A09"]);
				}
				tileContainer.removeChild(tileToReturn);
			};
			
			tileToReturn.burst = function() {
				starburst(tileToReturn.x + tileWidth/2, tileToReturn.y + tileHeight / 2);
			};
			
			if(type!==undefined || linesInDir(tileToReturn, 'h').length < 2 && linesInDir(tileToReturn, 'v').length < 2) {
				tileContainer.addChild(tileToReturn);
				return tileToReturn;
			} else {
				//console.log('Adding tile, failed no-3s test. Retrying.');
				return getNewTileInternal(x,y);
			}
		};
	}();
	
	
	var getNewJellyTile = function(x,y) {
		var tile = spriteSheetB.clone();
		tile.sourceRect = new createjs.Rectangle(312, 710, 66, 65);
		makeTileLocatable(tile, x,y);
		tile.remove = function() {
			jellyfield[x][y] = null;
			jellyContainer.removeChild(tile);
			if(! _.find(jellyfield, function(column) {
				return _.find(column, function(tile) {
					return tile;
				});
			})) {
				runGameOver();
			}
		};
		jellyContainer.addChild(tile);
		return tile;
	};
	
	
	var pixToTile = function(dist, tsize) {
		return Math.floor(dist/tsize);
	};
	
	
	var canInput = function() { //Returns true if we have time left or moves left.
		return !noInput && !paused;
	};
	
	
	var linesInDir = function() {
		var lineInDir = function(tile, vector) {
			var nextTile = gamefield[tile.tileX+vector[0]] && gamefield[tile.tileX+vector[0]][tile.tileY+vector[1]];
			if(nextTile && nextTile.index === tile.index) {
				return lineInDir(nextTile, vector).concat(nextTile);
			} else {
				return [];
			}
		};
		return function(tile, direction) {
			(!_.contains(['h', 'v'], direction) ?
				function() {
					console.warn('Bad direction: \''+direction+'\' (Should be either \'h\' or \'v\'.)');
					throw('bad direction');
					} :
				function() {} )();
			var vecs = direction === 'h' ? [[-1,0],[1,0]] : [[0,-1],[0,1]];
			return [].concat(lineInDir(tile, vecs[0]), lineInDir(tile, vecs[1]));
		};
	}();
	
	
	var switchTiles = function(a,b) {
		noInput = true;
		noSwitch = true;
		if(hintBounce.tiles.length) stopHighlightingMatches();
		
		var holder = {};
		holder.tileX = b.tileX;		holder.tileY = b.tileY; //[TILES]: Switch tiles…
		b.tileX = a.tileX;			b.tileY = a.tileY;
		gamefield[b.tileX][b.tileY] = b;
		a.tileX = holder.tileX;		a.tileY = holder.tileY;
		gamefield[a.tileX][a.tileY] = a;
		
		createjs.Tween.get(a)
			.to({x:b.x, y:b.y}, 250, createjs.Ease.cubicInOut);
		createjs.Tween.get(b)
			.to({x:a.x, y:a.y}, 250, createjs.Ease.cubicInOut)
			.call(function() {
				var aMatches = [linesInDir(a, 'h'), linesInDir(a, 'v')];
				var bMatches = [linesInDir(b, 'h'), linesInDir(b, 'v')];
				if(((a.index < 0 || b.index < 0) && b.index != a.index) || (a.isBonus && b.isBonus)) { //Chocolate-bombs are "indexless", at -1. (This keeps them from being matched normally with regards to the hint bounce.) If tile a xor tile b is chocolate, OR tile a and tile b are both bonus tiles, then we need to combine the two tiles we're switching. (We won't care about 'normal' matches, in this case.)
					removeTilesByIndex(a,b);
					if(mode === 'turns') remainingTiles.add(-1);
				} else if(	aMatches[0].length > 1 || //[TILES]: see if we made any matches.
							aMatches[1].length > 1 || //1 because we want 2 or more tiles matches, 2 because it doesn't include the switched tile, so 3 alltogether.)
							bMatches[0].length > 1 || //Refactor: This test is somewhat duplicated. Perhaps we could compute the filtered removeMatches earlier and test it's length?
							bMatches[1].length > 1) { //[TILES]: Perhaps removes the tiles, and all that that entails with regards to bonuses generated and bonuses used.
					removeMatches([[a, aMatches], [b, bMatches]].filter(function(matchPair) { //At least one is good, but we need to not pass along the other one if it's not good. So, we'll filter the list.
							return matchPair[1][0].length > 1 || matchPair[1][1].length > 1;
						}));
					if(mode === 'turns') remainingTiles.add(-1);
					stopHighlightingMatches();
				} else { //[TILES]: Or perhaps switch the tiles back.
					a.tileX = b.tileX;			a.tileY = b.tileY;
					gamefield[a.tileX][a.tileY] = a;
					b.tileX = holder.tileX;		b.tileY = holder.tileY;
					gamefield[b.tileX][b.tileY] = b;
								
					noInput = false; //Enable input early, it'll feel more responsive.
					
					var tween;
					tween = createjs.Tween.get(a)
						.to({x:a.xFromTile(), y:a.yFromTile()}, 350, createjs.Ease.cubicInOut); //Tomorrow -- recompute these based on tile positions, they're sliding around.
					tween = createjs.Tween.get(b)
						.to({x:b.xFromTile(), y:b.yFromTile()}, 350, createjs.Ease.cubicInOut);
					
					hintBounce.id = window.setTimeout(function() {
						if(hintBounce.tiles.length) highlightPotentialMatches(hintBounce.tiles);
						noSwitch = false;
					}, tween.duration+25); //Something seems to need to run first; no clue what.
				}
			});
	};
	
	
	var removeMatches = function() {
		var getBonus = function(tile, matches) {
			var bonus = {x:tile.tileX, y:tile.tileY, index:tile.index, types:[]};
			if(matches[0].length > 2) {
				bonus.types.push('hor');
			}
			if(matches[1].length > 2) {
				bonus.types.push('ver');
			}
			if(matches[0].length > 3 || matches[1].length > 3) {
				bonus.types = ['like'];
			}
			if(matches[0].length > 1 && matches[1].length > 1) {
				bonus.types.push('point');
			}
			
			if(bonus.types.length) {
				tile.transmuteToBonus = true;
				return bonus;
			} else {
				return;
			}
		};
		
		var removeMatchingTilesAndAddBonuses = function(tilesToRemove, bonuses, callback) { //Callback will either be run immeadiatly, if there were no tiles to be removed, or when the tiles that need to be removed have finished tweening out.
			var tweenCount = 0;
			tilesToRemove.map(function(matchedTile){ //Remove matching tiles (passed in).
				if(!matchedTile.transmuteToBonus) {
					createjs.Tween.get(matchedTile)
						.to({alpha:0}, 200, createjs.Ease.cubicIn)
						.call(matchedTile.remove)
						.call(function() {
							tweenCount -= 1;
							if(tweenCount === 0) {
								if(callback) callback();
								tweenCount -= 1;
							}
						});
					tweenCount += 1;
					} else {
						matchedTile.remove(); //Remove the tile now, we'll replace it with a bonus tile later this function. Can't fade out because then the removal process would wipe the board entry of the bonus tile.
					}
				});
			
			bonuses.map(function(bonusTile) { //Add any bonus tiles we need to as a result of the matches. (Tiles are passed in.)
				var newTile = getNewTile(bonusTile.x, bonusTile.y, _.head(bonusTile.types), bonusTile.index);
				gamefield[bonusTile.x][bonusTile.y] = newTile;
				newTile.bonuses = bonusTile.types;
				if(_.contains(newTile.bonuses, 'like')) newTile.index = -1;
			if(tweenCount === 0 && callback) callback();
			});
		};
		
		var fireballLife = 700;
		var fireballDistance = 700; //Should be larger than the game board plus the fireball.
		var fireballStretch = 0.7;
		var animateFireballs = function(source_tile, fireballs) {
			fireballs.map(function(fireball) {
				fireball.sourceRect = new createjs.Rectangle(480, 596, 206, 33);
				fireball.regX = fireball.sourceRect.width/2; fireball.regY = fireball.sourceRect.height/2;
				fireball.x = source_tile.x + tileWidth/2 + (fireball.initialOffsetX||0); fireball.y = source_tile.y + tileHeight/2 + (fireball.initialOffsetY||0);
				effectContainer.addChild(fireball);
				createjs.Tween.get(fireball)
					.to({
							x: fireball.x+fireball.escapeVector[0]*fireballDistance,
							y: fireball.y+fireball.escapeVector[1]*fireballDistance,
							scaleX: 1+fireballStretch,
							scaleY: 1-fireballStretch
						}, fireballLife, createjs.Ease.linear)
					.call(function() {
						effectContainer.removeChild(fireball);
					});
			});
		};
		
		var spawnBonusEffects = function(tiles, callback) {
			var allBonuses = _.flatten(_.pluck(tiles, 'bonuses'));
			var delay = 0;
			if(_.contains(allBonuses, 'like')) delay = 250;
			if(_.contains(allBonuses, 'giant')) delay = 400;
			tiles.map(function(tile) {
				tile.bonuses.map(function(bonusName) {
					var fireballs;
					switch(bonusName) {
						case 'hor':
							window.setTimeout(function() {
								fireballs = [spriteSheetB.clone(), spriteSheetB.clone()];
								fireballs[0].rotation = 180;
								fireballs[0].escapeVector = [-1,0];
								fireballs[1].escapeVector = [1,0];
								animateFireballs(tile, fireballs);
							}, delay);
							break;
						case 'ver':
							window.setTimeout(function() {
								fireballs = [spriteSheetB.clone(), spriteSheetB.clone()];
								fireballs[1].rotation = 270;
								fireballs[0].rotation = 90;
								fireballs[0].escapeVector = [0,1];
								fireballs[1].escapeVector = [0,-1];
								animateFireballs(tile, fireballs);
							}, delay);
							break;
						case 'point':
							window.setTimeout(function() {
								var explosion = spriteSheetB.clone();
								explosion.sourceRect = new createjs.Rectangle(507, 643, 229, 224);
								explosion.regX = explosion.sourceRect.width/2; explosion.regY = explosion.sourceRect.height/2;
								explosion.x = tile.x + tileWidth/2; explosion.y = tile.y + tileHeight/2;
								explosion.alpha = 1;
								explosion.scaleX = 0.5; explosion.scaleY = 0.5;
								effectContainer.addChild(explosion);
								createjs.Tween.get(explosion)
									.to({
										alpha: 0,
										scaleX: 1.5, scaleY: 1.5
									}, 500, createjs.Ease.circOut)
									.call(function() {
										effectContainer.removeChild(explosion);
									});
							}, delay);
							break;
						case 'like':
							_.flatten(
								gamefield.map(function(column) {
									return column.filter(function(targetTile) {
										return targetTile.index === tile.matchedWithIndex || tile.matchedWithIndex === -1;
									});
								}), true)
							.sort(function(a,b) {
								return a.tileX > b.tileX;
							})
							.map(function(targetTile, index) {
								window.setTimeout(function() {
									var lightning = spriteSheetB.clone();
									var lightningLength = Math.min(707, Math.sqrt(Math.pow(targetTile.y-tile.y, 2) + Math.pow(targetTile.x-tile.x, 2)) ); //707 is max. Otherwise, calculates length between two points.
									lightning.sourceRect = new createjs.Rectangle(416, 299+(707-lightningLength), 66, lightningLength);
									lightning.regX = lightning.sourceRect.width/2;
									lightning.x = targetTile.x + tileWidth/2; lightning.y = targetTile.y + tileHeight/2;
									lightning.rotation = Math.atan2(targetTile.y-tile.y, targetTile.x-tile.x) * 180 / Math.PI + 90;
									lightning.onTick = function() {
										lightning.scaleX = (Math.random() > 0.5 ? 1 : -1) * (Math.random()/8+0.8);
									};
									effectContainer.addChild(lightning);
									window.setTimeout(function() {
										effectContainer.removeChild(lightning);
									}, 100);
								}, index*(tile.matchedWithIndex !== -1 ? 37.5 : 7.5));
								if(tile.matchedWithIndex === -1) delay = 500;
							});
							break;
						case 'giant':
							var overtile = spriteSheetB.clone();
							overtile.sourceRect = tileSourceRects.hor[tile.index].clone();
							overtile.regX = overtile.sourceRect.width/2; overtile.regY = overtile.sourceRect.height/2;
							overtile.scaleX = 2; overtile.scaleY = 2;
							overtile.x = tile.x+tileWidth/2; overtile.y = tile.y+tileHeight/2;
							effectContainer.addChild(overtile);
							createjs.Tween.get(overtile)
								.to({
									scaleX: 3, scaleY: 3
								}, 400, createjs.Ease.circIn)
								.call(function() {
									tile.alpha = 0;
									
									fireballs = _.range(12).map(function() {
										return spriteSheetB.clone();
									});
									
									_.range(0,3).map(function(index) {
										fireballs[index].rotation = 0;
										fireballs[index].escapeVector = [1,0];
									});
									fireballs[0].initialOffsetY = tileHeight;
									fireballs[1].initialOffsetX = tileWidth;
									fireballs[2].initialOffsetY = -tileHeight;
									
									_.range(3,6).map(function(index) {
										fireballs[index].rotation = 180;
										fireballs[index].escapeVector = [-1,0];
									});
									fireballs[3].initialOffsetY = tileHeight;
									fireballs[4].initialOffsetX = -tileWidth;
									fireballs[5].initialOffsetY = -tileHeight;
									
									_.range(6,9).map(function(index) {
										fireballs[index].rotation = 90;
										fireballs[index].escapeVector = [0,1];
									});
									fireballs[6].initialOffsetX = tileWidth;
									fireballs[7].initialOffsetY = tileHeight;
									fireballs[8].initialOffsetX = -tileWidth;
									
									_.range(9,12).map(function(index) {
										fireballs[index].rotation = 270;
										fireballs[index].escapeVector = [0,-1];
									});
									fireballs[9].initialOffsetX = tileWidth;
									fireballs[10].initialOffsetY = -tileHeight;
									fireballs[11].initialOffsetX = -tileWidth;
									
									animateFireballs(tile, fireballs);
								})
								.to({
									scaleX: 4, scaleY: 4,
									alpha: 0
								}, 100, createjs.Ease.linear)
								.call(function() {
									effectContainer.removeChild(overtile);
								});
							break;
						default:
							console.warn('spawnBonusEffects was passed a tile with a bonus of type \'' + bonusName + '\', which isn\'t a valid bonus.');
							throw "bad effect name";
					}
				});
			});
			window.setTimeout(callback, delay);
		};
		
		var tilesAffectedByBonus = function(tile) {
			//console.log(tile.bonuses);
			var affectedTiles = [];
			if(_.contains(tile.bonuses, 'hor')) {
				_.range(xTiles).map(function(x) {
					var match = gamefield[x][tile.tileY];
					if(match) affectedTiles.push(match);
				});
			}
			if(_.contains(tile.bonuses, 'ver')) {
				_.range(yTiles).map(function(y) {
					var match = gamefield[tile.tileX][y];
					if(match) affectedTiles.push(match);
				});
			}
			if(_.contains(tile.bonuses, 'point')) {
				_.range(-1,2).map(function(x) {
					_.range(-1,2).map(function(y) {
						var match = gamefield[tile.tileX+x] && gamefield[tile.tileX+x][tile.tileY+y];
						if((x || y) && match) affectedTiles.push(match);
					});
				});
			}
			if(tile.index < 0 && typeof tile.matchedWithIndex === "undefined") {
				var pretendMatchTile = tile.tileY+1 < yTiles ? gamefield[tile.tileX][tile.tileY+1] : gamefield[tile.tileX][tile.tileY-1];
				tile.matchedWithIndex = pretendMatchTile.index;
				affectedTiles = affectedTiles.concat(pairComboTilesToRemove(tile, pretendMatchTile));
			}
			return affectedTiles;
		};
		
		return function removeMatchesInternal(matches, flat) { //If not flat: Matches is a list of lists containing in order the 'key' object and the other objects which made up the match (a list containing row/column match). If flat: Matches is a list of tiles to remove. Skips computing additional matches and new bonus tiles.
			if(!matches.length) {
				var drawRating = function() {
					if(matchesMadeThisMove > 4) {
						drawBigOverlay('Delicious!', Width/2, Height/2, 100, ["#F8DB63", "#CF8A09"]);
					} else if(matchesMadeThisMove > 3) {
						drawBigOverlay('Divine!',    Width/2, Height/2, 100, ["#F8DB63", "#CF8A09"]);
					} else if(matchesMadeThisMove > 2) {
						drawBigOverlay('Sweet!',     Width/2, Height/2, 100, ["#F8DB63", "#CF8A09"]);
					} else if(matchesMadeThisMove > 1) {
						drawBigOverlay('Tasty!',     Width/2, Height/2, 100, ["#F8DB63", "#CF8A09"]);
					}
				};
				if(remainingTiles.value() <= 0) {
					if(sugarRush) {
						sugarRush();
					} else {
						runGameOver();
						drawRating();
					}
				} else {
					noInput = false;
					noSwitch = false;
					checkForPotentialMatches();
					drawRating();
					matchesMadeThisMove = 0;
				}
				return;
			}
			
			stopHighlightingMatches();
			stopFutureMatchHighlight();
			
			var newBonuses = [];
			var tilesToRemove = [];
			if(!flat) {
				if(matches[0][1].length || matches.length > 1) {
					newBonuses = matches.map(function(matchPair) {
						return getBonus(matchPair[0], matchPair[1]);
						}).filter(function(bonus) {return bonus;});
					
					matches.map(function(matchPair) {
						tilesToRemove = tilesToRemove.concat(
							matchPair[1][0].length > 1 ? matchPair[1][0] : [],
							matchPair[1][1].length > 1 ? matchPair[1][1] : [],
							matchPair[0]);
					});
				} else { //This mode is the one where we switch two tile types.
					tilesToRemove = pairComboTilesToRemove(matches[0][0], matches[0][1]);
				}
				//console.log(tilesToRemove);
			} else {
				tilesToRemove = matches;
			}
			var bonusesToApply = [];
			(function computeBonusRemoves (toCheck, first) {
				if(first) first();
				var last = _.last(toCheck);
				var init = _.initial(toCheck);
				if(last && !_.find(tilesToRemove, function(tile) {return tile.tileX === last.tileX && tile.tileY === last.tileY;}) ) {
					if(!_.find(tilesToRemove, function() {})) {
						tilesToRemove.push(last);
					}
					bonusesToApply.push(last),
					computeBonusRemoves(!last.isBonus ? init : init.concat(tilesAffectedByBonus(last)));
				} else if(init.length) {
					computeBonusRemoves(init);
				}
			})(tilesToRemove, function() {tilesToRemove=[];});
			bonusesToApply = bonusesToApply.filter(function(tile) {
				return tile.bonuses.length;
			});
			
			tilesToRemove.map(function(tile) {tile.burst();});
			window.setTimeout(function() {
				spawnBonusEffects(bonusesToApply, function() {
					removeMatchingTilesAndAddBonuses(
						tilesToRemove,
						newBonuses,
						function () {
							fallTiles(function() {
								var tilesToRemove = searchForMatches();
								matchesMadeThisMove += tilesToRemove.length;
								removeMatchesInternal(tilesToRemove);
							});
						});
					});
				}, 250);
			
			//Spawn bonus candies, remove tiles that should be removed, including tiles affected by a bonus being removed.
			//Check for additional removable matches and remove them using this function.
		};
	}();
	
	
	var removeTilesByIndex = function(a,b) { // a xor b is a chocolate-covered candy (one with index -1)
		if(b.index < 0 && a.index > b.index) { //Let's have the "a" object be the chocolate-covered one.
			var tmp = a;
			a = b;
			b = tmp;
		}
		a.matchedWithIndex = b.index;
		removeMatches([[a, b]]);
	};
	
	
	var pairComboTilesToRemove = function(tileA, tileB) { //Tile B will be the 'normal' tile, if applicable. Otherwise, it is the tile that was selected first in the switch.
		var tilesToRemove; //list
		if(tileA.index === -1 && tileB.index === -1) { //Combine two chocolate bombs to clear the gamefield.
			tileB.bonuses = [];
			tilesToRemove = _.flatten(gamefield, true);
		} else if(tileA.index === -1 && (_.contains(tileB.bonuses, 'hor') || _.contains(tileB.bonuses, 'ver'))) { //Combine a chocolate bomb with a striped candy to transmute and clear that colour from the gamefield.
			tilesToRemove = [tileA]; //We'll remove tileB in the following filter for matching tiles (It'll match itself.)
			gamefield.map(function(column) {
				tilesToRemove = tilesToRemove.concat(column.filter(function(tile) {
					return tile.index === tileB.index;
				}).map(function(tile) {
						tile.remove(true);
						var bonus = Math.random() < 0.5 ? "hor" : "ver";
						tile = getNewTile(tile.tileX, tile.tileY, bonus, tile.index);
						tile.bonuses = [bonus];
						gamefield[tile.tileX][tile.tileY] = tile;
						return tile;
				}));
			});
			return tilesToRemove;
		} else if(tileA.index === -1) { //Combine a chocolate bomb with a candy to clear that colour from the gamefield.
			tilesToRemove = [tileA]; //We'll remove tileB in the following filter for matching tiles (It'll match itself.)
			gamefield.map(function(column) {
				tilesToRemove = tilesToRemove.concat(column.filter(function(tile) {
					return tile.index === tileB.index;
				}));
			});
			return tilesToRemove;
		} else if ((_.contains(tileA.bonuses, 'hor') || _.contains(tileA.bonuses, 'ver')) && _.contains(tileB.bonuses, 'point') || (_.contains(tileB.bonuses, 'hor') || _.contains(tileB.bonuses, 'ver')) && _.contains(tileA.bonuses, 'point') ) { //Combining a striped candy and a wrapped candy produce a big explosion!
			tileB.bonuses = ['giant'];
			tileA.bonuses = [];
			tilesToRemove = _.flatten(gamefield, true)
				.filter(function(tile) {
					return Math.abs(tile.tileX - tileB.tileX) < 2 ||Math.abs(tile.tileY - tileB.tileY) < 2;
				});
		} else if(_.contains(tileA.bonuses, 'hor') && _.contains(tileB.bonuses, 'hor') || _.contains(tileA.bonuses, 'ver') && _.contains(tileB.bonuses, 'ver')) {
			tileA.bonuses = [];
			tileB.bonuses = ['ver', 'hor'];
			tilesToRemove = [tileA, tileB];
		} else {
			tilesToRemove = [tileA, tileB]; //Default is to allow tiles to be removed... right?
		}
		return tilesToRemove;
	};
	
	var fallSpeed = 400000;
	var fallTiles = function(callback) {
		var tweenCount = 0;
		var scoreDelta = 0;
		_.range(xTiles).map(function(x) { //Tiles falling down to fill gaps left by replaced tiles.
			_.range(yTiles-1, -1, -1).map(function(y) {
				var tile = gamefield[x][y];
				if(tile) {
					var newY = gamefield[x].lastIndexOf(null);
					if(newY > y) {
						tweenCount += 1;
						createjs.Tween.get(tile)
						.to(
							{y:tile.yFromTile(newY)},
							Math.sqrt(Math.abs(tile.tileY-newY)*fallSpeed), //Maybe add 50*tile here, to add in a bit of inital inertia simulation. Break up blocks falling down on top of other falling blocks a bit.
							createjs.Ease.bounceOut) //bounceOut also works nicely here, but it's a bit distracting.
						.call(function() {
							tweenCount -= 1;
							if(tweenCount === 0) {
								if(callback) callback();
								tweenCount -= 1;
							}
						});
						tile.tileY = newY;
						gamefield[x][y] = null;
						gamefield[tile.tileX][tile.tileY] = tile;
					}
				}
			});
			
			var lastY = gamefield[x].lastIndexOf(null)+1; //Tiles added to replace tiles matched.
			scoreDelta += Math.floor(lastY * 40 * (matchesMadeThisMove/2+1));
			
			_.range(0, lastY).map(function(y) {
				var tile = getNewTile(x, y, undefined, _.random(numTileTypes)); //Specify false, random number to allow matches to be made by sheer chance, I think.
				gamefield[x][y] = tile;
				var targetY = tile.y;
				tile.y -= lastY*tileHeight;
				tweenCount += 1;
				createjs.Tween.get(tile)
					.to(
						{y:targetY},
						Math.sqrt(Math.abs(lastY)*fallSpeed),
						createjs.Ease.bounceOut)
					.call(function() {
						tweenCount -= 1;
						if(tweenCount === 0) {
							if(callback) callback();
							tweenCount -= 1;
						}
					});
			});
		});
		
		score.add(scoreDelta);
		if(tweenCount === 0 && callback) callback();
	};
	
	
	var searchForMatches = function () {
		var matchesFound = _
			.flatten(
				makeField().map(function(column, x) {
					return column.map(function(row, y) { //We scan for intersection bonuses first because we wouldn't want to miss one because a line bonus had already spoken for it. (Only when the first tile was ⇱ would the intersection be counted.)
						var target = gamefield[x][y];
						if(target) {
							var hline = linesInDir(target, 'h');
							var vline = linesInDir(target, 'v');
							if(hline.length > 1 && vline.length > 1) {
								[].concat(target, hline, vline).map(function(tile) {tile.searchForMatchesMatched=true;} );
								return [target, [hline, vline]];
							}
						}
					});
				}),
				true)
			.filter(function(potMatch) {return potMatch;})
			.concat(
				_.flatten(
					makeField().map(function(column, x) {
						return column.map(function(row, y) {
							var target = gamefield[x][y];
							if(target && !target.searchForMatchesMatched) {
								var hline = linesInDir(target, 'h');
								var vline = linesInDir(target, 'v');
								[].concat(target, hline, vline).map(function(tile) {tile.searchForMatchesMatched=true;} );
								if(hline.length > 1) return [target, [hline, []]];
								if(vline.length > 1) return [target, [[], vline]];
							}
						});
					}),
					true)
				.filter(function(potMatch) {return potMatch;}));
		
		gamefield.map(function(row) {
			row.map(function(tile) {
				delete tile.searchForMatchesMatched;
			});
		});
		
		return matchesFound;
	};
	
	var tilesAreAdjacent = function(a,b) {
		return a && b &&
		1 === _.reduce([
				Math.abs(a.tileX - b.tileX), //We sum both x and y distance to make sure we didn't go kitty-corner (or worse).
				Math.abs(a.tileY - b.tileY)
			], function(a,b) {return a+b;}, 0);
	};


	var swallowMouseEvent = function(evt) {
		// mouseX = evt.stageX; mouseY = evt.stageY;
		evt.nativeEvent.preventDefault();
		evt.nativeEvent.stopPropagation();
		//evt.nativeEvent.stopImmediatePropagation();
		return false;
	};
	
	
	var checkForPotentialMatches = function() {
		var getPotentialMatches = function() {
			//First, look for adjacent bonus tiles. (We want to hint these preferentially, since it'll already be rare that the user will put two side-by-side.)
			var bonusTiles = false;
			var potBonusTiles = _.flatten(
				gamefield.map(function(column) {
					return column.filter(function(tile) {
						return tile.isBonus;
					});
				}),
				true);
			_.find(potBonusTiles, function(tile, index) {
				if(potBonusTiles.length - index < 2) return false;
				return _.find(potBonusTiles.slice(index+1, potBonusTiles.length), function(matchTile) {
					var isMatch = tilesAreAdjacent(tile, matchTile);
					if(isMatch) bonusTiles = [tile, matchTile];
					return isMatch;
				});
			});
			if(bonusTiles) return bonusTiles;
			
			//If we don't have any bonus tiles side-by-side, then we'll look for normal tiles in a pattern that could be made into a match of three. Matches are defined in the init section, below.
			var order = _(_.range(numTileTypes+1)).shuffle();
			var foundObjects = false;
			_.find(order, function(targetTileType) {
				return _(_.shuffle(potentialMatches)) //This way, we'll look for different potential matches each time and educate our player.
					.find(function(matchMask) {
						//Arrays might not be zero-indexed, but start at 1 instead.
						var mmLength = matchMask.length;
						var mmHeight = matchMask[0].length;
						
						_.find(_.range(xTiles-mmLength), function(xOffset) {
							_.find(_.range(yTiles-mmHeight), function(yOffset) {
								var cluster = _.flatten(
									gamefield
										.slice(xOffset,xOffset+mmLength)
										.map(function(column, colCount) {
											return column
											.slice(yOffset, yOffset+mmHeight)
											.filter(function(tile, rowCount) {
												return matchMask[colCount][rowCount] === 1;// || matchMask[colCount][rowCount] === 2 && tile.isBonus;
											});
										}),
									true);
								var clusterPassed =
								(undefined === _.find(_.pluck(cluster, 'index'), function(index) {
									return index != targetTileType;
								}));
								if(clusterPassed) foundObjects = cluster;
								return foundObjects;
							});
							return foundObjects;
						});
						return foundObjects;
					});
				});
			return foundObjects;
		};
		
		return function () {
			if(hintBounce.id !== 0) {
				console.warn("hintBounce.id is " + hintBounce.id + ", must be 0. An existing function may already be scheduled, and must be cleared first.");
				throw "uncleared hintBounce.id";
			}
			var matches = getPotentialMatches();
			
			if(matches) {
				hintBounce.id = window.setTimeout(function() {
					highlightPotentialMatches(matches);
					hintBounce.tiles = matches;
				}, hintBounce.timeout);
			} else {
				var conf = window.confirm('No more matches can be made. Shall I shuffle the board?');
				if(conf) {
					gamefield = _.shuffle(gamefield).map(function(column) { //Not a /good/ shuffle, but given the number of times the player will encounter it it shouldn't matter.
						return _.shuffle(column);
					});
				} else {
					window.alert("The previous dialog will pop up in half a minute if you can't find a match.");
					hintBounce.id = window.setTimeout(checkForPotentialMatches, 30000); //30 seconds
				}
				return 0;
			}
		};
	}();
	
	
	var highlightingPotentialMatches = false;
	var highlightPotentialMatches = function(matches) {
		if(!matches) {
			matches = hintBounce.tiles;
			if(!matches.length) {
				checkForPotentialMatches();
			}
		}
		if(highlightingPotentialMatches === false) {
			if(noInput) {
				hintBounce.tiles = matches;
				hintBounce.id = window.setTimeout(highlightPotentialMatches, 1000);
				return;
			}
			highlightingPotentialMatches = true;
			matches.map(function(tile) {
				if(!createjs.Tween.hasActiveTweens(tile)) {
					tile.regX = tile.regX || 0;           tile.regY = tile.regY || 0;	//This seems to be getting undefined somewhere.
					tile.regXBeforeHighlight = tile.regX; tile.regYBeforeHighlight = tile.regY;
					tile.regX += tileWidth / 2;           tile.regY += tileHeight;
					tile.x += tileWidth / 2;              tile.y += tileHeight;
					
					var targetY = tile.regY;
					var tween = createjs.Tween.get(tile, {loop:true})
						.to(
							{scaleX:1.15, scaleY:0.85},
							200,
							createjs.Ease.sineOut)
						.to(
							{scaleX:1.0, scaleY:1.0},
							200,
							createjs.Ease.sineIn)
						.to(
							{regY: tile.regY+6},
							175,
							createjs.Ease.sineOut)
						.to(
							{regY: tile.regY},
							175,
							createjs.Ease.sineIn);
					//tile.tween = tween; //[BOUNCE]
				} else {
					console.log('Skipped doing bounce; object already had tween.');
				}
			});
		}
	};
	
	
	var stopHighlightingMatches = function() {
		//if(highlightingPotentialMatches === true) {
			highlightingPotentialMatches = false;
			hintBounce.tiles.map(function(tile) {
				//tile.tween.loop = false; //[BOUNCE] We have to end this here-and-now, because it will conflict with the switching animation otherwise.
				createjs.Tween.removeTweens(tile);
				tile.regX = tile.regXBeforeHighlight; tile.regY = tile.regYBeforeHighlight;
				delete tile.regXBeforeHighlight;      delete tile.regYBeforeHighlight;
				tile.x = tile.xFromTile();            tile.y = tile.yFromTile();
				tile.scaleX = 1; tile.scaleY = 1;
				//delete tile.tween; //[BOUNCE]
			});
			window.clearTimeout(hintBounce.id);
			hintBounce.id = 0;
		//}
	};
	
	
	var stopFutureMatchHighlight = function() {
		hintBounce.tiles = [];
		window.clearTimeout(hintBounce.id);
		hintBounce.id = 0;
	};
	
	
	var sugarRush = false;
	sugarRush = function() {
		sugarRush = false;
		var bonusTiles = _.flatten(gamefield, true).filter(function(tile) {
			return tile.isBonus;
		});
		if(!!_.head(bonusTiles)) {
			drawBigOverlay('Sugar Rush', Width/2, Height/2, 100, ["#F8DB63", "#CF8A09"]);
			removeMatches(bonusTiles, true);
		} else {
			runGameOver();
		}
	};
	
	
	var runGameOvers = function() {
		paused = true;
		createjs.Ticker.setPaused(true);
		gameStatus.set('finished');
		window.setTimeout(function(){
			window.alert("Game Over.\nYour score is " + score.value() + " points!");
		}, 100);
	};
	var runGameOver = _.once(runGameOvers);
	
	
	var drawText = function (displayText, x, y, size, gradientColours) { //Returns a jQuery object for the DOM object created.
		var vPad = size/4;
		var tailDepth = size/4;
		var outlineSize = size/(100/7.5);
		var position = $(canvas).offset();
		var jCanvas = $("<canvas>");
		
		if(jCanvas[0].getContext) {
			var gfx = jCanvas[0].getContext('2d');
			gfx.font = size+'pt candy';
			var textWidth = gfx.measureText(displayText).width + size/4 + outlineSize*2;
			var textHeight = size+vPad*2+tailDepth;
			jCanvas
				.attr({'width':textWidth,'height':textHeight})
				.addClass('gameTextOverlay')
				.css({
					"position": "absolute",
					//"background": "yellow",
					"transform": "translate("+(-textWidth/2+x)+"px, "+(-textHeight/2+y)+"px)"
				})
				.css(position);
				
			gfx.font = size+'pt candy';
			gfx.lineCap = 'round';
			gfx.lineWidth = outlineSize*2+2; //Thin black outline. Makes it pop.
			gfx.strokeStyle = '#000000';
			gfx.strokeText(displayText,  outlineSize, size+vPad);
			gfx.lineWidth = outlineSize*2; //Brown outline.
			gfx.strokeStyle = '#391A00';
			gfx.strokeText(displayText,  outlineSize, size+vPad);
			var gradient = gfx.createLinearGradient(0, vPad, 0, vPad+size+tailDepth); //Fill the interior of the text with a gradient.
			gradient.addColorStop(0, gradientColours[0]);
			gradient.addColorStop(1, gradientColours[1]);
			gfx.fillStyle=gradient;
			gfx.fillText(displayText, outlineSize, size+vPad);
			gfx.lineWidth = outlineSize/2; //Draw an outline of white to make it 'glow'.
			gfx.strokeStyle = 'rgba(255,255,255,0.1)';
			gfx.strokeText(displayText,  outlineSize, size+vPad);
			gfx.lineWidth = outlineSize/3; //Glows should be brighter near the center, so draw a thinner outline of white.
			gfx.strokeText(displayText,  outlineSize, size+vPad);
			
			jCanvas.appendTo("body");
			return jCanvas;
		} else {
			var averageColour = averageRGB(gradientColours[0],gradientColours[1]);
			var jPar = $("<p>"); //For IE8.
			jPar.text(displayText)
				.addClass('gameTextOverlay')
				.css({
					"font-size": size,
					"position": "absolute",
					"color": "#"+averageColour,
					/*"background": "yellow",*/
					"font-family": "comic sans ms",
					"filter": "glow(color=391A00,strength="+size/10+")"
				})
				.appendTo("body")
				.offset({
					left: position.left + x - jPar.width()/2,
					top: position.top + y - jPar.height()/2 });
			return jPar;
		}
	};
	
	
	var drawTileScore = function() {
		var text = drawText.apply(null, arguments);
		text
			.hide()
			.fadeIn()
			.delay(50)
			.fadeOut()
			.queue(function() {
				text.remove();
			});
		if(text.css('transform')) { //Graceful degradation! Might be undefined in older browsers.
			var matrixToArray = function(mString) {
				var matrix = function() {return arguments;};
				return eval(mString);
			};
			var textY = matrixToArray(text.css('transform'))[5];
		}
	};
	
	var drawBigOverlay = function() {
		var text = drawText.apply(null, arguments);
		text
			.hide()
			.fadeIn()
			.delay(750)
			.fadeOut()
			.queue(function() {
				text.remove();
			});
	};
	
	
	
	
	
	
// →→→ Initial Setup ←←←
	var canvas = document.getElementById('main');
	
	var stage = new createjs.Stage(canvas);
	stage.snapToPixel = true;
	stage.enableMouseOver();
	if(createjs.Touch) {
		createjs.Touch.enable(stage, true); //'True' here disables multi-touch. Good.
	}
	createjs.Ticker.addListener(stage);
	
	var spriteSheetB = new createjs.Bitmap("images/CC_Grid_Sprite_Sheet_v2.png");
	
	var tileSourceRects = { //sourceRect is not cloned when we clone the bitmap. We must define sourceRects instead of bitmaps.
		normal: [
			new createjs.Rectangle(  0,  5, 71, 63),
			new createjs.Rectangle( 72,  5, 71, 63),
			new createjs.Rectangle(144,  5, 71, 63),
			new createjs.Rectangle(216,  5, 71, 63),
			new createjs.Rectangle(288,  5, 71, 63),
			new createjs.Rectangle(360,  5, 71, 63) ],
		ver: [
			new createjs.Rectangle(432,  5, 71, 63),
			new createjs.Rectangle(504,  5, 71, 63),
			new createjs.Rectangle(576,  5, 71, 63),
			new createjs.Rectangle(648,  5, 71, 63),
			new createjs.Rectangle(720,  5, 71, 63),
			new createjs.Rectangle(792,  5, 71, 63) ],
		hor: [
			new createjs.Rectangle(864,  5, 71, 63),
			new createjs.Rectangle(936,  5, 71, 63),
			new createjs.Rectangle(  0, 76, 71, 63),
			new createjs.Rectangle( 72, 76, 71, 63),
			new createjs.Rectangle(144, 76, 71, 63),
			new createjs.Rectangle(216, 76, 71, 63) ],
		point: [
			new createjs.Rectangle(288, 76, 71, 63),
			new createjs.Rectangle(360, 76, 71, 63),
			new createjs.Rectangle(432, 76, 71, 63),
			new createjs.Rectangle(504, 76, 71, 63),
			new createjs.Rectangle(576, 76, 71, 63),
			new createjs.Rectangle(648, 76, 71, 63) ],
		like: [ //Offset this to 147. (+3)
			new createjs.Rectangle(721, 73, 71, 69),
			new createjs.Rectangle(721, 73, 71, 69),
			new createjs.Rectangle(721, 73, 71, 69),
			new createjs.Rectangle(721, 73, 71, 69),
			new createjs.Rectangle(721, 73, 71, 69),
			new createjs.Rectangle(721, 73, 71, 69) ]
		};
	
	if(numTileTypes < 3) {
		console.warn('You have specified fewer than four tile types via iTiles. This pretty much guarantees that a board with fewer than three similar tile types in a row can\'t be generated. Instead of recursing to death, an error will be thrown now to save you a few moments.'); //Three will work... for a while, at least. Two just crashes when we try to generate the board.
		throw "too few tiles";
	}
	
	var Width = canvas.width;                 var Height = canvas.height;
	var tileWidth = 71;                       var tileHeight = 63;
	var xTiles = Math.floor(Width/tileWidth); var yTiles = Math.floor(Height/tileHeight);
	
	// var mouseX = 0; var mouseY = 0;
	var selectedObject = null;
	var selectionIndicator = null;
	
	var numTileTypes = (typeof iTiles !== 'undefined' && iTiles || 6) - 1;
	var mode = typeof iMode !== 'undefined' && iMode || 'turns'; //turns, time
	
	var matchesMadeThisMove = 0; //Reset to 1 elsewhere too.
	var score = watchableCounter(
		typeof iScore !== 'undefined' && iScore || 0);
	var remainingTiles = watchableCounter(
		typeof iMoves !== 'undefined' && iMoves || 15);
	var remainingTime = watchableCounter(
		typeof iTime !== 'undefined' && iTime || 180);
	
	var jelly = typeof iJelly !== 'undefined' && !!iJelly || false;
	
	var gameStatus = watchableCounter('playing'); //playing, finished
	delete gameStatus.add; //Can't 'add' to the game status as it's a string; use set instead.
	
	if(isFL) stage.addChild(new createjs.Bitmap("images/CC_Gameboard_2.png")); //Re-add the background, as it seems flash can't have a CSS background image.
	var jellyContainer = new createjs.Container();   stage.addChild(jellyContainer); //global zorders
	var tileContainer = new createjs.Container();    stage.addChild(tileContainer);
	var effectContainer = new createjs.Container();  stage.addChild(effectContainer);
	var overlayContainer = new createjs.Container(); stage.addChild(overlayContainer);
	
	var gamefield = makeField();
	gamefield.map(function(row, row_count) {
		row.map(function(tile, column_count) {
			gamefield[row_count][column_count] = getNewTile(row_count, column_count);
		});
	});
	
	if(jelly) {
		var jellyfield = makeField();
		jellyfield.map(function(row, row_count) {
			row.map(function(tile, column_count) {
				jellyfield[row_count][column_count] = getNewJellyTile(row_count, column_count);
			});
		});
	}
	
	var paused = false;
	var noInput = false;	//We'll set this to true when we're animating the board, so that we don't select objects that get removed accidentally.
	var noSwitch = false;
	
	var potentialMatches = function(unrotatedMatches) {
		var twist = function(match) {
			var newMatch = [];
			match.map(function(column, x) {
				column.map(function(num, y) {
					y = column.length-y;
					newMatch[y] = newMatch[y] ? newMatch[y] : [];
					newMatch[y][x] = num;
				});
			});
			return newMatch;
		};
		
		var matches = [];
		unrotatedMatches.map(function(match) {
			matches.push(match);
			_.range(3).map(function() {
				match = twist(match); matches.push(match);
			});
		});
		return matches;
	}([ [ //1 = all tiles, 2 = bonus tiles
			[1,1,0,1]
		], [
			[1,1,0],
			[0,0,1]
		], [
			[0,0,1],
			[1,1,0]
		], [
			[1,0,1],
			[0,1,0]
		] ])
	.map(function(matchBlock) { //The rotation bit seems to be offsetting by 1 sometimes. Trim undefined first elements.
		if(matchBlock[0] === undefined) matchBlock = _.tail(matchBlock);
		return matchBlock.map(function(matchLine) {
			if(matchLine[0] === undefined) matchLine = _.tail(matchLine);
			return matchLine;
		});
	});
	
	/* //Cleaner debugging info.
	potentialMatches.map(function(match, index) {
		console.log(index + ':');
		match.map(function(match) {
			console.log(match.map(function(a) {
				return a ? '▓' : '░';
			}).reduce(function(a,b) {
				return a + b;
			}));
		});
	});
	*/
	
	var hintBounce = {
		timeout: 4000,
		id: 0,
		tiles: [],
	};
	checkForPotentialMatches();
	
	if(mode === 'time') {
		var numSeconds = remainingTime.value();
		_.range(1, numSeconds).map(function(passed) {
			window.setTimeout(function() {
				remainingTime.set(numSeconds-passed);
			}, passed*1000);
		});
		window.setTimeout(function() {
			remainingTime.set(0);
			runGameOver();
		}, numSeconds*1000);
	}
	
	
	
	
// →→→ EVENTS ←←←
	var isRightButton = function(which) { //Takes a mouse button, returns true if it's the one we accept input from. (0 if on tablet, 1 if on computer) This assumes a touch-enabled device won't accept mouse input, which might be a dangerous assumption.
		return createjs.Touch.isSupported() ? which === 0 : which === 1;
	};
	
	
	var selectObject = function(tile) {
		if(selectedObject !== tile) {
			selectedObject = tile;
			if(selectionIndicator) {
				if(tile) {
					selectionIndicator.x = tile.xFromTile();
					selectionIndicator.y = tile.yFromTile();
				} else {
					effectContainer.removeChild(selectionIndicator);
					selectionIndicator = null;
				}
			} else {
				if(tile){
					selectionIndicator = spriteSheetB.clone();
					selectionIndicator.sourceRect = new createjs.Rectangle(936, 73, 71, 71),
					selectionIndicator.regX = -1; selectionIndicator.regY = 4;
					effectContainer.addChild(selectionIndicator);
					selectionIndicator.x = tile.xFromTile();
					selectionIndicator.y = tile.yFromTile();
				}
			}
		}
	};
	

	stage.onClick = function(evt) {
		if(evt.nativeEvent===null) { //No native event? Must be in flash mode.
			stage.onMouseDown(evt);
		}
	};
	
	stage.onMouseDown = function(evt) {
		if(evt.nativeEvent===null || isRightButton(evt.nativeEvent.which)) { //1 is the left mouse button. We won't use right because I think that doesn't play nicely with EaselFL.
			if(canInput()) {
				var overTileX = pixToTile(evt.stageX, tileWidth);
				var overTileY = pixToTile(evt.stageY, tileHeight);
				var newSelectedObject = gamefield[overTileX][overTileY];
				
				//console.log(newSelectedObject);
				
				if(tilesAreAdjacent(newSelectedObject, selectedObject)) {
					if(!noSwitch) {
						switchTiles(newSelectedObject, selectedObject);
						selectObject();
					}
				} else { //We won't deselect if we click on the same tile because it'll play awkwardly with fat fingers double-tapping on touchscreens.
					selectObject(newSelectedObject);
				}
			}
			return swallowMouseEvent(evt);
		}
		
		// Debug code. If we middle-click, it sets the tile to a special.
		/*var overTileX = pixToTile(evt.stageX, tileWidth);
		var overTileY = pixToTile(evt.stageY, tileHeight);
		var oldBonus = gamefield[overTileX][overTileY].bonuses[0];
		var oldBonusIndex = gamefield[overTileX][overTileY].index;
		gamefield[overTileX][overTileY].remove(true);
		switch(oldBonus) {
			case "hor":
				var tile = getNewTile(overTileX, overTileY, "ver", oldBonusIndex);
				tile.bonuses=["ver"];
				break;
			case "ver":
				var tile = getNewTile(overTileX, overTileY, "point", oldBonusIndex);
				tile.bonuses=["point"];
				break;
			case "point":
				var tile = getNewTile(overTileX, overTileY, "like", oldBonusIndex);
				tile.bonuses=["like"];
				tile.index = -1;
				break;
			case "like":
				var tile = getNewTile(overTileX, overTileY);
				tile.bonuses=[];
				break;
			default:
				var tile = getNewTile(overTileX, overTileY, "hor", oldBonusIndex);
				tile.bonuses=["hor"];
				break;
		}
		gamefield[overTileX][overTileY] = tile;*/
	};
	
	
	stage.onMouseMove = function(evt) {
		if(evt.nativeEvent===null || isRightButton(evt.nativeEvent.which)) {
			if(canInput()) {
				var overTileX = pixToTile(evt.stageX, tileWidth);
				var overTileY = pixToTile(evt.stageY, tileHeight);
				var over = gamefield[overTileX][overTileY];
				
				if(tilesAreAdjacent(over, selectedObject)) {
					if(!noSwitch) {
						switchTiles(over, selectedObject);
						selectObject();
					}
				}
			}
			return swallowMouseEvent(evt);
		}
	};
	
	
	return {
		watchScoreWith: score.watchWith,
		watchRemainingTilesWith: remainingTiles.watchWith,
		watchRemainingTimeWith: remainingTime.watchWith,
		watchGameStatus: gameStatus.watchWith,
		mode: function() {return mode;},
	};
};