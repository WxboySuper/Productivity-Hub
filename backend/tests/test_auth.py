"""
test_auth.py: Automated tests for user registration, login, logout, and profile endpoints.
Covers both success and failure cases.
"""
import pytest
import uuid
import flask
from app import get_current_user, db, User

REGISTER_URL = '/api/register'
LOGIN_URL = '/api/login'
LOGOUT_URL = '/api/logout'
PROFILE_URL = '/api/profile'

@pytest.mark.usefixtures('client', 'db')
def test_register_success(client):
    unique = uuid.uuid4().hex[:8]
    username = f"testuser_{unique}"
    email = f"test_{unique}@weatherboysuper.com"
    resp = client.post(REGISTER_URL, json={
        'username': username,
        'email': email,
        'password': 'StrongPass1!'
    })
    assert resp.status_code == 201
    assert resp.get_json()['message'] == 'User registered successfully'

@pytest.mark.usefixtures('client', 'db')
def test_register_missing_fields(client):
    resp = client.post(REGISTER_URL, json={})
    assert resp.status_code == 400
    assert 'error' in resp.get_json()

@pytest.mark.usefixtures('client', 'db')
def test_register_weak_password(client):
    resp = client.post(REGISTER_URL, json={
        'username': 'weakuser',
        'email': 'weak@weatherboysuper.com',
        'password': 'weak'
    })
    assert resp.status_code == 400
    assert 'error' in resp.get_json()

@pytest.mark.usefixtures('client', 'db')
def test_login_success(client):
    unique = uuid.uuid4().hex[:8]
    username = f"loginuser_{unique}"
    email = f"login_{unique}@weatherboysuper.com"
    client.post(REGISTER_URL, json={
        'username': username,
        'email': email,
        'password': 'StrongPass1!'
    })
    resp = client.post(LOGIN_URL, json={
        'username': username,
        'password': 'StrongPass1!'
    })
    assert resp.status_code == 200
    assert resp.get_json()['message'] == 'Login successful'

@pytest.mark.usefixtures('client', 'db')
def test_login_invalid(client):
    resp = client.post(LOGIN_URL, json={
        'username': 'nouser',
        'password': 'wrongpass'
    })
    assert resp.status_code == 401
    assert 'error' in resp.get_json()

@pytest.mark.usefixtures('client', 'db')
def test_logout(client):
    unique = uuid.uuid4().hex[:8]
    username = f"logoutuser_{unique}"
    email = f"logout_{unique}@weatherboysuper.com"
    client.post(REGISTER_URL, json={
        'username': username,
        'email': email,
        'password': 'StrongPass1!'
    })
    client.post(LOGIN_URL, json={
        'username': username,
        'password': 'StrongPass1!'
    })
    resp = client.post(LOGOUT_URL)
    assert resp.status_code == 200
    assert resp.get_json()['message'] == 'Logout successful'

@pytest.mark.usefixtures('client', 'db')
def test_profile_requires_auth(client):
    resp = client.get(PROFILE_URL)
    assert resp.status_code == 401
    assert 'error' in resp.get_json()

@pytest.mark.usefixtures('client', 'db')
def test_profile_success(client):
    unique = uuid.uuid4().hex[:8]
    username = f"profileuser_{unique}"
    email = f"profile_{unique}@weatherboysuper.com"
    client.post(REGISTER_URL, json={
        'username': username,
        'email': email,
        'password': 'StrongPass1!'
    })
    client.post(LOGIN_URL, json={
        'username': username,
        'password': 'StrongPass1!'
    })
    resp = client.get(PROFILE_URL)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['username'] == username
    assert data['email'] == email

# Additional test for CSRF protection on profile update
@pytest.mark.usefixtures('client', 'db')
def test_csrf_protect_profile_update(client):
    unique = uuid.uuid4().hex[:8]
    username = f"csrfprofile_{unique}"
    email = f"csrfprofile_{unique}@weatherboysuper.com"
    client.post(REGISTER_URL, json={
        'username': username,
        'email': email,
        'password': 'StrongPass1!'
    })
    client.post(LOGIN_URL, json={
        'username': username,
        'password': 'StrongPass1!'
    })
    client.application.config['TESTING'] = False
    resp = client.put(PROFILE_URL, json={'username': 'newname'})
    assert resp.status_code in (403, 400, 401)
    client.application.config['TESTING'] = True

@pytest.fixture
def auth_client(client):
    unique = uuid.uuid4().hex[:8]
    username = f"authtestuser_{unique}"
    email = f"authtestuser_{unique}@weatherboysuper.com"
    client.post(REGISTER_URL, json={
        'username': username,
        'email': email,
        'password': 'StrongPass1!'
    })
    client.post(LOGIN_URL, json={
        'username': username,
        'password': 'StrongPass1!'
    })
    client._authtestuser = username
    return client

def test_auth_client_fixture_works(auth_client):
    """
    Test that the auth_client fixture provides a valid authenticated session and can access the profile endpoint.
    """
    resp = auth_client.get('/api/profile')
    data = resp.get_json()
    assert resp.status_code == 200
    assert data['username'] == auth_client._authtestuser

@pytest.mark.usefixtures('client', 'db')
def test_get_current_user_found_and_not_found(client):
    # Simulate a request context with a user_id that does not exist in the database
    # Register and login a user, then delete them
    username = 'ghostuser'
    email = 'ghostuser@weatherboysuper.com'
    password = 'StrongPass1!'
    client.post(REGISTER_URL, json={'username': username, 'email': email, 'password': password})
    client.post(LOGIN_URL, json={'username': username, 'password': password})
    with client.application.app_context():
        user = User.query.filter_by(username=username).first()
        user_id = user.id
        db.session.delete(user)
        db.session.commit()
    # Set the now-nonexistent user_id in the session and call /api/profile
    with client.session_transaction() as sess:
        sess['user_id'] = user_id
    resp = client.get(PROFILE_URL)
    # Should return 401 because user is not found
    assert resp.status_code == 401
    assert 'error' in resp.get_json()
    # Register and login a user

    username = 'getuser'
    email = 'getuser@weatherboysuper.com'  # Use a valid, non-reserved domain
    password = 'StrongPass1!'
    client.post(REGISTER_URL, json={'username': username, 'email': email, 'password': password})
    client.post(LOGIN_URL, json={'username': username, 'password': password})

    # Simulate a request context with user_id in session
    with client.application.app_context():
        with client.session_transaction() as sess:
            user = User.query.filter_by(username=username).first()
            sess['user_id'] = user.id
        with client.application.test_request_context():
            flask.session['user_id'] = user.id
            found_user = get_current_user()
            assert found_user is not None
            assert found_user.username == username

    # Simulate a request context with no user_id in session
    with client.application.app_context():
        with client.application.test_request_context():
            flask.session.clear()
            not_found_user = get_current_user()
            assert not_found_user is None
