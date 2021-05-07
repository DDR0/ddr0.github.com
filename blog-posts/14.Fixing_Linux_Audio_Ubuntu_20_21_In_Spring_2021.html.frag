<!--
	published: 2021-05-07,
	tags: linux sound audio fix tech-support workaround,
	desc: When upgrading Ubuntu 20 to 21 this spring\, audio sometimes breaks because of Timidity.,
	title: Fixing Linux Audio\, Spring '21 edition,
-->
<p>When upgrading from Ubuntu 20 to 21 this spring, my father and I both had the rear audio line out on our computers stop working. As we both had the same problem, I figured I would write it up in case anyone else was affected.</p>

<h3>Symptoms</h3>
<ol>
	<li>The original audio device no longer shows up in the list of audio devices.</li>
	<li>The device is not turned off or muted, and cannot be turned on or unmuted, because it doesn't exist any more.</li>
	<li>Other devices (USB headphones, Bluetooth, etc.) still work.</li>
	<li>When no other audio device is attached, a dummy audio device is created.</li>
	<li>The troublesome audio device shows up when running some commands, I think such as <code>pacmd list-sinks</code>.</li>
</ol>

<h3>Confirmation</h3>
<ol>
	<li>Running <code>sudo lsof /dev/snd/*</code> in a console shows Timidity holding open some files.</li>
	<li>Ending the <code>timidity</code> process makes the audio device show up again.</li>
</ol>

<h3>Fix</h3>
<ol>
	<li>Uninstall Timidity using your software manager, or by running <code>sudo apt remove timidity</code>.</li>
</ol>

<p class=noindent>Somewhat surprisingly, this does not seem to affect my ability to play back Midi files. I assume my music program is using Fluidsynth, which is a separate system? Nonetheless, a strange bug caused by a misconfiguration somewhere.</p>