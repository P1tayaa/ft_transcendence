# Converting to a Plain JavaScript SPA

Since you're using plain JavaScript without a framework, let's adjust the approach to create a simple but effective SPA:

## Step 1: Create a Single Entry Point in Django

```python
from django.shortcuts import render

def spa_entry_point(request):
    """Single entry point for SPA"""
    initial_context = {
        "username": request.user.username if request.user.is_authenticated else None,
        "is_authenticated": request.user.is_authenticated
    }
    return render(request, "index.html", {"initial_context": initial_context})
```

## Step 2: Set Up Django REST Framework

```bash
pip install djangorestframework
```

Add to `settings.py`:

```python
INSTALLED_APPS = [
    # ...existing apps...
    'rest_framework',
]
```

## Step 3: Create API Endpoints

```python
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
import json

@login_required
def get_user_data(request):
    return JsonResponse({
        "username": request.user.username,
        "email": request.user.email,
        # Add other user data
    })

@login_required
def get_game_data(request, name=None):
    data = {}
    if name:
        data["name"] = name
    return JsonResponse(data)

@require_http_methods(["POST"])
def login_api(request):
    data = json.loads(request.body)
    # Handle login logic
    # Return success/failure

# Add more API endpoints as needed
```

## Step 4: Update URLs Configuration

```python
from django.urls import path, re_path
from . import api
from . import pages

urlpatterns = [
    # API endpoints
    path('api/user/', api.get_user_data, name='user_data'),
    path('api/game/<str:name>/', api.get_game_data, name='game_data'),
    path('api/game/', api.get_game_data, name='game_default'),
    path('api/login/', api.login_api, name='api_login'),
    # More API routes
    
    # SPA entry point - catch all other routes
    re_path(r'^.*$', pages.spa_entry_point, name='spa_entry_point'),
]
```

## Step 5: Create an HTML Template for SPA

```html
/index.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your SPA Application</title>
    <link rel="stylesheet" href="/static/css/styles.css">
    <!-- Pass initial data from Django to JavaScript -->
    <script>
        window.INITIAL_DATA = {{ initial_context|safe }};
    </script>
</head>
<body>
    <nav id="main-nav">
        <a href="#" data-route="home">Home</a>
        <a href="#" data-route="game">Game</a>
        <a href="#" data-route="profile">Profile</a>
        <a href="#" data-route="dashboard">Dashboard</a>
        <!-- More navigation links -->
    </nav>
    
    <!-- Container for dynamically loaded content -->
    <main id="app-container"></main>
    
    <!-- Templates for different "pages" -->
    <template id="home-template">
        <div class="page">
            <h1>Welcome <span id="username-display"></span></h1>
            <!-- Home page content -->
        </div>
    </template>
    
    <template id="game-template">
        <div class="page">
            <h1>Game <span id="game-name"></span></h1>
            <!-- Game page content -->
        </div>
    </template>
    
    <!-- More templates for other pages -->
    
    <template id="login-template">
        <div class="page">
            <h1>Login</h1>
            <form id="login-form">
                <!-- Login form fields -->
            </form>
        </div>
    </template>
    
    <!-- Load JavaScript files -->
    <script src="/static/js/router.js"></script>
    <script src="/static/js/api.js"></script>
    <script src="/static/js/app.js"></script>
</body>
</html>
```

## Step 6: Create the SPA JavaScript Files

1. Router for client-side navigation:

```javascript
class Router {
    constructor() {
        this.routes = {};
        
        // Handle back/forward browser buttons
        window.addEventListener('popstate', this.handlePopState.bind(this));
        
        // Handle initial page load
        document.addEventListener('DOMContentLoaded', () => {
            this.navigate(window.location.pathname, false);
        });
    }
    
    addRoute(path, callback) {
        this.routes[path] = callback;
        return this;
    }
    
    handlePopState() {
        this.navigate(window.location.pathname, false);
    }
    
    navigate(path, addToHistory = true) {
        // Default to home if no path
        const normalizedPath = path === '/' ? '/home' : path;
        
        // Strip leading slash for route matching
        const routePath = normalizedPath.replace(/^\//, '');
        
        // Find matching route
        const route = routePath.split('/')[0];
        
        if (this.routes[route]) {
            if (addToHistory) {
                history.pushState({}, '', path);
            }
            
            // Call route handler
            this.routes[route](routePath);
        } else {
            // Handle 404 or redirect to default
            console.warn('Route not found:', route);
            this.navigate('/home', true);
        }
    }
}

const router = new Router();
```

