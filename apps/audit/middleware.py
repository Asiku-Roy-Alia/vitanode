"""
Middleware that automatically logs all API requests to the audit trail.
"""
import logging
from django.utils.deprecation import MiddlewareMixin
from .models import AuditLog

logger = logging.getLogger(__name__)

AUDIT_PATHS = ["/api/"]
SKIP_PATHS = ["/api/v1/auth/token/", "/api/v1/schema/", "/health/"]


class AuditMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        path = request.path
        if not any(path.startswith(p) for p in AUDIT_PATHS):
            return response
        if any(path.startswith(p) for p in SKIP_PATHS):
            return response

        method_action_map = {
            "GET": "read",
            "POST": "create",
            "PUT": "update",
            "PATCH": "update",
            "DELETE": "delete",
        }
        action = method_action_map.get(request.method, "read")

        try:
            actor_id = request.user.id if hasattr(request, "user") and request.user.is_authenticated else 0
            actor_type = "system"
            if hasattr(request, "user") and request.user.is_authenticated:
                actor_type = getattr(request.user, "role", "patient")

            AuditLog.objects.create(
                actor_type=actor_type,
                actor_id=actor_id or 0,
                action=action,
                target_type=path,
                target_id="",
                details={"method": request.method, "status": response.status_code},
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
            )
        except Exception as e:
            logger.error(f"Audit logging failed: {e}")

        return response

    def _get_client_ip(self, request):
        x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded:
            return x_forwarded.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")
