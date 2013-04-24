// Expects input as 'nnnnnn' where each nn is a
// 2 character hex number for an RGB color value
// e.g. #3f33c6
// Returns the average as a hex number without leading #
var averageRGB = (function () {

  // Keep helper stuff in closures
  var reSegment = /[\da-z]{2}/gi;

  // If speed matters, put these in for loop below
  function dec2hex(v) {return v.toString(16);}
  function hex2dec(v) {return parseInt(v,16);}

  return function (c1, c2) {

    // Split into parts
    var b1 = c1.match(reSegment);
    var b2 = c2.match(reSegment);
    var t, c = [];

    // Average each set of hex numbers going via dec
    // always rounds down
    for (var i=b1.length; i;) {
      t = dec2hex( (hex2dec(b1[--i]) + hex2dec(b2[i])) >> 1 );

      // Add leading zero if only one character
      c[i] = t.length == 2? '' + t : '0' + t;
    }
    return  c.join('');
  };
}());

//From http://stackoverflow.com/questions/6367010/average-2-hex-colors-together-in-javascript