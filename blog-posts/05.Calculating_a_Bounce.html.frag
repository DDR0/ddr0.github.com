<!--
	published: 2015-06-18, modified: 2016-11-16,
	tags: math bounce physics,
	desc: Given a ball and a curved wall\, how do we calculate the angle of the bounce of the ball?,
-->

<div class="no-p-indent">
	<p>Problem: Given a ball and a curved wall, how do we calculate the angle of the bounce of the ball? Assuming we have the normal of the wall at the bounce location, our problem becomes:</p>
	<p>Problem: Given two vectors, x₁ and n, how do we mirror vector x₁ around vector n to get x′? (x₁ is the ball velocity and n is the normal of the wall.)</p>

	<p>Solution: Implement <a href="https://mathworld.wolfram.com/Reflection.html">https://mathworld.wolfram.com/Reflection.html</a> (The first picture is accurate to the situation.)</p>

	<p>As written: x₁′ = -x₁ + 2x₀ + 2n̂[(x₁-x₀)·n̂]</p>

	<p>Given that x₀ is always [0,0], it can be ignored.</p>

	<p>x₁′ = -x₁ + 2n̂[x₁·n̂]</p>

	<p>Given that n is pre-normalized, we can un-hat the ns.</p>

	<p>x₁′ = -x₁ + 2n[x₁·n]</p>

	<p>To calculate the dot product: (from <a href="https://www.mathsisfun.com/algebra/vectors-dot-product.html">https://www.mathsisfun.com/algebra/vectors-dot-product.html</a>)</p>

	<p>x₁′ = -x₁ + 2n[x₁[0]*n[0]+x₁[1]*n[1]]</p>

	<p>Normalize the notation, since we're now using [0] to get the vector components.</p>

	<p>x₁′ = -x₁ + 2*n*(x₁[0]*n[0]+x₁[1]*n[1])</p>

	<p>Now, to calculate both parts of the vector separately:</p>

	<p>x₁[0]′ = -x₁[0] + 2*n[0]*(x₁[0]*n[0]+x₁[1]*n[1])</p>
	<p>x₁[1]′ = -x₁[1] + 2*n[1]*(x₁[0]*n[0]+x₁[1]*n[1])</p>

	<p>Now you can replace the x₁ and n with the variables of your program, and be on your way. For example, in Javascript:
	<div class="code-container">
		<code>//Returns vector v mirrored around the normalized vector mir.</code>
		<code>function vReflectIn(v,mir) { </code>
		<code>	return [</code>
		<code>		-v[0] + 2*mir[0]*(v[0]*mir[0]+v[1]*mir[1]),</code>
		<code>		-v[1] + 2*mir[1]*(v[0]*mir[0]+v[1]*mir[1]),</code>
		<code>	]; </code>
		<code>}</code>
	</div>
</div>