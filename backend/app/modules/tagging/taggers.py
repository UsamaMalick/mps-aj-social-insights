"""Ways to label posts: the LLM, or rules derived from the seed metadata (no API key)."""

import asyncio
import logging
from collections.abc import Sequence
from itertools import batched
from typing import Protocol

from app.core.exceptions import ExternalServiceError
from app.integrations.llm.base import LLMClient, generate_structured
from app.modules.posts.schemas import PostRead
from app.modules.tagging.prompts import PROMPT_VERSION, SYSTEM_PROMPT, build_prompt
from app.modules.tagging.schemas import PostTagCreate, TaggingOutput, TagLabels
from app.seed.generator import seed_labels_by_external_id
from app.shared.enums import TagSource

logger = logging.getLogger(__name__)

CAPTIONS_PER_REQUEST = 25
CONCURRENT_REQUESTS = 4
MAX_OUTPUT_TOKENS = 8_000

RULES_PROMPT_VERSION = "seed-rules-v1"
RULES_MODEL = "seed-metadata"


class Tagger(Protocol):
    source: TagSource

    async def tag(self, posts: Sequence[PostRead]) -> list[PostTagCreate]: ...


class LLMTagger:
    source = TagSource.LLM

    def __init__(self, client: LLMClient) -> None:
        self.client = client
        self._limit = asyncio.Semaphore(CONCURRENT_REQUESTS)

    async def tag(self, posts: Sequence[PostRead]) -> list[PostTagCreate]:
        batches = list(batched(posts, CAPTIONS_PER_REQUEST, strict=False))
        results = await asyncio.gather(*(self._tag_batch(batch) for batch in batches))
        return [tag for batch_tags in results for tag in batch_tags]

    async def _tag_batch(self, posts: Sequence[PostRead]) -> list[PostTagCreate]:
        async with self._limit:
            try:
                output = await generate_structured(
                    self.client,
                    system=SYSTEM_PROMPT,
                    prompt=build_prompt([(ref, post.caption) for ref, post in enumerate(posts)]),
                    output_type=TaggingOutput,
                    effort="low",
                    max_tokens=MAX_OUTPUT_TOKENS,
                )
            except ExternalServiceError as exc:
                logger.error(
                    "tagging batch failed", extra={"posts": len(posts), "error": exc.message}
                )
                return []
        if output is None:
            return []

        by_ref = {item.ref: item for item in output.items}
        missing = [ref for ref in range(len(posts)) if ref not in by_ref]
        if missing:
            logger.warning("llm skipped captions", extra={"missing_refs": missing})
        return [
            PostTagCreate(
                post_id=posts[ref].id,
                source=self.source,
                prompt_version=PROMPT_VERSION,
                model=self.client.model,
                **TagLabels.model_validate(item, from_attributes=True).model_dump(),
            )
            for ref, item in by_ref.items()
            if 0 <= ref < len(posts)
        ]


class SeedRuleTagger:
    """Fallback without an API key: reuse the labels the seed generator planted.

    Posts that did not come from the seed dataset cannot be labelled this way and are skipped.
    """

    source = TagSource.RULES

    async def tag(self, posts: Sequence[PostRead]) -> list[PostTagCreate]:
        truth = seed_labels_by_external_id()
        tags = [
            PostTagCreate(
                post_id=post.id,
                source=self.source,
                prompt_version=RULES_PROMPT_VERSION,
                model=RULES_MODEL,
                **labels.model_dump(),
            )
            for post in posts
            if (labels := truth.get((post.platform, post.external_id))) is not None
        ]
        if len(tags) < len(posts):
            logger.warning(
                "posts without seed metadata need ANTHROPIC_API_KEY to be tagged",
                extra={"skipped": len(posts) - len(tags)},
            )
        return tags
