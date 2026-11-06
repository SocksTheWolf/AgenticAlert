// code from https://yaky.dev/2024-06-17-js-click-to-zoom-fullscreen-img/
// licensed under CC4.0-BY-NC
function viewFullscreenImage(img_src) {
	// Semi-transparent background for the fullscreen image
	const fsi_bg = document.createElement('div');

	// Image
	const fsi_img = document.createElement('img');
	fsi_img.src = img_src;
	// Close button
	const fsi_close = document.createElement('button');
	fsi_close.textContent = '×';

	// Socks modifications
	const closeImagePopOver = () => fsi_bg.remove(); // simple lambda function for closing the image popover
	fsi_bg.classList.add("zoomContainer");
	fsi_bg.addEventListener("click", closeImagePopOver);
	fsi_img.classList.add("zoomImg");
	fsi_close.classList.add("zoomClose");
	fsi_close.addEventListener("click", closeImagePopOver);

	// Compose the fullscreen view
	fsi_bg.append(fsi_img);
	fsi_bg.append(fsi_close);
	document.querySelector('body').append(fsi_bg);
}

// Selector for which img tags should have this ability
const imgs = document.querySelectorAll('#screenshots img');
for (const img of imgs) {
	img.onclick = function() { viewFullscreenImage(img.src) };
}
