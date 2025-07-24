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

def test_create_task_invalid_project_id(auth_client):

    """
    Test /api/tasks POST with an invalid project_id returns 400 and correct error (covers app.py:1018-1021).
    """
    # Use a project_id that does not exist for this user
    resp = auth_client.post(TASKS_URL, json={
        'title': 'Task with Invalid Project',
        'priority': 1,
        'project_id': 99999999
    })
    assert resp.status_code == 400
    data = resp.get_json()
    assert data['error'] == 'Invalid project ID'

def test_create_task_invalid_parent_id(auth_client):

    """
    Test /api/tasks POST with an invalid parent_id returns 400 and correct error (covers app.py:1026-1027).
    """
    # Use a parent_id that does not exist for this user
    resp = auth_client.post(TASKS_URL, json={
        'title': 'Task with Invalid Parent',
        'priority': 1,
        'parent_id': 99999999
    })
    assert resp.status_code == 400
    data = resp.get_json()
    assert data['error'] == 'Invalid parent task ID'

def test_create_task_invalid_due_date_format(auth_client):
    """
    Test /api/tasks POST with an invalid due_date format returns 400 and correct error (covers app.py:1043-1044).
    """
    resp = auth_client.post(TASKS_URL, json={
        'title': 'Task with Bad Due Date',
        'priority': 1,
        'due_date': 'not-a-date'
    })
    assert resp.status_code == 400
    data = resp.get_json()
    assert data['error'] == 'Invalid due_date format'

def test_create_task_invalid_start_date_format(auth_client):
    """
    Test /api/tasks POST with an invalid start_date format returns 400 and correct error (covers app.py:1049-1050).
    """
    resp = auth_client.post(TASKS_URL, json={
        'title': 'Task with Bad Start Date',
        'priority': 1,
        'start_date': 'not-a-date'
    })
    assert resp.status_code == 400
    data = resp.get_json()
    assert data['error'] == 'Invalid start_date format'

def test_create_task_with_valid_project_id(auth_client):
    """
    Test /api/tasks POST with a valid project_id (covers the success path through app.py:1020).
    """
    # First, create a project for this user
    resp = auth_client.post('/api/projects', json={
        'name': 'Project For Task',
        'description': 'Project to test valid project_id on task creation.'
    })
    assert resp.status_code == 201
    project_id = resp.get_json()['id']
    # Now, create a task with that project_id
    resp = auth_client.post(TASKS_URL, json={
        'title': 'Task With Valid Project',
        'priority': 1,
        'project_id': project_id
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['title'] == 'Task With Valid Project'
    assert data['project_id'] == project_id

def test_get_tasks(auth_client):
    # Create a task
    auth_client.post(TASKS_URL, json={'title': 'Task 1', 'priority': 1})
    resp = auth_client.get(TASKS_URL)
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'tasks' in data
    assert len(data['tasks']) >= 1

def test_update_task_requires_json(auth_client):
    """
    Test PUT /api/tasks/<task_id> with non-JSON data returns 400 and correct error (covers app.py:1155-1156).
    """
    # Create a task
    resp = auth_client.post(TASKS_URL, json={'title': 'Update JSON Required', 'priority': 1})
    task_id = resp.get_json()['id']
    # Try to update with form data (not JSON)
    resp = auth_client.put(f'{TASKS_URL}/{task_id}', data='title=NoJSON', content_type='application/x-www-form-urlencoded')
    assert resp.status_code == 400
    data = resp.get_json()
    assert 'Request must be JSON' in data.get('error', '')

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

def test_update_task_404(auth_client):
    """
    Test PUT /api/tasks/<task_id> with a non-existent task returns 404 (covers app.py:1153).
    """
    # Use a task_id that does not exist
    resp = auth_client.put(f'{TASKS_URL}/99999999', json={'title': 'Should Fail'})
    assert resp.status_code == 404
    data = resp.get_json()
    assert 'error' in data and 'not found' in data['error'].lower()

def test_delete_task_404(auth_client):
    """
    Test DELETE /api/tasks/<task_id> with a non-existent task returns 404 (covers app.py:1248).
    """
    # Use a task_id that does not exist
    resp = auth_client.delete(f'{TASKS_URL}/99999999')
    assert resp.status_code == 404
    data = resp.get_json()
    assert 'error' in data and 'not found' in data['error'].lower()

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
    resp = auth_client.post(TASKS_URL, json={
        'title': 'Subtask',
        'priority': 1,
        'parent_id': parent_id
    })
    assert resp.status_code == 201
    subtask_id = resp.get_json()['id']

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
        pytest.fail(f"Subtask with id {subtask_id} not found in parent's subtasks")
    assert subtask['due_date'] == '2025-08-01T10:00:00'
    assert subtask['start_date'] == '2025-07-25T09:00:00'

def test_get_task_by_id_minimal_fields(auth_client):
    """
    Test GET /api/tasks/<task_id> omits due_date, start_date, and recurrence when not set (covers app.py:1114-1136, 'if' statements not taken).
    """
    # Create a parent task with only required fields
    resp = auth_client.post(TASKS_URL, json={
        'title': 'Parent Minimal',
        'priority': 1
    })
    assert resp.status_code == 201
    parent = resp.get_json()
    parent_id = parent['id']
    # Create a subtask with only required fields
    resp2 = auth_client.post(TASKS_URL, json={
        'title': 'Sub Minimal',
        'priority': 1,
        'parent_id': parent_id
    })
    assert resp2.status_code == 201
    subtask = resp2.get_json()
    subtask_id = subtask['id']
    # Fetch the parent task by ID
    resp = auth_client.get(f'{TASKS_URL}/{parent_id}')
    assert resp.status_code == 200
    data = resp.get_json()
    # Parent task: fields should be omitted
    assert data['id'] == parent_id
    assert data['title'] == 'Parent Minimal'
    assert data['priority'] == 1
    assert 'due_date' not in data
    assert 'start_date' not in data
    assert 'recurrence' not in data
    # Subtasks: fields should be omitted
    assert isinstance(data['subtasks'], list)
    try:
        st = next(st for st in data['subtasks'] if st['id'] == subtask_id)
    except StopIteration:
        pytest.fail(f"Subtask with id {subtask_id} not found in parent's subtasks")
    assert st['title'] == 'Sub Minimal'
    assert st['priority'] == 1
    assert 'due_date' not in st
    assert 'start_date' not in st

def test_get_task_by_id_full_serialization(auth_client):
    """
    Test GET /api/tasks/<task_id> returns all fields and subtasks correctly (covers app.py:1102-1142).
    """
    # Create a parent task with all optional fields
    resp = auth_client.post(TASKS_URL, json={
        'title': 'Parent Full',
        'priority': 2,
        'description': 'Parent Desc',
        'due_date': '2025-09-01T10:00:00',
        'start_date': '2025-08-01T09:00:00',
        'recurrence': 'monthly'
    })
    assert resp.status_code == 201
    parent = resp.get_json()
    parent_id = parent['id']
    # Create a subtask with all optional fields
    resp2 = auth_client.post(TASKS_URL, json={
        'title': 'Sub Full',
        'priority': 3,
        'description': 'Sub Desc',
        'parent_id': parent_id,
        'due_date': '2025-09-10T10:00:00',
        'start_date': '2025-08-10T09:00:00'
    })
    assert resp2.status_code == 201
    subtask = resp2.get_json()
    subtask_id = subtask['id']
    # Fetch the parent task by ID
    resp = auth_client.get(f'{TASKS_URL}/{parent_id}')
    assert resp.status_code == 200
    data = resp.get_json()
    # Check all main fields
    assert data['id'] == parent_id
    assert data['title'] == 'Parent Full'
    assert data['description'] == 'Parent Desc'
    assert data['priority'] == 2
    assert data['due_date'] == '2025-09-01T10:00:00'
    assert data['start_date'] == '2025-08-01T09:00:00'
    assert data['recurrence'] == 'monthly'
    assert isinstance(data['subtasks'], list)
    # Find the subtask in the subtasks list
    try:
        st = next(st for st in data['subtasks'] if st['id'] == subtask_id)
    except StopIteration:
        pytest.fail(f"Subtask with id {subtask_id} not found in parent's subtasks")
    assert st['title'] == 'Sub Full'
    assert st['description'] == 'Sub Desc'
    assert st['priority'] == 3
    assert st['due_date'] == '2025-09-10T10:00:00'
    assert st['start_date'] == '2025-08-10T09:00:00'


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


def test_update_task_empty_or_whitespace_title(auth_client):
    """
    Test PUT /api/tasks/<task_id> with empty or whitespace-only title returns 400 and correct error (covers app.py:1163-1164).
    """
    # Create a valid task
    resp = auth_client.post(TASKS_URL, json={'title': 'Valid Task', 'priority': 1})
    assert resp.status_code == 201
    task_id = resp.get_json()['id']

    # Try to update with empty title
    resp = auth_client.put(f'{TASKS_URL}/{task_id}', json={'title': ''})
    assert resp.status_code == 400
    data = resp.get_json()
    assert data['error'] == 'Task title is required'

    # Try to update with whitespace-only title
    resp = auth_client.put(f'{TASKS_URL}/{task_id}', json={'title': '   '})
    assert resp.status_code == 400
    data = resp.get_json()
    assert data['error'] == 'Task title is required'

def test_update_task_description_and_completed_fields(auth_client):
    """
    Test PUT /api/tasks/<task_id> updates description to empty/whitespace and toggles completed (covers app.py:1167-1171).
    """
    # Create a valid task with a description and completed False
    resp = auth_client.post(TASKS_URL, json={'title': 'Desc Test', 'priority': 1, 'description': 'Initial desc', 'completed': False})
    assert resp.status_code == 201
    task = resp.get_json()
    task_id = task['id']
    # Update description to empty string
    resp = auth_client.put(f'{TASKS_URL}/{task_id}', json={'description': ''})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['description'] == ''
    # Update description to whitespace only
    resp = auth_client.put(f'{TASKS_URL}/{task_id}', json={'description': '   '})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['description'] == ''
    # Update completed to True
    resp = auth_client.put(f'{TASKS_URL}/{task_id}', json={'completed': True})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['completed'] is True
    # Update completed to False
    resp = auth_client.put(f'{TASKS_URL}/{task_id}', json={'completed': False})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['completed'] is False

def test_update_task_remove_project_id(auth_client):
    """
    Test PUT /api/tasks/<task_id> with project_id set to None (removes project association, covers branch where data['project_id'] is falsy).
    """
    # Create a valid project
    resp = auth_client.post('/api/projects', json={'name': 'Project To Remove', 'description': 'For remove project_id test'})
    assert resp.status_code == 201
    project_id = resp.get_json()['id']

    # Create a task with that project_id
    resp = auth_client.post(TASKS_URL, json={'title': 'Task With Project', 'priority': 1, 'project_id': project_id})
    assert resp.status_code == 201
    task_id = resp.get_json()['id']
    # Confirm project_id is set
    resp = auth_client.get(f'{TASKS_URL}/{task_id}')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['project_id'] == project_id

    # Update with project_id set to None (should remove association)
    resp = auth_client.put(f'{TASKS_URL}/{task_id}', json={'project_id': None})
    assert resp.status_code == 200
    data = resp.get_json()
    # project_id should now be None or not present
    assert 'project_id' not in data or data['project_id'] is None

def test_update_task_project_id_and_due_date(auth_client):
    """
    Test PUT /api/tasks/<task_id> for project_id and due_date update logic (covers app.py:1176-1190).
    """
    # Create a valid task
    resp = auth_client.post(TASKS_URL, json={'title': 'Proj/Due Update', 'priority': 1})
    assert resp.status_code == 201
    task_id = resp.get_json()['id']

    # Try to update with invalid project_id
    resp = auth_client.put(f'{TASKS_URL}/{task_id}', json={'project_id': 99999999})
    assert resp.status_code == 400
    data = resp.get_json()
    assert data['error'] == 'Invalid project ID'

    # Create a valid project
    resp = auth_client.post('/api/projects', json={'name': 'Valid Project', 'description': 'For update test'})
    assert resp.status_code == 201
    project_id = resp.get_json()['id']

    # Update with valid project_id
    resp = auth_client.put(f'{TASKS_URL}/{task_id}', json={'project_id': project_id})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['project_id'] == project_id

    # Try to update with invalid due_date
    resp = auth_client.put(f'{TASKS_URL}/{task_id}', json={'due_date': 'not-a-date'})
    assert resp.status_code == 400
    data = resp.get_json()
    assert data['error'] == 'Invalid due_date format'

    # Update with valid due_date
    valid_due = '2025-12-31T23:59:00'
    resp = auth_client.put(f'{TASKS_URL}/{task_id}', json={'due_date': valid_due})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['due_date'] == valid_due

    # Update with due_date set to None (should clear the due date)
    resp = auth_client.put(f'{TASKS_URL}/{task_id}', json={'due_date': None})
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'due_date' not in data or data['due_date'] is None


def test_update_task_start_date_field(auth_client):
    """
    Test PUT /api/tasks/<task_id> for start_date update logic (covers app.py:1196-1199).
    """
    # Create a valid task
    resp = auth_client.post(TASKS_URL, json={'title': 'StartDate Update', 'priority': 1})
    assert resp.status_code == 201
    task_id = resp.get_json()['id']

    # Try to update with invalid start_date
    resp = auth_client.put(f'{TASKS_URL}/{task_id}', json={'start_date': 'not-a-date'})
    assert resp.status_code == 400
    data = resp.get_json()
    assert data['error'] == 'Invalid start_date format'

    # Update with valid start_date
    valid_start = '2025-11-30T08:00:00'
    resp = auth_client.put(f'{TASKS_URL}/{task_id}', json={'start_date': valid_start})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['start_date'] == valid_start

    # Update with start_date set to None (should clear the start_date)
    resp = auth_client.put(f'{TASKS_URL}/{task_id}', json={'start_date': None})
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'start_date' not in data or data['start_date'] is None