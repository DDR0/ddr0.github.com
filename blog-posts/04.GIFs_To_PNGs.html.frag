<!--published: 2015-05-07, modified: 2015-05-14,
	tags: command-line example imagemagick gif png conversion-->
<h2><a href="~&">Batch Converting Gif Animations to Spritesheets with ImageMagick</a></h2>

<p>During some recent work on the <a href="http://www.pixeljoint.com/2015/01/21/4521/Open_Pixel_Platformer_is_back.htm">Open Pixel Platformer</a>, I had many .gif animations which I needed to make into spritesheets. To convert them all, I wrote a Bash script to automate the task.</p>

<!-- Code tag on each line because each line gets padded later in the compiling process too. -->
<div class="code-container">
	<code>gifs=`find . -iname '*.gif'`</code>
	<code>echo "Queuing $(echo "$gifs" | wc -l) gif animations to be converted to png spritesheets. Queued images may take a while to process in the background."</code>
	<code>echo "$gifs" | while read gif; do</code>
	<code>    png=${gif/.gif/.png} #convert *.gif filename to *.png filename.</code>
	<code>    #echo queued "$gif"</code>
	<code>    </code>
	<code>    # Explanation of montage command:</code>
	<code>    # "$gif" \</code>
	<code>    # -tile x1 -geometry +0+0 \ #Set up the tiles.</code>
	<code>    # -border 1 -bordercolor \#F9303D -compose src -define 'compose:outside-overlay=false' \ #Draw a 1-px red border around the image, so it's easier to find frames. -compose is needed to make the border not fill in the transparent pixels in the image, and -define is needed to make the -compose not erease the previous gif frames we're compositing as we draw each subsequent one.</code>
	<code>    # -background "rgba(0, 0, 0, 0.0)" \ #Set the background to stay transparent, as opposed to white. (-alpha On seems to have no effect)</code>
	<code>    # -quality 100 \ #The default quality is 92, but since we're dealing with pixel art we want the fidelity.</code>
	<code>    # "$png" & #Run all the conversions in parallel, let the OS figure out scheduling. Replace with something smarter if things start lagging too much.</code>
	<code>    </code>
	<code>    montage \</code>
	<code>        "$gif" \</code>
	<code>        -tile x1 -geometry +0+0 \</code>
	<code>        -border 1 -bordercolor \#F9303D -compose src -define 'compose:outside-overlay=false' \</code>
	<code>        -background "rgba(0, 0, 0, 0.0)" \</code>
	<code>        -quality 100 \</code>
	<code>        "$png" &</code>
	<code>done</code>
</div>
<span>View on <a href="https://github.com/DDR0/open_pixel_platformer/blob/d3b71ce7a5c8eea2fa43edeaef487bd870de1c29/images/google%20drive/animationToSpritesheet.zsh">Github</a></span><br>
<p>The script loops over any gifs found, and runs ImageMagick's <code>montage</code> on them to convert them to a png spritesheet. The output takes into account transparency of the original image and draws a border around each frame so you can easily find the right dimensions. To use the script, run it in the root folder containing everything you want to convert. The script should work in Bash on Mac or Linux if Imagemagick is installed, but it will not work on Windows.</p>