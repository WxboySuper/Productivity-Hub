"""
test_auth.py: Automated tests for user registration, login, logout, and profile endpoints.
Covers both success and failure cases.
"""
import pytest
import uuid

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
