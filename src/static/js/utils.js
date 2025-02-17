


export function getCSRFToken() {
  return document.querySelector('[name=csrfmiddlewaretoken]')?.value ||
    document.cookie.split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
}

const GET_ME_URL = "http://localhost:8000/api/me"
// "username": user.username,
// "date_joined": user.date_joined.isoformat(),
// "highscore": profile.highscore,
export async function getUserName() {
  return await getRequest(GET_ME_URL).username

}

export async function getRequest(url, data) {
  try {
    const csrfToken = getCSRFToken();
    console.log("Adding Score");

    if (!csrfToken) {
      throw new Error('CSRF token not found');
    }

    const response = null;
    if (data) {
      response = await fetch(GET_ME_URL, {
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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to logout');
    }

    const responce_data = await response.json();
    return responce_data;

  } catch (error) {
    console.error('Error: An error occurred. Please try again.', error);
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
    console.error("Error in postRequest:", error);
    return null; // Ensure function always returns something
  }
}
