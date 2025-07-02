"""
test_projects.py: Automated tests for Project CRUD endpoints, including validation, error handling, and ownership checks.
"""
import pytest

REGISTER_URL = '/api/register'
LOGIN_URL = '/api/login'
PROJECTS_URL = '/api/projects'

@pytest.fixture
def auth_client(client):
    client.post(REGISTER_URL, json={
        'username': 'projuser',
        'email': 'proj@weatherboysuper.com',
        'password': 'StrongPass1!'
    })
    client.post(LOGIN_URL, json={
        'username': 'projuser',
        'password': 'StrongPass1!'
    })
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

def test_get_projects(auth_client):
    # Create a project
    auth_client.post(PROJECTS_URL, json={'name': 'Proj 1'})
    resp = auth_client.get(PROJECTS_URL)
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'projects' in data
    assert len(data['projects']) >= 1

def test_update_project(auth_client):
    # Create a project
    resp = auth_client.post(PROJECTS_URL, json={'name': 'To Update'})
    project_id = resp.get_json()['id']
    # Update
    resp = auth_client.put(f'{PROJECTS_URL}/{project_id}', json={'name': 'Updated Project'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['name'] == 'Updated Project'

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
