"""
test_projects.py: Automated tests for Project CRUD endpoints, including validation, error handling, and ownership checks.
"""
import pytest
import uuid

REGISTER_URL = '/api/register'
LOGIN_URL = '/api/login'
PROJECTS_URL = '/api/projects'

@pytest.fixture
def auth_client(client):
    unique = uuid.uuid4().hex[:8]
    username = f"projuser_{unique}"
    email = f"proj_{unique}@weatherboysuper.com"
    client.post(REGISTER_URL, json={
        'username': username,
        'email': email,
        'password': 'StrongPass1!'
    })
    client.post(LOGIN_URL, json={
        'username': username,
        'password': 'StrongPass1!'
    })
    client._projuser = username
    return client

def test_create_project_success(auth_client):
    resp = auth_client.post(PROJECTS_URL, json={
        'name': 'Test Project',
        'description': 'A project for testing.'
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['name'] == 'Test Project'
    assert data['description'] == 'A project for testing.'

def test_create_project_missing_name(auth_client):
    resp = auth_client.post(PROJECTS_URL, json={})
    assert resp.status_code == 400
    assert 'error' in resp.get_json()

def test_create_project_requires_json(auth_client):
    """
    Test that /api/projects POST returns 400 and correct error if request is not JSON (covers app.py:798-799).
    """
    # Send form data instead of JSON
    resp = auth_client.post(PROJECTS_URL, data={'name': 'Not JSON'})
    assert resp.status_code == 400
    data = resp.get_json()
    assert data['error'] == 'Request must be JSON'

def test_create_project_requires_json_variants(auth_client):
    """
    Test that /api/projects POST returns 400 and correct error if request is not JSON (explicitly covers app.py:1001-1002).
    """
    # Send no data, no content type
    resp = auth_client.post(PROJECTS_URL)
    assert resp.status_code == 400
    data = resp.get_json()
    assert data['error'] == 'Request must be JSON'

    # Send with explicit non-JSON content type
    resp = auth_client.post(PROJECTS_URL, data='not json', content_type='text/plain')
    assert resp.status_code == 400
    data = resp.get_json()
    assert data['error'] == 'Request must be JSON'

def test_get_projects(auth_client):
    # Create a project
    auth_client.post(PROJECTS_URL, json={'name': 'Proj 1'})
    resp = auth_client.get(PROJECTS_URL)
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'projects' in data
    assert len(data['projects']) >= 1

def test_get_project_by_id_success(auth_client):
    """
    Test /api/projects/<project_id> GET returns the correct project and covers logger/return (app.py:842-843).
    """
    # Create a project
    resp = auth_client.post(PROJECTS_URL, json={'name': 'Single Project', 'description': 'Desc'})
    assert resp.status_code == 201
    project = resp.get_json()
    project_id = project['id']
    # Fetch the project by ID
    resp = auth_client.get(f'{PROJECTS_URL}/{project_id}')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['id'] == project_id
    assert data['name'] == 'Single Project'
    assert data['description'] == 'Desc'

def test_update_project(auth_client):
    # Create a project
    resp = auth_client.post(PROJECTS_URL, json={'name': 'To Update'})
    project_id = resp.get_json()['id']
    # Update
    resp = auth_client.put(f'{PROJECTS_URL}/{project_id}', json={'name': 'Updated Project'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['name'] == 'Updated Project'


def test_update_project_not_found(auth_client):
    """
    Test updating a non-existent project returns 404 (covers app.py:859-860).
    """
    resp = auth_client.put(f'{PROJECTS_URL}/999999', json={'name': 'Should Fail'})
    assert resp.status_code == 404
    data = resp.get_json()
    assert data['error'] == 'Project not found'

def test_update_project_requires_json(auth_client):
    """
    Test updating a project with non-JSON data returns 400 (covers app.py:862-863).
    """
    # Create a project
    resp = auth_client.post(PROJECTS_URL, json={'name': 'Update Me'})
    project_id = resp.get_json()['id']
    # Try to update with form data
    resp = auth_client.put(f'{PROJECTS_URL}/{project_id}', data={'name': 'Not JSON'})
    assert resp.status_code == 400
    data = resp.get_json()
    assert data['error'] == 'Request must be JSON'

def test_update_project_missing_or_blank_name(auth_client):
    """
    Test updating a project with missing or blank name returns 400 (covers app.py:869-870 for PUT endpoint).
    """
    # Create a project
    resp = auth_client.post(PROJECTS_URL, json={'name': 'Update Name Test'})
    project_id = resp.get_json()['id']
    # Try to update with missing name
    resp = auth_client.put(f'{PROJECTS_URL}/{project_id}', json={})
    assert resp.status_code == 400
    data = resp.get_json()
    assert data['error'] == 'Project name is required'
    # Try to update with no description (should not error, just for completeness)


def test_update_project_description_variants(auth_client):
    """
    Test updating a project's description with various values to cover app.py:874-875.
    """
    # Create a project with initial description
    resp = auth_client.post(PROJECTS_URL, json={'name': 'DescTest', 'description': 'Initial'})
    project = resp.get_json()
    project_id = project['id']

    # Update with new description (with whitespace)
    resp = auth_client.put(f'{PROJECTS_URL}/{project_id}', json={'name': 'DescTest', 'description': '  New Desc  '})
    assert resp.status_code == 200
    data = resp.get_json()
    # Should be stripped
    assert data['description'] == 'New Desc'

    # Update with empty string (should set to empty string)
    resp = auth_client.put(f'{PROJECTS_URL}/{project_id}', json={'name': 'DescTest', 'description': ''})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['description'] == ''

    # Update with no description field (should leave unchanged)
    resp = auth_client.put(f'{PROJECTS_URL}/{project_id}', json={'name': 'DescTest'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['description'] == ''  # Remains as last set value
    # Try to update with blank name
    resp = auth_client.put(f'{PROJECTS_URL}/{project_id}', json={'name': '   '})
    assert resp.status_code == 400
    data = resp.get_json()
    assert data['error'] == 'Project name is required'

def test_delete_project(auth_client):
    # Create a project
    resp = auth_client.post(PROJECTS_URL, json={'name': 'To Delete'})
    project_id = resp.get_json()['id']
    # Delete
    resp = auth_client.delete(f'{PROJECTS_URL}/{project_id}')
    assert resp.status_code == 200
    assert resp.get_json()['message'] == 'Project deleted successfully'
    # Confirm deletion
    resp = auth_client.get(f'{PROJECTS_URL}/{project_id}')
    assert resp.status_code == 404

def test_delete_project_not_found(auth_client):
    """
    Test deleting a non-existent project returns 404 (covers app.py:901-902 for DELETE endpoint).
    """
    resp = auth_client.delete(f'{PROJECTS_URL}/999999')
    assert resp.status_code == 404
    data = resp.get_json()
    assert data['error'] == 'Project not found'

@pytest.mark.usefixtures('client', 'db')
def test_csrf_protect_enforced(client):
    # Register and login
    client.post('/api/register', json={
        'username': 'csrfuser',
        'email': 'csrf@weatherboysuper.com',
        'password': 'StrongPass1!'
    })
    client.post('/api/login', json={
        'username': 'csrfuser',
        'password': 'StrongPass1!'
    })
    # POST without CSRF token (should fail in non-testing mode)
    client.application.config['TESTING'] = False
    resp = client.post('/api/projects', json={'name': 'CSRF Test Project'})
    assert resp.status_code in (403, 400, 401)
    client.application.config['TESTING'] = True

@pytest.mark.usefixtures('auth_client')
def test_get_object_or_404_returns_404(auth_client):
    # Try to get a non-existent project
    resp = auth_client.get('/api/projects/99999')
    assert resp.status_code == 404
    assert 'error' in resp.get_json()
    # Try to get a non-existent task
    resp = auth_client.get('/api/tasks/99999')
    assert resp.status_code == 404
    assert 'error' in resp.get_json()

@pytest.mark.usefixtures('auth_client')
def test_paginate_query_edge_cases(auth_client):
    # Create 1 project
    auth_client.post('/api/projects', json={'name': 'Paginate Project'})
    # Request page out of range
    resp = auth_client.get('/api/projects?page=100&per_page=1')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['projects'] == []
    # Request per_page over max
    resp = auth_client.get('/api/projects?per_page=999')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['per_page'] <= 100


def test_get_projects_invalid_pagination_params(auth_client):
    """
    Test /api/projects GET with invalid (non-integer) pagination params to cover ValueError branch (app.py:759-761).
    """
    # Pass a non-integer page parameter
    resp = auth_client.get('/api/projects?page=abc&per_page=2')
    assert resp.status_code == 400
    data = resp.get_json()
    assert data['error'] == 'Invalid pagination parameters.'
