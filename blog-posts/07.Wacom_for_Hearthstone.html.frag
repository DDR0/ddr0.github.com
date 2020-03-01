<!--published: 2016-10-29, modified: 2016-11-16,
	tags: wacom tech-support hearthstone hack workaround ahk-->
<h2 id="WacomForHearthstone"><a href="~&">Fixing Wacom Tablets for Hearthstone in Windows</a></h2>

<p>As of 2016-10-29, there is some sort of bug with Hearthstone where it will ignore clicks coming from a tablet. A quick search turns up complaints, but no solution:</p>

<ol>
	<li><a href="https://us.battle.net/forums/en/hearthstone/topic/19136283676">Wacom tablet pen support has been removed with patch 3.1.010357</a></li>
	<li><a href="https://eu.battle.net/forums/en/hearthstone/topic/16069796978">can't use mouse pen after update</a></li>
	<li><a href="https://www.reddit.com/r/hearthstone/comments/4843fc/wacom_tablet_not_working_on_hearthstone/">Wacom Tablet not working on Hearthstone</a></li>
</ol>

<p><a href="https://ahkscript.org/">AutoHotKey</a> for Windows has no such issues. And it can send mouse inputs that hearthstone can read… <img class="emote" src="/images/wesnoth%20icons/icon_pensive.gif"> So, we'll make a new AutoHotKey script that clicks the left mouse button when the left mouse button is clicked. After installing AHK, make a new file with Notepad called wacom_echoer.ahk with the following contents:</p>

<!-- Code tag on each line because each line gets padded later in the compiling process too. -->
<div class="code-container">
	<code>;Map the left mouse button to the left mouse button. This makes Hearthstone, among other</code>
	<code>;games, "see" it.</code>
	<code>#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.</code>
	<code>SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.</code>
	<code>SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.</code>
	<code>return</code>
	<code></code>
	<code>LButton::LButton</code>
</div>
<small>Edit: Fixed initial comments.</small>
<small>Edit: It also fixes Cities: Skylines!</small>

<p>Double-click to run. Hearthstone should now work as expected.</p>

<p>I also followed <a href="https://www.volnapc.com/all-posts/how-to-get-rid-of-those-annoying-circles-from-your-wacom-cursor-in-windows-7">these instructions to disable the click rings in Windows</a>.</p>