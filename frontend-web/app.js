// API Configuration
const API_URL = 'https://x39uk5rfo0.execute-api.us-east-1.amazonaws.com/prod';
let authToken = null;
let currentUser = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (authToken && userData) {
        currentUser = JSON.parse(userData);
        showMainContent();
        refreshStream();
    }
    
    // Character counter for post
    const postContent = document.getElementById('postContent');
    if (postContent) {
        postContent.addEventListener('input', function() {
            updateCharCount();
        });
    }
});

// Auth helpers
function getAuthHeaders() {
    return authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
}

function requireAuth() {
    if (!authToken) {
        alert('Please sign in to perform this action');
        showLogin();
        return false;
    }
    return true;
}

// Auth Functions
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginTab').classList.add('active');
    document.getElementById('registerTab').classList.remove('active');
    clearErrors();
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('registerTab').classList.add('active');
    clearErrors();
}

async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showError('loginError', 'Por favor completa todos los campos');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            authToken = data.token;
            currentUser = {
                id: data.id,
                username: data.username,
                email: data.email
            };
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('userData', JSON.stringify(currentUser));
            
            showMainContent();
            refreshStream();
        } else {
            const error = await response.text();
            showError('loginError', error || 'Credenciales inválidas');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('loginError', 'Unable to connect to server');
    }
}

async function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const bio = document.getElementById('registerBio').value.trim();
    
    if (!username || !email || !password) {
        showError('registerError', 'Please fill in all required fields');
        return;
    }
    
    if (password.length < 6) {
        showError('registerError', 'Password must be at least 6 characters');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password, bio })
        });
        
        if (response.ok) {
            showLogin();
            document.getElementById('loginUsername').value = username;
            showError('loginError', 'Account created successfully. Please sign in.');
            document.getElementById('loginError').style.background = '#f0fdf4';
            document.getElementById('loginError').style.color = '#166534';
            document.getElementById('loginError').style.borderColor = '#bbf7d0';
        } else {
            const error = await response.text();
            showError('registerError', error || 'Error creating account');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('registerError', 'Unable to connect to server');
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('userHeader').style.display = 'none';
    
    clearForms();
    clearErrors();
}

// Post Functions
async function createPost() {
    const content = document.getElementById('postContent').value.trim();
    
    if (!content) {
        showError('postError', 'Post cannot be empty');
        return;
    }
    
    if (content.length > 140) {
        showError('postError', 'Post cannot exceed 140 characters');
        return;
    }
    
    try {
        if (!requireAuth()) return;
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ contenido: content })
        });
        
        if (response.ok) {
            document.getElementById('postContent').value = '';
            updateCharCount();
            hideError('postError');
            await refreshStream();
        } else {
            const error = await response.text();
            showError('postError', error || 'Error creating post');
        }
    } catch (error) {
        console.error('Error creating post:', error);
        showError('postError', 'Unable to connect to server');
    }
}

async function refreshStream() {
    const postsContainer = document.getElementById('postsContainer');
    postsContainer.innerHTML = '<div class="empty-state"><p>Loading posts...</p></div>';
    
    try {
        const response = await fetch(`${API_URL}/stream/posts`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const posts = await response.json();
            displayPosts(posts);
        } else {
            postsContainer.innerHTML = '<div class="error-message">Error loading posts</div>';
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = '<div class="error-message">Unable to connect to server</div>';
    }
}

function displayPosts(posts) {
    const postsContainer = document.getElementById('postsContainer');
    
    if (posts.length === 0) {
        postsContainer.innerHTML = `
            <div class="empty-state">
                <p>No posts yet. Be the first to share something.</p>
            </div>
        `;
        return;
    }
    
    postsContainer.innerHTML = posts.map(post => `
        <div class="post-card" data-post-id="${post.id}">
            <div class="post-header">
                <div class="post-author">
                    <strong>@${post.usuario.username}</strong>
                    <span>${formatDate(post.createdAt)}</span>
                </div>
            </div>
            <div class="post-content">${escapeHtml(post.contenido)}</div>
            <div class="post-actions-row">
                <button class="action-button" onclick="likePost('${post.id}')" id="like-btn-${post.id}">
                    <span>Like</span> <span id="like-count-${post.id}">${post.likes || 0}</span>
                </button>
                <button class="action-button" onclick="toggleComments('${post.id}')">
                    <span>Comments</span> <span id="comment-count-${post.id}">0</span>
                </button>
            </div>
            <div class="post-footer">
                <span class="post-date">${formatTime(post.createdAt)}</span>
            </div>
            <div class="comments-section" id="comments-${post.id}" style="display: none;">
                <div class="comment-form">
                    <textarea id="comment-input-${post.id}" placeholder="Write a comment..." maxlength="280"></textarea>
                    <button onclick="addComment('${post.id}')" class="btn-primary">Post Comment</button>
                </div>
                <div class="comments-list" id="comments-list-${post.id}">
                    <div class="comments-empty">Click to load comments...</div>
                </div>
            </div>
        </div>
    `).join('');
    // Load counts per post (likes/comments)
    posts.forEach(post => loadPostStats(post.id));
}

async function loadPostStats(postId) {
    try {
        // No Authorization header: avoid preflight for simple GET
        const response = await fetch(`${API_URL}/posts/${postId}/stats`);
        
        if (response.ok) {
            const stats = await response.json();
            const likeBtn = document.getElementById(`like-btn-${postId}`);
            const likeCount = document.getElementById(`like-count-${postId}`);
            const commentCount = document.getElementById(`comment-count-${postId}`);
            
            if (likeCount) likeCount.textContent = stats.likes || 0;
            if (commentCount) commentCount.textContent = stats.comentarios || 0;
            if (likeBtn) {
                likeBtn.classList.toggle('liked', !!stats.liked);
            }
        }
    } catch (error) {
        console.error('Error loading stats for post', postId, error);
    }
}

// Utility Functions
function showMainContent() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('userHeader').style.display = 'flex';
    document.getElementById('usernameDisplay').textContent = `@${currentUser.username}`;
    document.getElementById('emailDisplay').textContent = currentUser.email;
}

