import fs from 'node:fs';
import path from 'node:path';

const root = import.meta.dirname;
const outDir = path.join(root, 'dist');

const ignore = ['node_modules', 'dist', '.git'];
const BLOG_BASE_URL = 'https://sidvishnoi.com';

function findAndCollect(dir, currentUrlPath = '') {
	const items = fs.readdirSync(dir, { withFileTypes: true });

	for (const item of items) {
		if (item.isDirectory() && !ignore.includes(item.name)) {
			const fullPath = path.join(dir, item.name);
			const distPath = path.join(fullPath, 'dist');

			// If this folder has a 'dist', it's a built demo
			if (fs.existsSync(distPath)) {
				const relativeRoute = path.join(currentUrlPath, item.name);
				const targetDir = path.join(outDir, relativeRoute);

				// Ensure target directory exists
				fs.mkdirSync(targetDir, { recursive: true });

				fs.cpSync(distPath, targetDir, { recursive: true });

				const indexPath = path.join(targetDir, 'index.html');
				if (fs.existsSync(indexPath)) {
					injectBannerScript(indexPath);
				}

				console.log(`✅ Processed: /${relativeRoute}`);
			} else {
				findAndCollect(fullPath, path.join(currentUrlPath, item.name));
			}
		}
	}
}

console.log('🚀 Starting collection and injection...');

// if (fs.existsSync(outDir)) {
//   fs.rmSync(outDir, { recursive: true, force: true });
// }
fs.mkdirSync(outDir, { recursive: true });

try {
	findAndCollect(root);
	fs.writeFileSync(path.join(outDir, 'banner.js'), getBannerScript());
	console.log('\n✨ All demos collected in /dist');
} catch (err) {
	console.error('❌ Error during collection:', err);
	process.exit(1);
}

// #region Banner
function getBannerScript() {
	return `(() => {
  const BASE_URL = "https://sidvishnoi.com";
  if (window.self === window.top) {
    let path = new URLSearchParams(window.location.search).get("path");
    if (!path) return;
    path = decodeURIComponent(path);
    if (!/^\\/[a-zA-Z0-9\\/\\-_]+$/.test(path)) return;

    const banner = document.createElement("div");
    Object.assign(banner.style, {
      position: 'relative',
      width: '100%',
      backgroundColor: '#0f172a', // Deep slate
      color: '#f8fafc',
      padding: '10px 20px',
      textAlign: 'left',
      fontSize: '13px',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      borderBottom: '1px solid #1e293b',
      boxSizing: 'border-box'
    });

    banner.innerHTML = \`Read more about this demo on <a href="\${BASE_URL}\${path}" style="color: #00d4ff; font-weight: bold;">sidvishnoi.com</a>\`;

    document.body.prepend(banner);
  }
})();`;
}
function injectBannerScript(indexPath) {
	const html = fs.readFileSync(indexPath, 'utf8');
	const processedHtml = html.replace(/<body[^>]*>/i, (match) => {
		return `${match}\n<script type="module" src="/banner.js"></script>\n`;
	});
	fs.writeFileSync(indexPath, processedHtml);
}

// #endregion
