from backend.helpers import user_helpers


class DummyUser:
    def __init__(self, id):
        self.id = id


class DummyProject:
    query = None

    def __init__(self, id, user_id):
        self.id = id
        self.user_id = user_id


class DummyProjectQuery:
    def __init__(self, id_to_return=1, user_id_to_return=1):
        self.id_to_return = id_to_return
        self.user_id_to_return = user_id_to_return

    def filter_by(self, id, user_id):
        self._filter_id = id
        self._filter_user_id = user_id
        return self

    def first(self):
        if self._filter_id == self.id_to_return and self._filter_user_id == self.user_id_to_return:
            return DummyProject(self._filter_id, self._filter_user_id)
        return None


class DummyTask:
    query = None

    def __init__(self, id, user_id):
        self.id = id
        self.user_id = user_id


class DummyTaskQuery:
    def __init__(self, id_to_return=1, user_id_to_return=1):
        self.id_to_return = id_to_return
        self.user_id_to_return = user_id_to_return

    def filter_by(self, id, user_id):
        self._filter_id = id
        self._filter_user_id = user_id
        return self

    def first(self):
        if self._filter_id == self.id_to_return and self._filter_user_id == self.user_id_to_return:
            return DummyTask(self._filter_id, self._filter_user_id)
        return None


def test_validate_project_id(monkeypatch):
    user = DummyUser(1)
    # Patch Project.query to our dummy
    monkeypatch.setattr(user_helpers, "Project", DummyProject)
    DummyProject.query = DummyProjectQuery()
    # Valid
    data = {"project_id": 1}
    pid, err = user_helpers.validate_project_id(data, user)
    assert pid == 1 and err is None
    # Invalid type
    data = {"project_id": "bad"}
    pid, err = user_helpers.validate_project_id(data, user)
    assert pid is None and "Invalid project ID" in err
    # Not found
    data = {"project_id": 2}
    pid, err = user_helpers.validate_project_id(data, user)
    assert pid is None and "Invalid project ID" in err
    # None
    data = {}
    pid, err = user_helpers.validate_project_id(data, user)
    assert pid is None and err is None


def test_validate_parent_id(monkeypatch):
    user = DummyUser(1)
    monkeypatch.setattr(user_helpers, "Task", DummyTask)
    DummyTask.query = DummyTaskQuery()
    # Valid
    data = {"parent_id": 1}
    pid, err = user_helpers.validate_parent_id(data, user)
    assert pid == 1 and err is None
    # Invalid type
    data = {"parent_id": "bad"}
    pid, err = user_helpers.validate_parent_id(data, user)
    assert pid is None and "Invalid parent task ID" in err
    # Not found
    data = {"parent_id": 2}
    pid, err = user_helpers.validate_parent_id(data, user)
    assert pid is None and "Invalid parent task ID" in err
    # None
    data = {}
    pid, err = user_helpers.validate_parent_id(data, user)
    assert pid is None and err is None
