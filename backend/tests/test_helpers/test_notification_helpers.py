import pytest
from backend.helpers import notification_helpers

def test_serialize_notification():
    class Dummy:
        def __init__(self):
            self.id = 1
            self.title = 'Title'
            self.message = 'Msg'
            self.read = False
            import datetime
            self.created_at = datetime.datetime(2020,1,1)
            self.task_id = 2
            self.show_at = None
            self.snoozed_until = None
    d = Dummy()
    result = notification_helpers.serialize_notification(d)
    assert result['id'] == 1
    assert result['title'] == 'Title'
    assert result['message'] == 'Msg'
    assert result['read'] is False
    assert result['created_at'].startswith('2020-01-01')
    assert result['task_id'] == 2
    # With show_at and snoozed_until
    d.show_at = d.created_at
    d.snoozed_until = d.created_at
    result = notification_helpers.serialize_notification(d)
    assert 'show_at' in result and 'snoozed_until' in result

def test_validate_snooze_minutes():
    # Valid
    data = {'minutes': 10}
    minutes, err = notification_helpers.validate_snooze_minutes(data)
    assert minutes == 10 and err is None
    # Missing
    data = {}
    minutes, err = notification_helpers.validate_snooze_minutes(data)
    assert minutes is None and 'Minutes parameter is required' in err[0]
    # Invalid type
    data = {'minutes': 'bad'}
    minutes, err = notification_helpers.validate_snooze_minutes(data)
    assert minutes is None and 'Invalid minutes value' in err[0]
    # Negative
    data = {'minutes': -5}
    minutes, err = notification_helpers.validate_snooze_minutes(data)
    assert minutes is None and 'Minutes must be positive' in err[0]
