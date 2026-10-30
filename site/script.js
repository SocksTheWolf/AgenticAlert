if (typeof kofiWidgetOverlay !== 'undefined') {
  kofiWidgetOverlay.draw('socksthewolf', {
    'type': 'floating-chat',
    'floating-chat.donateButton.text': 'Support me',
    'floating-chat.donateButton.background-color': '#ffb300',
    'floating-chat.donateButton.text-color': '#323842'
  });
}

if (document.getElementById("getAA")) {
  let browserTag = "dl-script";
  if (window.chrome !== undefined) { // chrome browsers
    browserTag = "dl-chrome";
  } else if (window.mozInnerScreenX !== undefined) { // firefox browsers
    browserTag = "dl-fx";
  }
  document.getElementById(browserTag).setAttribute("open", true);
}

addBackToTop({
  diameter: 56,
  backgroundColor: '#ffb300',
  textColor: '#323842'
});