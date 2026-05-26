import ipaddress
import socket
from urllib.parse import urlparse


_BLOCKED_HOSTNAMES = {
    "localhost",
    "localhost.localdomain",
}

_BLOCKED_SUFFIXES = (
    ".local",
    ".internal",
    ".localhost",
    ".invalid",
    ".example",
    ".test",
)

_PRIVATE_NETWORKS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("169.254.169.254/32"),
]


class HostValidationError(ValueError):
    pass


def _is_private_ip(addr: str) -> bool:
    try:
        ip = ipaddress.ip_address(addr)
        return any(ip in net for net in _PRIVATE_NETWORKS)
    except ValueError:
        return False


def _resolve_and_check(hostname: str) -> None:
    try:
        results = socket.getaddrinfo(hostname, None)
    except OSError:
        return

    ips = {r[4][0] for r in results}
    if ips and all(_is_private_ip(ip) for ip in ips):
        raise HostValidationError(
            f"Hostname '{hostname}' resolves only to private/reserved IP addresses"
        )


def parse_host_input(raw: str) -> str:
    if not raw or not raw.strip():
        raise HostValidationError("Hostname must not be empty")

    value = raw.strip()

    if "://" not in value:
        value = "//" + value

    parsed = urlparse(value)
    hostname = parsed.hostname

    if not hostname:
        raise HostValidationError("Could not extract a hostname from the input")

    if hostname.startswith("*"):
        raise HostValidationError("Wildcard hostnames are not allowed")

    if hostname.startswith(".") or hostname.endswith("."):
        raise HostValidationError("Hostname must not start or end with a dot")

    try:
        ipaddress.ip_address(hostname)
        raise HostValidationError("IP address literals are not allowed; use a domain name")
    except ValueError:
        pass

    if "." not in hostname:
        raise HostValidationError(
            "Single-label hostnames are not allowed; use a fully qualified domain name"
        )

    if hostname in _BLOCKED_HOSTNAMES:
        raise HostValidationError(f"Hostname '{hostname}' is not allowed")

    for suffix in _BLOCKED_SUFFIXES:
        if hostname.endswith(suffix):
            raise HostValidationError(
                f"Hostnames ending with '{suffix}' are not allowed"
            )

    try:
        hostname = hostname.encode("idna").decode("ascii")
    except (UnicodeError, UnicodeDecodeError):
        raise HostValidationError(f"Hostname '{hostname}' is not a valid international domain name")

    if len(hostname) > 255:
        raise HostValidationError("Hostname must not exceed 255 characters")

    _resolve_and_check(hostname)

    return hostname


def is_private_ip(addr: str) -> bool:
    return _is_private_ip(addr)
