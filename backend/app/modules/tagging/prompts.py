"""Prompts for labelling post captions. Bump PROMPT_VERSION whenever the text changes."""

from collections.abc import Sequence
from enum import StrEnum

from app.shared.enums import HookStyle, Region, StoryType, Tone, Topic

PROMPT_VERSION = "tagging-v1"


def _values(enum_cls: type[StrEnum]) -> str:
    return ", ".join(member.value for member in enum_cls)


SYSTEM_PROMPT = f"""You label social media post captions from news organisations. Captions \
may be in Arabic or English; label them the same way regardless of language.

For every caption, choose exactly one value for each label:

- topic ({_values(Topic)}): the subject area of the news.
- region ({_values(Region)}): where the story is set; use "global" if it is not tied to \
one region.
- story_type ({_values(StoryType)}):
  - breaking: first report of a new development ("BREAKING", "عاجل").
  - explainer: background or "what you need to know" content.
  - human_interest: told through individual people or families.
  - analysis: interpretation of causes or consequences, often by experts or correspondents.
  - live_update: ongoing live coverage.
- hook_style ({_values(HookStyle)}): how the first sentence grabs attention:
  - question: opens with a question.
  - statistic: opens with a number or percentage.
  - quote: opens with a direct quotation.
  - bold_claim: opens with a strong assertion.
  - straight_news: a plain factual headline.
- tone ({_values(Tone)}): the overall emotional register.

Label only what the caption says; do not judge the news itself. Return one item per caption, \
using the caption's ref number."""


def build_prompt(captions: Sequence[tuple[int, str]]) -> str:
    """Wrap numbered captions in tags so caption text can never be read as instructions."""
    body = "\n".join(f'<caption ref="{ref}">\n{text}\n</caption>' for ref, text in captions)
    return f"Label each of these {len(captions)} captions.\n\n{body}"
