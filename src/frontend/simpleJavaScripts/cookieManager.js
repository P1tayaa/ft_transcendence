



function getCookies() {
  return document.cookie.split("; ").reduce((acc, cookie) => {
    const [key, value] = cookie.split("=");
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}


function setCookie(name, value, days = 0, path = "/") {
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=${path}`;

  // If a duration is specified, calculate the expiration date
  if (days > 0) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    cookieString += `; expires=${date.toUTCString()}`;
  }

  // Set the cookie
  document.cookie = cookieString;
}


console.log(getCookies());
