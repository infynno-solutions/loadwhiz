import socket

import httpx

from src.core.config import settings
from src.core.host_validation import is_private_ip


def _resolve_and_block_private(hostname: str) -> None:
    try:
        results = socket.getaddrinfo(hostname, None)
    except OSError as exc:
        raise ValueError(f"Cannot resolve hostname '{hostname}': {exc}") from exc

    for info in results:
        ip = info[4][0]
        if is_private_ip(ip):
            raise ValueError(
                f"Hostname '{hostname}' resolves to a private/reserved IP ({ip}) — request blocked"
            )


class _SSRFTransport(httpx.HTTPTransport):
    def handle_request(self, request: httpx.Request) -> httpx.Response:
        host = request.url.host
        _resolve_and_block_private(host)
        return super().handle_request(request)


def check_http_file(hostname: str, token: str) -> tuple[bool, str]:
    path = settings.host_verification_http_path
    timeout = float(settings.host_verify_http_timeout_seconds)

    try:
        _resolve_and_block_private(hostname)
    except ValueError as exc:
        return False, str(exc)

    schemes = ["https", "http"]
    last_error = ""

    with httpx.Client(
        transport=_SSRFTransport(),
        follow_redirects=True,
        max_redirects=3,
        timeout=timeout,
    ) as client:
        for scheme in schemes:
            url = f"{scheme}://{hostname}{path}"
            try:
                resp = client.get(url)
                if resp.status_code == 200:
                    body = resp.text.strip()
                    if body == token:
                        return True, ""
                    return False, (
                        f"File found at {url} but content does not match — "
                        f"expected '{token}', got '{body[:120]}'"
                    )
                return False, f"Got HTTP {resp.status_code} from {url}"
            except (httpx.ConnectError, httpx.ConnectTimeout, httpx.RemoteProtocolError) as exc:
                last_error = f"Connection failed for {url}: {exc}"
                if scheme == "https":
                    continue
                return False, last_error
            except httpx.TimeoutException:
                return False, f"Request timed out for {url}"
            except ValueError as exc:
                return False, str(exc)
            except httpx.HTTPError as exc:
                return False, f"HTTP error for {url}: {exc}"

    return False, last_error
