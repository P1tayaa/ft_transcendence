


export function getCSRFToken() {
  return document.querySelector('[name=csrfmiddlewaretoken]')?.value ||
    document.cookie.split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
}

var GET_ME_URL = getURL()  + "/api/me"
// "username": user.username,
// "date_joined": user.date_joined.isoformat(),
// "highscore": profile.highscore,
export async function getUserName() {
  try {
    const data = await getRequest(GET_ME_URL);
    return data.username;
  } catch (error) {
    console.error('User not logged in, redirecting', error);
    window.location.href = "/login";
  }
}

export async function getRequest(url) {
  const csrfToken = getCSRFToken();

  if (!csrfToken) {
    throw new Error('CSRF token not found');
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken
    },
    credentials: 'include'
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "GET request failed");
  }

  return (data);
}

export async function postRequest(url, body) {
  const csrfToken = getCSRFToken();

  if (!csrfToken) {
    throw new Error("CSRF token not found");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await response.json(); // Fixed variable name

  if (!response.ok) {
    throw new Error(data.message || "POST request failed");
  }

  return data;
}

// function getCurrentUrl() {
//   var url = window.location.href;
  
//   // Extract the protocol (e.g., "http://")
//   var protocol = window.location.protocol + "//";
  
//   // Extract the host (e.g., "localhost:8000")
//   var host = window.location.host;
  
//   // Extract the path (e.g., "/social/...")
//   var path = window.location.pathname;
  
//   // Return as an array with the three components
//   return [protocol, host, path];
// }

export function getURL(){
  return window.location.protocol + '//' + window.location.host 
}

export function getWebsocketHost() {
  console.log(window.location.protocol)
  if (window.location.protocol === "http:") {
    return "ws://" + window.location.host 
  }
  if (window.location.protocol === "https:") {
    return "wss://" + window.location.host 
  }
}
