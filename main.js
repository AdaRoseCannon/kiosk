(async function init() {

	const state = new Map(
		// await localforage.getItem('state') ||
		[]
	);
	const prepopulatedIds = Array.from(state.values());
	const unassignedElements = Array.from(document.querySelectorAll('body > [id]')).filter(el => !prepopulatedIds.includes(el.id));

	const fade = [
		[
			// keyframes
			{
				opacity: '1',
			},
			{
				opacity: '0',
			},
		],
		{
			// timing options
			duration: 1000,
		},
	];

	function updateState() {
		const data = Array.from(state.entries());
		localforage.setItem('state', data);
	}

	const probablyRelease = new Set();
	async function midiMessage(msg) {
		const input = msg.currentTarget;
		const device = (input.manufacturer ? input.manufacturer + ', ' : '') + (input.name ? input.name : 'unnamed device');
		const data = msg.data;
		let channel = data[0];
		let release = false;
		const note = data[1];
		const velocity = data[2];
		let type = 'cc';

		// if it's 16 channels lower than an existing channel or if the velocity is 0
		// then it's probably a button release so add 16 to the channel to get the correct button
		// and mark it that it's a button release
		if (probablyRelease.has(channel) || velocity === 0) {
			release = true;
			channel += 16;
		}

		// send type as well - if channel is between certain numbers then it's a pad, if not it's a CC - or something (it's a little bit rudementary but I don't have a better way ya)
		if (channel > 120 && channel < 150) {
			type = 'pad';
		}

		probablyRelease.add(channel - 16);

		const key = `${device}: ${type}, channel: ${channel}, note: ${note}`;
		console.log(key);

		const el = (state.has(key) && document.getElementById(state.get(key))) || unassignedElements.shift();

		if (!el) return;

		state.set(key, el.id);
		updateState();

		el.getAnimations().map(animation => animation.cancel());

		if (!release) {
			el.style.display = 'block';
			if (el.adaAnimation) {
				const anim = el.animate(...el.adaAnimation);
				await anim.finished.catch(e => console.log(e));
			}

			if (el.adaFunctionIn) {
				el.adaFunctionIn();
			}
		}

		if (release) {
			if (el.adaExitAnimation) {
				const exitAnim = el.animate(...(el.adaExitAnimation));
				await exitAnim.finished.catch(e => console.log(e));
				el.style.display = 'none';
			} else if (el.adaFunctionOut) {
				el.adaFunctionOut();
				return;
			} else {
				el.style.display = 'none';
			}
		}
	}

	const access = await navigator.requestMIDIAccess({
		sysex: false
	});

	// Get lists of available MIDI controllers
	const inputs = access.inputs.values();
	// const outputs = access.outputs.values();

	for (const input of inputs) {
		input.onmidimessage = midiMessage;
	}

	access.onstatechange = function (e) {

		// Print information about the (dis)connected MIDI controller
		console.log(e.port.name, e.port.manufacturer, e.port.state);
	};

}())
	.catch(e => console.log(e));
