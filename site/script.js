if (typeof kofiWidgetOverlay !== 'undefined') {
  kofiWidgetOverlay.draw('socksthewolf', {
    'type': 'floating-chat',
    'floating-chat.donateButton.text': 'Support me',
    'floating-chat.donateButton.background-color': '#ffb300',
    'floating-chat.donateButton.text-color': '#323842'
  });
}

// download section stuff
if (document.getElementById("getAA")) {
  let browserTag = "dl-script";
  if (window.chrome !== undefined) { // chrome browsers
    browserTag = "dl-chrome";
  } else if (window.mozInnerScreenX !== undefined) { // firefox browsers
    browserTag = "dl-fx";
  }
  document.getElementById(browserTag).setAttribute("open", true);
  document.getElementById(browserTag).scrollIntoView();
}

// this is really poor and could probably be made better
// but I don't care, and this is probably the best solution to prevent
// any site attacks while still being _mostly_ scalable.
function handleSatNav() {
  let currentPage = document.location.pathname.split("/").pop();
  if (currentPage === "") {
    currentPage = document.location.hash.replace("#", "");
  }
  let lookupName;
  // this is dumb but it avoids XSS
  // and I don't want to bother adding sanitizing code for a static site
  // that I threw together so quickly
  switch (currentPage) {
    case "get":
      lookupName = "get";
    break;
    case "features":
      lookupName = "features";
    break;
    case "screenshots":
      lookupName = "screenshots";
    break;
    default:
      lookupName = "/";
    break;
  }
  document.querySelectorAll("#SAATNAV a").forEach((el) => {
    el.classList.remove("current");
  })
  document.querySelector(`#SAATNAV a[href$="${lookupName}"]`).classList.add("current");
}

// marking nav as current
if (document.getElementById("SAATNAV")) {
  handleSatNav();
  document.querySelectorAll("#SAATNAV a").forEach(el => {
    el.addEventListener("click", () => {
      setTimeout(handleSatNav, 200);
    });
  });
}

addBackToTop({
  diameter: 56,
  backgroundColor: '#ffb300',
  textColor: '#323842'
});