function updateCharCount() {
    const content = document.getElementById('postContent').value;
    const charCount = document.getElementById('charCount');
    const length = content.length;
    
    charCount.textContent = `${length}/140`;
    
    if (length > 120) {
        charCount.classList.add('warning');
    } else {
        charCount.classList.remove('warning');
    }
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = '';
    errorElement.style.display = 'none';
}

function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.textContent = '';
        element.style.display = 'none';
    });
}

function clearForms() {
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('registerUsername').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerBio').value = '';
    document.getElementById('postContent').value = '';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return formatDate(dateString);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Like Functionality
async function likePost(postId) {
    try {
        if (!requireAuth()) return;
        const likeBtn = document.getElementById(`like-btn-${postId}`);
        if (likeBtn) likeBtn.disabled = true;
        const response = await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders()
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            const likeCount = document.getElementById(`like-count-${postId}`);
            // Serverless API returns { likes, liked }
            if (likeBtn) likeBtn.classList.toggle('liked', !!result.liked);
            likeCount.textContent = (result.likes !== undefined ? result.likes : (result.likesCount || 0));
            // Refresh stats to ensure consistency
            loadPostStats(postId);
        } else {
            console.error('Error liking post');
        }
    } catch (error) {
        console.error('Error liking post:', error);
    }
    finally {
        const likeBtn = document.getElementById(`like-btn-${postId}`);
        if (likeBtn) likeBtn.disabled = false;
    }
}

// Comments Functionality
function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (commentsSection.style.display === 'none') {
        commentsSection.style.display = 'block';
        loadComments(postId);
    } else {
        commentsSection.style.display = 'none';
    }
}

async function loadComments(postId) {
    const commentsList = document.getElementById(`comments-list-${postId}`);
    commentsList.innerHTML = '<div class="comments-empty">Loading comments...</div>';
    
    try {
        // Public GET (no Authorization) to avoid preflight
        const response = await fetch(`${API_URL}/posts/${postId}/comentarios`, { method: 'GET' });
        
        if (response.ok) {
            const comments = await response.json();
            displayComments(comments, postId);
        } else {
            commentsList.innerHTML = '<div class="comments-empty">Error loading comments</div>';
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        commentsList.innerHTML = '<div class="comments-empty">Unable to connect to server</div>';
    }
}

function displayComments(comments, postId) {
    const commentsList = document.getElementById(`comments-list-${postId}`);
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<div class="comments-empty">No comments yet. Be the first to comment!</div>';
        return;
    }
    
    commentsList.innerHTML = comments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-author">@${comment.usuario.username}</span>
                <span class="comment-date">${formatTime(comment.createdAt)}</span>
            </div>
            <div class="comment-content">${escapeHtml(comment.contenido)}</div>
        </div>
    `).join('');
}

async function addComment(postId) {
    const content = document.getElementById(`comment-input-${postId}`).value.trim();
    
    if (!content) {
        alert('Please write a comment');
        return;
    }
    
    if (content.length > 280) {
        alert('Comment cannot exceed 280 characters');
        return;
    }
    
    try {
        if (!requireAuth()) return;
        const response = await fetch(`${API_URL}/posts/${postId}/comentarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ contenido: content })
        });
        
        if (response.ok) {
            document.getElementById(`comment-input-${postId}`).value = '';
            await loadComments(postId);
            // Refresh stats
            await loadPostStats(postId);
        } else {
            const error = await response.text();
            alert(error || 'Error adding comment');
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        alert('Unable to connect to server');
    }
}

// Note: toggleComments defined above with serverless fallback
