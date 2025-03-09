export async function checkAuthStatus() {
  try {
    const response = await fetch(getURL() + '/api/auth-status/', {
      credentials: 'include'
    });
    const data = await response.json();

    if (data.isAuthenticated) {
      console.log(`Logged in as: ${data.username}`);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
}
