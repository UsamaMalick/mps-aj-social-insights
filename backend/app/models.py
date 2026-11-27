"""Imports every ORM model so `Base.metadata` is complete (Alembic, test setup)."""

import importlib

MODEL_MODULES: tuple[str, ...] = (
    "app.modules.accounts.models",
    "app.modules.posts.models",
    "app.modules.tagging.models",
    "app.modules.recommendations.models",
)


def load_all_models() -> None:
    for module in MODEL_MODULES:
        importlib.import_module(module)