2. API handling:

```javascript
const API = {
    async get(url) {
        try {
            const response = await fetch(`/api/${url}`, {
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    router.navigate('/login');
                    throw new Error('Unauthorized');
                }
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    },
    
    async post(url, data) {
        try {
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            
            const response = await fetch(`/api/${url}`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    }
};
```

3. Main application code:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // Set up click handlers for navigation
    document.getElementById('main-nav').addEventListener('click', (event) => {
        if (event.target.dataset.route) {
            event.preventDefault();
            router.navigate(`/${event.target.dataset.route}`);
        }
    });
    
    // Handle forms
    document.addEventListener('submit', (event) => {
        if (event.target.id === 'login-form') {
            event.preventDefault();
            handleLogin(event.target);
        }
        // Add more form handlers
    });
    
    // Define routes
    router
        .addRoute('home', loadHomePage)
        .addRoute('game', loadGamePage)
        .addRoute('profile', loadProfilePage)
        .addRoute('dashboard', loadDashboardPage)
        .addRoute('login', loadLoginPage);
});

// Page handlers
async function loadHomePage() {
    try {
        renderTemplate('home-template');
        
        if (window.INITIAL_DATA.is_authenticated) {
            document.getElementById('username-display').textContent = window.INITIAL_DATA.username;
        } else {
            router.navigate('/login');
        }
    } catch (error) {
        console.error('Error loading home page:', error);
    }
}

async function loadGamePage(path) {
    try {
        renderTemplate('game-template');
        
        // Extract game name from path if present
        const pathParts = path.split('/');
        let gameName = pathParts.length > 1 ? pathParts[1] : null;
        
        if (gameName) {
            const gameData = await API.get(`game/${gameName}`);
            document.getElementById('game-name').textContent = gameData.name || '';
        }
    } catch (error) {
        console.error('Error loading game page:', error);
    }
}

function loadLoginPage() {
    renderTemplate('login-template');
}

// Add more page handlers

// Helper to render a template
function renderTemplate(templateId) {
    const appContainer = document.getElementById('app-container');
    const template = document.getElementById(templateId);
    
    if (!template) {
        console.error(`Template not found: ${templateId}`);
        return false;
    }
    
    // Clear container
    appContainer.innerHTML = '';
    
    // Clone template content
    const content = template.content.cloneNode(true);
    appContainer.appendChild(content);
    
    return true;
}

// Form handlers
async function handleLogin(form) {
    try {
        const formData = new FormData(form);
        const data = {
            username: formData.get('username'),
            password: formData.get('password')
        };
        
        const response = await API.post('login/', data);
        
        if (response.success) {
            // Update INITIAL_DATA
            window.INITIAL_DATA.is_authenticated = true;
            window.INITIAL_DATA.username = response.username;
            
            router.navigate('/home');
        } else {
            // Show error message
            alert(response.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
    }
}
```

## Step 7: Create CSS

```css
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
}

#main-nav {
    background-color: #333;
    color: white;
    padding: 1rem;
}

#main-nav a {
    color: white;
    margin-right: 1rem;
    text-decoration: none;
}

#app-container {
    padding: 2rem;
}

.page {
    max-width: 1200px;
    margin: 0 auto;
}

/* Add more styles as needed */
```

## Implementation Notes

1. This approach creates a true SPA with:
   - Client-side routing using History API
   - Template-based content rendering
   - API-based data fetching
   - No page reloads during navigation

2. You'll need to include a CSRF token in your base template for POST requests:
   ```html
   {% csrf_token %}
   ```

3. For authentication, you can either:
   - Use session-based authentication (simplest with Django)
   - Implement token-based authentication

4. This implementation keeps templates in the HTML file for simplicity, but you could also:
   - Load templates via AJAX
   - Define templates in separate files

5. For production, consider adding:
   - Error handling for API requests
   - Loading indicators
   - Form validation
   - Proper authentication checks

This approach gives you a fully functional plain JavaScript SPA without relying on any frontend frameworks.

Similar code found with 1 license type