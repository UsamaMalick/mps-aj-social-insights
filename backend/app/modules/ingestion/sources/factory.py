from app.core.config import Settings
from app.modules.ingestion.sources.base import DataSource
from app.modules.ingestion.sources.meta import MetaDataSource
from app.modules.ingestion.sources.seed import SeedDataSource
from app.shared.enums import DataSourceKind


def get_data_source(settings: Settings) -> DataSource:
    """The single place that maps `DATA_SOURCE` to an implementation."""
    match settings.data_source:
        case DataSourceKind.SEED:
            return SeedDataSource()
        case DataSourceKind.META:
            return MetaDataSource()
