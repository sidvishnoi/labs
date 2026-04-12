import rough from 'roughjs';

const svgMain = document.getElementById('svgMain');
const svgIframe = document.getElementById('svgIframe');
const rcMain = rough.svg(svgMain);
const rcIframe = rough.svg(svgIframe);

const groups = [
	{
		idx: 0,
		type: 'main',
		x: 10,
		y: 10,
		w: 300,
		h: 250,
		label: 'Main Website',
		links: [
			{
				idx: 0,
				x: 30,
				y: 60 + 40 * 0,
				w: 260,
				h: 30,
				label: '<link href="/walletA" rel="monetization">',
			},
			{
				idx: 1,
				x: 30,
				y: 60 + 40 * 1,
				w: 260,
				h: 30,
				label: '<link href="/walletB" rel="monetization">',
			},
			{
				idx: 2,
				x: 30,
				y: 60 + 40 * 2,
				w: 260,
				h: 30,
				label: '<link href="/walletC" rel="monetization">',
			},
			{
				idx: 3,
				x: 30,
				y: 60 + 40 * 3,
				w: 260,
				h: 30,
				label: '<link href="/walletD" rel="monetization">',
			},
		],
	},
	{
		idx: 1,
		type: 'iframe',
		x: 10,
		y: 10,
		w: 300,
		h: 130,
		label: 'Iframe 1',
		links: [
			{
				idx: 0,
				x: 30,
				y: 60 + 40 * 0,
				w: 300 - 20 * 2,
				h: 30,
				label: '<link href="/walletAi1" rel="monetization">',
			},
			{
				idx: 1,
				x: 30,
				y: 60 + 40 * 1,
				w: 300 - 20 * 2,
				h: 30,
				label: '<link href="/walletBi1" rel="monetization">',
			},
		],
	},
	{
		idx: 2,
		type: 'iframe',
		x: 10,
		y: 155,
		w: 300,
		h: 100,
		label: 'Iframe 2',
		links: [
			{
				idx: 0,
				x: 30,
				y: 210 + 40 * 0,
				w: 300 - 20 * 2,
				h: 30,
				label: '<link href="/walletAi2" rel="monetization">',
			},
		],
	},
];

let activeBlockIdx = 0;
let isPlaying = false;
const blockElementActive = { 0: 0, 1: 0, 2: 0 };
const drawnElements = { blocks: [], links: [] };

function createBlockGroup(el, parent, rc) {
	const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	const block = rc.rectangle(el.x, el.y, el.w, el.h, {
		roughness: 2,
	});
	block.setAttribute(
		'class',
		`block ${el.type === 'main' ? 'main-block' : 'iframe-block'}`,
	);
	g.appendChild(block);

	const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
	label.setAttribute('x', el.x + el.w / 2);
	label.setAttribute('y', el.y + 30);
	label.setAttribute('class', 'block-label');
	label.textContent = el.label;
	block.appendChild(label);

	parent.appendChild(g);
	return [g, block];
}

function createLinkGroup(link, parent, rc) {
	const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	const block = rc.rectangle(link.x, link.y, link.w, link.h);
	block.setAttribute('class', 'link-block block');
	g.appendChild(block);

	const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
	label.setAttribute('x', link.x + link.w / 2);
	label.setAttribute('y', link.y + 20);
	label.setAttribute('class', 'link-label');
	label.textContent = link.label;
	block.appendChild(label);

	parent.appendChild(g);
	return [g, block];
}

function initialDraw() {
	svgMain.innerHTML = '';
	svgIframe.innerHTML = '';
	drawnElements.blocks = [];
	drawnElements.links = [];

	groups.forEach((group) => {
		const rc = group.type === 'main' ? rcMain : rcIframe;
		const svg = group.type === 'main' ? svgMain : svgIframe;

		const [groupEl, groupBlock] = createBlockGroup(group, svg, rc);
		drawnElements.blocks.push({
			block: groupBlock,
			idx: group.idx,
			type: group.type,
		});

		group.links.forEach((link) => {
			const [linkGroupEl, linkBlock] = createLinkGroup(link, groupEl, rc);
			drawnElements.links.push({
				block: linkBlock,
				parentIdx: group.idx,
				idx: link.idx,
				elementIndex: drawnElements.links.length,
			});
		});
	});
}

function next() {
	const currentBlock = groups[activeBlockIdx];

	if (activeBlockIdx === 0) {
		const currentLinkId = blockElementActive[activeBlockIdx];
		if (currentLinkId + 1 < currentBlock.links.length) {
			blockElementActive[activeBlockIdx] = currentLinkId + 1;
		} else {
			blockElementActive[activeBlockIdx] = 0;
			activeBlockIdx = (activeBlockIdx + 1) % groups.length;
		}
	} else {
		const currentLinkId = blockElementActive[activeBlockIdx];
		blockElementActive[activeBlockIdx] =
			(currentLinkId + 1) % currentBlock.links.length;
		activeBlockIdx = (activeBlockIdx + 1) % groups.length;
	}

	updateActive();
}

function togglePlayPause() {
	if (isPlaying) {
		pause();
		updateToggleButton(false);
	} else {
		play();
		updateToggleButton(true);
	}
}

let intervalId = null;
function play() {
	if (isPlaying) return;
	isPlaying = true;
	intervalId = setInterval(next, 1500);
}
function pause() {
	if (!isPlaying) return;
	isPlaying = false;
	clearInterval(intervalId);
}

function updateToggleButton(nowPlaying) {
	if (nowPlaying) {
		toggleBtn.ariaLabel = 'Pause';
		toggleBtn.title = 'Pause';
		toggleBtn.textContent = '⏸';
	} else {
		toggleBtn.ariaLabel = 'Play';
		toggleBtn.title = 'Play';
		toggleBtn.textContent = '▶';
	}
}

function updateActive() {
	drawnElements.blocks.forEach((block) =>
		block.block.classList.remove('active'),
	);
	drawnElements.links.forEach((link) => link.block.classList.remove('active'));

	drawnElements.blocks.forEach((block) => {
		if (block.idx === activeBlockIdx) {
			block.block.classList.add('active');
		}
	});
	const activeLinkIdx = blockElementActive[activeBlockIdx];
	drawnElements.links.forEach((link) => {
		if (link.parentIdx === activeBlockIdx && link.idx === activeLinkIdx) {
			link.block.classList.add('active');
		}
	});
}

const toggleBtn = document.getElementById('play');
const nextBtn = document.getElementById('next');
nextBtn.addEventListener('click', () => {
	pause();
	updateToggleButton(false);
	next();
});
toggleBtn.addEventListener('click', togglePlayPause);

initialDraw();
updateActive();
togglePlayPause(); // start in play mode
