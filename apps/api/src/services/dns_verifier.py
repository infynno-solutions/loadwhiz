import dns.exception
import dns.resolver

from src.core.config import settings


def check_dns_txt(hostname: str, token: str) -> tuple[bool, str]:
    prefix = settings.host_verification_dns_prefix
    record_name = f"{prefix}.{hostname}"
    expected = f"{prefix}={token}"

    resolver = dns.resolver.Resolver()
    resolver.lifetime = float(settings.host_verify_dns_timeout_seconds)

    try:
        answers = resolver.resolve(record_name, "TXT")
        for rdata in answers:
            for txt_string in rdata.strings:
                if isinstance(txt_string, bytes):
                    txt_string = txt_string.decode("utf-8", errors="replace")
                if txt_string.strip() == expected:
                    return True, ""
        return False, f"TXT record '{expected}' not found at {record_name}"
    except dns.resolver.NXDOMAIN:
        return False, f"No DNS records found at {record_name} — the record may not have propagated yet"
    except dns.resolver.NoAnswer:
        return False, f"No TXT records at {record_name}"
    except dns.exception.Timeout:
        return False, f"DNS lookup timed out for {record_name}"
    except dns.exception.DNSException as exc:
        return False, f"DNS error: {exc}"
