// code from https://yaky.dev/2024-06-17-js-click-to-zoom-fullscreen-img/
// licensed under CC4.0-BY-NC
function viewFullscreenImage(img_el) {
	// Semi-transparent background for the fullscreen image
	const fsi_bg = document.createElement('div');

	// Image
	const fsi_img = document.createElement('img');
	// Close button
	const fsi_close = document.createElement('button');
	fsi_close.textContent = '×';

	// Socks modifications
	const altText = img_el.getAttribute("alt") ?? "";
	fsi_img.setAttribute("src", img_el.src);
	const closeImagePopOver = () => fsi_bg.remove(); // simple lambda function for closing the image popover
	fsi_bg.classList.add("zoomContainer");
	fsi_bg.addEventListener("click", closeImagePopOver);
	fsi_img.classList.add("zoomImg");
	fsi_img.setAttribute("title", altText);
	fsi_close.classList.add("zoomClose");
	fsi_close.setAttribute("title", "Click to close");
	fsi_close.addEventListener("click", closeImagePopOver);

	const fsi_caption = document.createElement('center'); // greatest hack ever
	fsi_caption.classList.add("zoomCaption");
	fsi_caption.textContent = altText;

	// Compose the fullscreen view
	fsi_bg.append(fsi_img);
	fsi_bg.append(fsi_close);
	fsi_bg.append(fsi_caption);
	document.querySelector('body').append(fsi_bg);
}

// Selector for which img tags should have this ability
const imgs = document.querySelectorAll('#screenshots img');
for (const img of imgs) {
	img.onclick = function() { viewFullscreenImage(img) };
}
