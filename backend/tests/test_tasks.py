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

def test_get_tasks_invalid_pagination_params(auth_client):
    """
    Test /api/tasks GET with invalid (non-integer) pagination params to cover ValueError branch (app.py:929-931).
    """
    # Pass a non-integer page parameter
    resp = auth_client.get('/api/tasks?page=abc&per_page=2')
    assert resp.status_code == 400
    data = resp.get_json()
    assert data['error'] == 'Invalid pagination parameters.'

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

def test_get_tasks_due_start_recurrence_fields(auth_client):
    """
    Test GET /api/tasks returns due_date, start_date, and recurrence fields when set, and omits them when not set (covers app.py:957-962).
    """
    # Create a task with all fields
    resp = auth_client.post(TASKS_URL, json={
        'title': 'Field Test',
        'priority': 1,
        'start_date': '2025-07-01T09:00:00',
        'due_date': '2025-07-10T17:00:00',
        'recurrence': 'weekly'
    })
    assert resp.status_code == 201
    # Create a task with none of those fields
    resp2 = auth_client.post(TASKS_URL, json={
        'title': 'No Fields',
        'priority': 1
    })
    assert resp2.status_code == 201
    # Fetch all tasks
    resp = auth_client.get(TASKS_URL)
    assert resp.status_code == 200
    data = resp.get_json()['tasks']
    # Find both tasks
    try:
        field_task = next(t for t in data if t['title'] == 'Field Test')
    except StopIteration:
        pytest.fail("Task with title 'Field Test' not found in response data")
    try:
        nofield_task = next(t for t in data if t['title'] == 'No Fields')
    except StopIteration:
        pytest.fail("Task with title 'No Fields' not found in response data")
    # Check fields present when set
    assert field_task['due_date'] == '2025-07-10T17:00:00'
    assert field_task['start_date'] == '2025-07-01T09:00:00'
    assert field_task['recurrence'] == 'weekly'
    # Check fields absent when not set
    assert 'due_date' not in nofield_task
    assert 'start_date' not in nofield_task
    assert 'recurrence' not in nofield_task

def test_get_tasks_with_subtasks(auth_client):
    """
    Test GET /api/tasks returns subtasks in the parent task's 'subtasks' field (covers app.py:966-967).
    """
    # Create a parent task
    resp = auth_client.post(TASKS_URL, json={
        'title': 'Parent Task',
        'priority': 1
    })
    assert resp.status_code == 201
    parent_id = resp.get_json()['id']
    # Create a subtask
    resp2 = auth_client.post(TASKS_URL, json={
        'title': 'Subtask',
        'priority': 1,
        'parent_id': parent_id
    })
    assert resp2.status_code == 201
    subtask_id = resp2.get_json()['id']
    # Fetch all tasks
    resp = auth_client.get(TASKS_URL)
    assert resp.status_code == 200
    data = resp.get_json()['tasks']
    # Find parent task
    try:
        parent_task = next(t for t in data if t['title'] == 'Parent Task')
    except StopIteration:
        pytest.fail("Parent task with title 'Parent Task' not found in response data")
    # Check that subtasks field exists and contains the subtask
    assert 'subtasks' in parent_task
    assert isinstance(parent_task['subtasks'], list)
    assert any(st['id'] == subtask_id and st['title'] == 'Subtask' for st in parent_task['subtasks'])

def test_get_tasks_subtask_due_start_fields(auth_client):
    """
    Test GET /api/tasks returns due_date and start_date fields for subtasks when set (covers app.py:976-979).
    """
    # Create a parent task
    resp = auth_client.post(TASKS_URL, json={
        'title': 'Parent Task 2',
        'priority': 1
    })
    assert resp.status_code == 201
    parent_id = resp.get_json()['id']
    # Create a subtask with due_date and start_date
    resp2 = auth_client.post(TASKS_URL, json={
        'title': 'Subtask 2',
        'priority': 1,
        'parent_id': parent_id,
        'due_date': '2025-08-01T10:00:00',
        'start_date': '2025-07-25T09:00:00'
    })
    assert resp2.status_code == 201
    subtask_id = resp2.get_json()['id']
    # Fetch all tasks
    resp = auth_client.get(TASKS_URL)
    assert resp.status_code == 200
    data = resp.get_json()['tasks']
    # Find parent task
    try:
        parent_task = next(t for t in data if t['title'] == 'Parent Task 2')
    except StopIteration:
        pytest.fail("Parent task with title 'Parent Task 2' not found in response data")
    # Find subtask in parent's subtasks
    try:
        subtask = next(st for st in parent_task['subtasks'] if st['id'] == subtask_id)
    except StopIteration:
        pytest.fail("Subtask with id {} not found in parent's subtasks".format(subtask_id))
    assert subtask['due_date'] == '2025-08-01T10:00:00'
    assert subtask['start_date'] == '2025-07-25T09:00:00'


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
