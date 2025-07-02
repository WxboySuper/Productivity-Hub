"""
test_auth.py: Automated tests for user registration, login, logout, and profile endpoints.
Covers both success and failure cases.
"""
import pytest

REGISTER_URL = '/api/register'
LOGIN_URL = '/api/login'
LOGOUT_URL = '/api/logout'
PROFILE_URL = '/api/profile'

@pytest.mark.usefixtures('client', 'db')
def test_register_success(client):
    resp = client.post(REGISTER_URL, json={
        'username': 'testuser',
        'email': 'test@weatherboysuper.com',
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
    client.post(REGISTER_URL, json={
        'username': 'loginuser',
        'email': 'login@weatherboysuper.com',
        'password': 'StrongPass1!'
    })
    resp = client.post(LOGIN_URL, json={
        'username': 'loginuser',
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
    client.post(REGISTER_URL, json={
        'username': 'logoutuser',
        'email': 'logout@weatherboysuper.com',
        'password': 'StrongPass1!'
    })
    client.post(LOGIN_URL, json={
        'username': 'logoutuser',
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
    client.post(REGISTER_URL, json={
        'username': 'profileuser',
        'email': 'profile@weatherboysuper.com',
        'password': 'StrongPass1!'
    })
    client.post(LOGIN_URL, json={
        'username': 'profileuser',
        'password': 'StrongPass1!'
    })
    resp = client.get(PROFILE_URL)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['username'] == 'profileuser'
    assert data['email'] == 'profile@weatherboysuper.com'

# Additional test for CSRF protection on profile update
@pytest.mark.usefixtures('client', 'db')
def test_csrf_protect_profile_update(client):
    client.post(REGISTER_URL, json={
        'username': 'csrfprofile',
        'email': 'csrfprofile@weatherboysuper.com',
        'password': 'StrongPass1!'
    })
    client.post(LOGIN_URL, json={
        'username': 'csrfprofile',
        'password': 'StrongPass1!'
    })
    client.application.config['TESTING'] = False
    resp = client.put(PROFILE_URL, json={'username': 'newname'})
    assert resp.status_code in (403, 400, 401)
    client.application.config['TESTING'] = True
