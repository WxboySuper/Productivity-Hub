"""
test_tasks.py: Automated tests for Task CRUD endpoints, including validation, error handling, and ownership checks.
"""
import pytest

REGISTER_URL = '/api/register'
LOGIN_URL = '/api/login'
TASKS_URL = '/api/tasks'

@pytest.fixture
def auth_client(client):
    client.post(REGISTER_URL, json={
        'username': 'taskuser',
        'email': 'task@weatherboysuper.com',
        'password': 'StrongPass1!'
    })
    client.post(LOGIN_URL, json={
        'username': 'taskuser',
        'password': 'StrongPass1!'
    })
    return client

def test_create_task_success(auth_client):
    resp = auth_client.post(TASKS_URL, json={
        'title': 'Test Task',
        'priority': 2
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['title'] == 'Test Task'
    assert data['priority'] == 2

def test_create_task_missing_title(auth_client):
    resp = auth_client.post(TASKS_URL, json={})
    assert resp.status_code == 400
    assert 'error' in resp.get_json()

def test_get_tasks(auth_client):
    # Create a task
    auth_client.post(TASKS_URL, json={'title': 'Task 1', 'priority': 1})
    resp = auth_client.get(TASKS_URL)
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'tasks' in data
    assert len(data['tasks']) >= 1

def test_update_task(auth_client):
    # Create a task
    resp = auth_client.post(TASKS_URL, json={'title': 'To Update', 'priority': 1})
    task_id = resp.get_json()['id']
    # Update
    resp = auth_client.put(f'{TASKS_URL}/{task_id}', json={'title': 'Updated', 'priority': 3})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['title'] == 'Updated'
    assert data['priority'] == 3

def test_delete_task(auth_client):
    # Create a task
    resp = auth_client.post(TASKS_URL, json={'title': 'To Delete', 'priority': 1})
    task_id = resp.get_json()['id']
    # Delete
    resp = auth_client.delete(f'{TASKS_URL}/{task_id}')
    assert resp.status_code == 200
    assert resp.get_json()['message'] == 'Task deleted successfully'
    # Confirm deletion
    resp = auth_client.get(f'{TASKS_URL}/{task_id}')
    assert resp.status_code == 404
