"""Imports every ORM model so `Base.metadata` is complete (Alembic, test setup)."""

import importlib

MODEL_MODULES: tuple[str, ...] = ()


def load_all_models() -> None:
    for module in MODEL_MODULES:
        importlib.import_module(module)
