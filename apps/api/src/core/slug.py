import re
from collections.abc import Awaitable, Callable


def slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    slug = re.sub(r"^-+|-+$", "", slug)
    return slug or "organization"


async def generate_unique_slug(
    name: str,
    slug_exists: Callable[[str], Awaitable[bool]],
) -> str:
    base_slug = slugify(name)
    slug = base_slug
    counter = 2

    while await slug_exists(slug):
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug
