import pytest
from backend.helpers import task_helpers

def test_validate_title():
    # Valid
    data = {'title': '  Task  '}
    title, err = task_helpers.validate_title(data)
    assert title == 'Task' and err is None
    # Missing
    data = {}
    title, err = task_helpers.validate_title(data)
    assert title is None and 'required' in err
    # Too long
    data = {'title': 'a'*256}
    title, err = task_helpers.validate_title(data)
    assert title is None and '255' in err

def test_parse_date():
    from datetime import datetime
    # Valid
    dt, err = task_helpers.parse_date('2025-07-30T12:00:00', 'due_date')
    assert isinstance(dt, datetime) and err is None
    # Invalid
    dt, err = task_helpers.parse_date('bad', 'due_date')
    assert dt is None and 'Invalid due_date format' in err
    # None
    dt, err = task_helpers.parse_date(None, 'due_date')
    assert dt is None and err is None
