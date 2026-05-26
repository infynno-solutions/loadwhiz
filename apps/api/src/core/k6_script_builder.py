from __future__ import annotations

import json
from typing import Any

from src.models.load_test import LoadTest, LoadTestType


class K6ScriptBuildError(Exception):
    pass


def build_k6_script(load_test: LoadTest) -> str:
    steps = _normalize_steps(load_test.urls)
    options = _build_options(load_test)
    timeout = f"{load_test.timeout_ms}ms"
    loop_sequence = load_test.test_type == LoadTestType.maintain_load

    steps_json = json.dumps(steps, ensure_ascii=True)
    options_json = json.dumps(options, indent=2, ensure_ascii=True)

    return f"""import http from 'k6/http';
import {{ check, group }} from 'k6';
import {{ Counter }} from 'k6/metrics';
import encoding from 'k6/encoding';

const statusCounts = new Counter('status_counts');

export const options = {options_json};

const steps = {steps_json};
const requestTimeout = '{timeout}';
const loopSequence = {str(loop_sequence).lower()};

function buildUrl(step) {{
  const url = step.url;
  const params = step.request_params || {{}};
  const keys = Object.keys(params);
  if (keys.length === 0) return url;
  const qs = keys.map((k) => `${{encodeURIComponent(k)}}=${{encodeURIComponent(params[k])}}`).join('&');
  return url.includes('?') ? `${{url}}&${{qs}}` : `${{url}}?${{qs}}`;
}}

function buildParams(step, vars) {{
  const headers = Object.assign({{}}, step.headers || {{}});
  if (step.credentials) {{
    const login = step.credentials.login;
    const password = step.credentials.password;
    headers['Authorization'] = 'Basic ' + encoding.b64encode(`${{login}}:${{password}}`);
  }}
  if (step.bearer) {{
    const headerName = step.bearer.header_name || 'Authorization';
    const prefix = step.bearer.prefix || 'Bearer';
    headers[headerName] = `${{prefix}} ${{step.bearer.token}}`.trim();
  }}
  const method = (step.request_type || 'GET').toUpperCase();
  const params = {{
    headers,
    timeout: requestTimeout,
    tags: {{
      name: step.url,
      url: step.url,
      method,
    }},
  }};
  if (step.cookies && Object.keys(step.cookies).length > 0) {{
    params.cookies = step.cookies;
  }}
  return params;
}}

function substituteVars(text, vars) {{
  if (!text || typeof text !== 'string') return text;
  return text.replace(/\\{{\\{{(\\w+)\\}}\\}}/g, (_, name) => vars[name] ?? '');
}}

function executeStep(step, vars) {{
  const url = buildUrl(step);
  const params = buildParams(step, vars);
  const body = substituteVars(step.raw_post_body, vars);
  const method = params.tags.method;
  let res;
  if (method === 'GET') {{
    res = http.get(url, params);
  }} else if (method === 'POST') {{
    res = http.post(url, body || null, params);
  }} else if (method === 'PUT') {{
    res = http.put(url, body || null, params);
  }} else if (method === 'PATCH') {{
    res = http.patch(url, body || null, params);
  }} else if (method === 'DELETE') {{
    res = http.del(url, null, params);
  }} else {{
    res = http.request(method, url, body || null, params);
  }}
  check(res, {{
    'status is 2xx/3xx': (r) => r.status >= 200 && r.status < 400,
  }});
  const expected = res.status >= 200 && res.status < 400;
  statusCounts.add(1, {{
    url: step.url,
    method,
    status: String(res.status),
    expected_response: expected ? 'true' : 'false',
    redirected: res.url && res.url !== url ? 'true' : 'false',
  }});
  if (step.variables) {{
    for (const variable of step.variables) {{
      if (variable.source === 'header' && variable.property) {{
        vars[variable.name] = res.headers[variable.property];
      }}
    }}
  }}
  return res;
}}

export default function () {{
  const vars = {{}};
  do {{
    for (const step of steps) {{
      group(step.url, () => {{
        executeStep(step, vars);
      }});
    }}
  }} while (loopSequence);
}}

export function handleSummary(data) {{
  return {{
    '/output/summary.json': JSON.stringify(data),
  }};
}}
"""


def _normalize_steps(urls: list[Any]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for item in urls:
        if isinstance(item, dict):
            normalized.append(item)
        else:
            raise K6ScriptBuildError("Invalid URL step in load test configuration")
    if not normalized:
        raise K6ScriptBuildError("At least one URL step is required")
    return normalized


def _build_options(load_test: LoadTest) -> dict[str, Any]:
    duration = f"{load_test.duration_seconds}s"
    total = load_test.total_clients
    initial = load_test.initial_clients

    if load_test.test_type == LoadTestType.per_test:
        scenario = {
            "executor": "per-vu-iterations",
            "vus": total,
            "iterations": 1,
            "maxDuration": duration,
        }
    elif load_test.test_type == LoadTestType.per_second:
        ramp_seconds = total
        hold_seconds = max(0, load_test.duration_seconds - ramp_seconds)
        stages = [{"duration": f"{ramp_seconds}s", "target": total}]
        if hold_seconds > 0:
            stages.append({"duration": f"{hold_seconds}s", "target": total})
        scenario = {
            "executor": "ramping-vus",
            "startVUs": 0,
            "stages": stages,
        }
    elif load_test.test_type == LoadTestType.maintain_load:
        scenario = {
            "executor": "ramping-vus",
            "startVUs": 0,
            "stages": [
                {"duration": "1s", "target": initial},
                {"duration": duration, "target": total},
            ],
        }
    else:
        raise K6ScriptBuildError(f"Unsupported test_type: {load_test.test_type}")

    return {
        "scenarios": {"main": scenario},
        "summaryTrendStats": ["avg", "min", "med", "max", "p(90)", "p(95)"],
    }
