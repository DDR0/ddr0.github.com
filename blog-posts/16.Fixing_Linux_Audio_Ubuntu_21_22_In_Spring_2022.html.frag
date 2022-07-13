<!--
	published: 2022-05-15,
	tags: linux sound audio fix tech-support,
	desc: When upgrading Ubuntu 21 to 22 this spring\, audio through Pipewire was broken.,
	title: Fixing Linux Audio\, Spring '22 edition,
-->
<p class=noindent>When upgrading from Ubuntu 21 to 22 this spring, I encountered two separate issues:</p>
<ol>
	<li>KDE would not show any audio devices in the task bar, under the speaker icon, which appeared muted.</li>
	<li>After fixing that, my bluetooth headphones would connect but immediately disconnect, announcing pairing failed.</li>
</ol>

<p class=noindent>To fix the first issue, I had to enable Pipewire. It had been installed, but not turned on.</p>

<code>systemctl --user --now enable pipewire pipewire-pulse</code>

<p class=noindent>It seems that Pipewire has now replaced ALSA, which was the previous sound system.</p>

<p class=noindent>Interestingly enough, it seems Pipewire is now also responsible for Bluetooth! To fix my wireless headphones not connecting, I had to install Pipewire's bluetooth module. From <a href="https://www.reddit.com/r/linuxquestions/comments/led200/bluetooth_headset_wont_connect_after_installing/">Reddit</a>:</p>

<code style="white-space: pre-line;">sudo apt install libspa-0.2-bluetooth
systemctl --user restart pipewire.service pipewire-pulse.service</code>

<p class=noindent>And now I can listen to my music again.</p>