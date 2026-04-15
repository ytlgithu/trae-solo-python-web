from bleach.sanitizer import Cleaner
from django import template
from django.utils.safestring import mark_safe
from markdown import markdown

register = template.Library()

_cleaner = Cleaner(
    tags=[
        "a",
        "abbr",
        "b",
        "blockquote",
        "br",
        "code",
        "del",
        "em",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "hr",
        "i",
        "img",
        "li",
        "ol",
        "p",
        "pre",
        "strong",
        "ul",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
    ],
    attributes={
        "*": ["class", "id"],
        "a": ["href", "title", "rel", "target"],
        "img": ["src", "alt", "title", "loading"],
    },
    protocols=["http", "https", "mailto"],
    strip=True,
)


@register.filter(name="render_markdown")
def render_markdown(text: str) -> str:
    if not text:
        return ""
    html = markdown(
        text,
        extensions=[
            "extra",
            "fenced_code",
            "tables",
            "toc",
        ],
        output_format="html5",
    )
    cleaned = _cleaner.clean(html)
    return mark_safe(cleaned)
