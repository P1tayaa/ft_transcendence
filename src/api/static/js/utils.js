


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
export async function getUserName()
{
  try {
    const csrfToken = getCSRFToken();
    console.log("Adding Score");

    if (!csrfToken) {
      throw new Error('CSRF token not found');
    }

    const response = await fetch(GET_ME_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      },
      credentials: 'include'
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to logout');
    }
    
    return (response.json().username)
  } catch (error) {
    console.error('Error: An error occurred. Please try again.', error);
  }
}

