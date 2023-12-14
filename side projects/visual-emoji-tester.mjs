// This project is made available under a Creative Commons 
// Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA)
// by David Roberts.
// 
// Detect if a sequence of codepoints is an emoji-ish thing. For example, 👪 is 
// an emoji. Is 👪̀ (with a combining character) is also an emoji? We say, eh, 
// sure, why not. It works like one.
// 
// The way this works is that we check to see how long the "emoji" is when we
// draw it. If it's too narrow or too wide,  draw the emoji to a canvas, and then see if 
// the canvas has only one blob after. If it's colourful, ie, a colour emoji font 
// is being used, we're cooking.
// 
// If this works, colourEmojiSupported is true. If not, isEmoji() will always 
// be false.

const greyscaleEmojiExceptions = ['🍴']

const defaultCanvas = new OffscreenCanvas(127, 127)
const defaultFont = defaultCanvas.getContext('2d').font

let maybeEnvironmentHasEmoji = false;

export const isEmoji = Object.freeze(config => {
	if (typeof config === "string") config = {string: config}
	const {string, canvas, font} = {canvas: defaultCanvas, font: defaultFont, ...config}
	if (typeof string !== "string" || typeof canvas !== "object" || typeof font !== "string")
		throw new Error("Missing string arg. Usage: isOneEmoji([string | {string emoji, any canvas, string font}])")
	
	// A few emoji aren't commonly coloured.
	if (maybeEnvironmentHasEmoji && greyscaleEmojiExceptions.includes(string)) return true
	
	const ctx = canvas.getContext('2d')
	ctx.reset()
	ctx.willReadFrequently = true
	
	
	const fontSize = parseInt(font)
	if (!fontSize) throw new Error("Invalid font, unknown size.")
	
	const width = fontSize; //some emoji can be very wide - maybe check if this needs enlarging?
	const height = fontSize;
	ctx.font = font
	if (canvas.width < width) throw new Error(`Canvas width must be at least ${width}px wide to test a ${fontSize}px font.`)
	if (canvas.height < height) throw new Error(`Canvas width must be at least ${height}px tall to test a ${fontSize}px font.`)
	ctx.letterSpacing = `${fontSize*5}px` //leave a very wide gutter between glyphs
	
	//Check amount of codepoints are at least mildly in the ballpark.
	if (string.length === 0 || string.length >= 64) return false
	
	//Check length is at least mildly in the ballpark.
	//Narrow combinations like "ii" will be detected because of the very large letterSpacing we've set between them.
	//Emojis which don't have a combined glyph form, because of lack of font support, won't get this extra space - but since emojis are generally sized the same, we should be able to detect this by checking if our glyph is double-wide. This is left as lax as possible, since some systems render some emojis - primarily a composed family - wider than the standard square emoji shape.
	const standardEmojiWidth = ctx.measureText('😎').width
	if (ctx.measureText(string).width > standardEmojiWidth*1.1) return false //originally 1.9, but the two-conjoined-emoji test yields very narrow results
	
	ctx.imageSmoothingEnabled = false
	ctx.clearRect(0, 0, fontSize, fontSize)
	
	//Draw the suspected emoji sequence to canvas. With the kerning set to 2 characters, this should result in really well defined islands of colour.
	ctx.fillText(string, 0, fontSize)
	
	//Read the resulting characters out, visually.
	const {data} = ctx.getImageData(0, 0, fontSize, fontSize)
	
	const defaultPixelValue = new Uint8ClampedArray(0,0,0,0)
	const getPixelValue = (x,y) => { //yields a colour
		const index = (x + (y*fontSize)) * 4 //4 for each of rgba
		if (index < 0 || index >= data.length) return defaultPixelValue
		return data.slice(index, index+4)
	}
	
	const colourIsOpaqueAndTinted = colour => {
		return (colour[3] === 255) && (
			(Math.abs(colour[0] - colour[1]) > 2) ||
			(Math.abs(colour[1] - colour[2]) > 2) ||
			(Math.abs(colour[2] - colour[0]) > 2)
		)
	}
	
	for (let i = 0; i < fontSize; i++)
		if (colourIsOpaqueAndTinted(getPixelValue(i,i)))
			return true
	return false
})

export const environmentHasEmoji = maybeEnvironmentHasEmoji = isEmoji('😎') //test a known-good value
