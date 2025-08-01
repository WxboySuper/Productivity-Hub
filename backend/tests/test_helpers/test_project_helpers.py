import pytest

from backend.helpers import project_helpers


def test_serialize_project():
    class Dummy:
        def __init__(self):
            self.id = 1
            self.name = "Test"
            self.description = "Desc"
            import datetime

            self.created_at = datetime.datetime(2020, 1, 1)
            self.updated_at = datetime.datetime(2020, 1, 2)

    d = Dummy()
    result = project_helpers.serialize_project(d)
    assert result["id"] == 1
    assert result["name"] == "Test"
    assert result["description"] == "Desc"
    assert result["created_at"].startswith("2020-01-01")
    assert result["updated_at"].startswith("2020-01-02")


def test_validate_project_name():
    # Valid
    data = {"name": "  Project  "}
    name, err = project_helpers.validate_project_name(data)
    assert name == "Project" and err is None
    # Missing
    data = {}
    name, err = project_helpers.validate_project_name(data)
    assert name is None and "required" in err
    # Blank
    data = {"name": "   "}
    name, err = project_helpers.validate_project_name(data)
    assert name is None and "required" in err
