


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

export async function getRequest(url, data) {
  try {
    const csrfToken = getCSRFToken();

    if (!csrfToken) {
      throw new Error('CSRF token not found');
    }

    let response = null;
    if (data) {
      response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken
        },
        credentials: 'include',
      });


    } else {
      response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken
        },
        credentials: 'include'
      });

    }
    if (!response.ok) {
      let errorData = await response.json();
      throw new Error(errorData.error || 'Failed to logout');
    }

    let responce_data = await response.json();
    return responce_data;

  } catch (error) {
    throw error;
  }
}

export async function postRequest(url, data) {
  try {
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
      body: JSON.stringify(data),
    });

    const responseData = await response.json(); // Fixed variable name

    if (!response.ok) {
      throw new Error(responseData.error || "Request failed");
    }

    return responseData; // Return parsed response

  } catch (error) {
    throw error;
  }
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
