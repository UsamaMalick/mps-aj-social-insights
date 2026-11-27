from app.shared.enums import DataSourceKind
from app.shared.schemas import BaseSchema


class HealthRead(BaseSchema):
    status: str


class MetaRead(BaseSchema):
    app_title: str
    data_source: DataSourceKind
    llm_enabled: bool
