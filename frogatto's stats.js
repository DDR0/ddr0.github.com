function getDataObjectURL() {return "http://theargentlark.com:5000/?version=1.2&level=" + document.getElementById('filename').value + ".cfg"}

function getLevelImageURL() {return "http://theargentlark.com/david/frogatto-level-images/" + document.getElementById('filename').value + ".png"}

function onEnterGraph(e) {if(e.which == 13) graph()}

function graph() {
	//set background image
	document.getElementById("level image").src = getLevelImageURL();
	
	//draw overlying table
	/*jQuery.ajax({
		url: 'http://theargentlark.com:5000/?version=1.2&level=titlescreen.cfg', 
		dataType: 'json',
		type: 'get',
		success: function(msg) {
			alert("it works"); 
		},
	});*/
	msg = [
  {
    "tables": [
      {
        "entries": [
          {
            "key": null,
            "value": {
              "mean": 26,
              "nsamples": 7,
              "sum": 186
            }
          }
        ],
        "name": "sum"
      },
      {
        "entries": [
          {
            "key": 482375297,
            "value": 2
          },
          {
            "key": 2120124826,
            "value": 2
          }
        ],
        "name": "unique_users"
      }
    ],
    "total": 7,
    "type": "load"
  },
  {
    "tables": [
      {
        "entries": [
          {
            "key": [
              16,
              272
            ],
            "value": 1
          },
          {
            "key": [
              80,
              240
            ],
            "value": 2
          },
          {
            "key": [
              176,
              368
            ],
            "value": 1
          },
          {
            "key": [
              176,
              400
            ],
            "value": 1
          },
          {
            "key": [
              176,
              432
            ],
            "value": 1
          },
          {
            "key": [
              208,
              432
            ],
            "value": 1
          },
          {
            "key": [
              240,
              432
            ],
            "value": 1
          },
          {
            "key": [
              304,
              432
            ],
            "value": 2
          },
          {
            "key": [
              336,
              432
            ],
            "value": 9
          },
          {
            "key": [
              368,
              432
            ],
            "value": 1
          },
          {
            "key": [
              400,
              432
            ],
            "value": 7
          },
          {
            "key": [
              432,
              432
            ],
            "value": 35
          },
          {
            "key": [
              464,
              432
            ],
            "value": 3
          },
          {
            "key": [
              496,
              432
            ],
            "value": 1
          },
          {
            "key": [
              528,
              432
            ],
            "value": 1
          },
          {
            "key": [
              560,
              432
            ],
            "value": 2
          },
          {
            "key": [
              592,
              400
            ],
            "value": 2
          },
          {
            "key": [
              592,
              432
            ],
            "value": 1
          },
          {
            "key": [
              624,
              240
            ],
            "value": 1
          },
          {
            "key": [
              624,
              304
            ],
            "value": 1
          },
          {
            "key": [
              624,
              336
            ],
            "value": 1
          },
          {
            "key": [
              624,
              400
            ],
            "value": 1
          },
          {
            "key": [
              656,
              176
            ],
            "value": 3
          },
          {
            "key": [
              656,
              336
            ],
            "value": 1
          },
          {
            "key": [
              656,
              368
            ],
            "value": 1
          },
          {
            "key": [
              688,
              176
            ],
            "value": 1
          },
          {
            "key": [
              688,
              336
            ],
            "value": 1
          },
          {
            "key": [
              688,
              432
            ],
            "value": 2
          },
          {
            "key": [
              720,
              208
            ],
            "value": 1
          },
          {
            "key": [
              720,
              432
            ],
            "value": 8
          },
          {
            "key": [
              752,
              240
            ],
            "value": 1
          }
        ],
        "name": "tile_group"
      }
    ],
    "total": 95,
    "type": "move"
  },
  {
    "tables": [],
    "total": 3,
    "type": "quit"
  }
]
	alert("Note to self:\nGraph " + msg[msg.map(function(oin){return oin.type}).indexOf("move")].total + " things here.");
}