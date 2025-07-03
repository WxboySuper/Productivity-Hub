"""
test_tasks.py: Automated tests for Task CRUD endpoints, including validation, error handling, and ownership checks.
"""
import pytest
import uuid

REGISTER_URL = '/api/register'
LOGIN_URL = '/api/login'
TASKS_URL = '/api/tasks'

@pytest.fixture
def auth_client(client):
    unique = uuid.uuid4().hex[:8]
    username = f"taskuser_{unique}"
    email = f"task_{unique}@weatherboysuper.com"
    client.post(REGISTER_URL, json={
        'username': username,
        'email': email,
        'password': 'StrongPass1!'
    })
    client.post(LOGIN_URL, json={
        'username': username,
        'password': 'StrongPass1!'
    })
    client._taskuser = username
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

@pytest.mark.usefixtures('auth_client')
def test_get_object_or_404_task_404(auth_client):
    resp = auth_client.get('/api/tasks/99999')
    assert resp.status_code == 404
    assert 'error' in resp.get_json()

@pytest.mark.usefixtures('auth_client')
def test_paginate_query_tasks_edge_cases(auth_client):
    # Create 1 task
    auth_client.post('/api/tasks', json={'title': 'Paginate Task', 'priority': 1})
    # Request page out of range
    resp = auth_client.get('/api/tasks?page=100&per_page=1')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['tasks'] == []
    # Request per_page over max
    resp = auth_client.get('/api/tasks?per_page=999')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['per_page'] <= 100

def test_create_task_with_start_date_and_recurrence(auth_client):
    resp = auth_client.post(TASKS_URL, json={
        'title': 'Recurring Task',
        'priority': 1,
        'start_date': '2025-07-01T09:00:00',
        'due_date': '2025-07-10T17:00:00',
        'recurrence': 'weekly'
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['start_date'] == '2025-07-01T09:00:00'
    assert data['due_date'] == '2025-07-10T17:00:00'
    assert data['recurrence'] == 'weekly'


def test_update_task_start_date_and_recurrence(auth_client):
    # Create a task
    resp = auth_client.post(TASKS_URL, json={'title': 'To Update Recurrence', 'priority': 1})
    task_id = resp.get_json()['id']
    # Update start_date and recurrence
    resp = auth_client.put(f'{TASKS_URL}/{task_id}', json={
        'start_date': '2025-07-05T08:00:00',
        'recurrence': 'daily'
    })
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['start_date'] == '2025-07-05T08:00:00'
    assert data['recurrence'] == 'daily'


def test_create_task_start_date_after_due_date(auth_client):
    resp = auth_client.post(TASKS_URL, json={
        'title': 'Invalid Dates',
        'priority': 1,
        'start_date': '2025-07-10T10:00:00',
        'due_date': '2025-07-01T10:00:00'
    })
    assert resp.status_code == 400
    assert 'start_date cannot be after due_date' in resp.get_json().get('error', '')


def test_update_task_start_date_after_due_date(auth_client):
    # Create a task
    resp = auth_client.post(TASKS_URL, json={
        'title': 'Update Invalid Dates',
        'priority': 1,
        'due_date': '2025-07-10T10:00:00'
    })
    task_id = resp.get_json()['id']
    # Try to update start_date after due_date
    resp = auth_client.put(f'{TASKS_URL}/{task_id}', json={
        'start_date': '2025-07-11T10:00:00'
    })
    assert resp.status_code == 400
    assert 'start_date cannot be after due_date' in resp.get_json().get('error', '')
