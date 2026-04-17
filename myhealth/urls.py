"""
MyHealth Uganda - URL Configuration
All API endpoints are versioned under /api/v1/ as specified in the technical doc.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "healthy", "service": "Vitanode API"})


urlpatterns = [
    # Health check
    path("health/", health_check, name="health-check"),

    # Django admin
    path("admin/", admin.site.urls),

    # API v1 endpoints
    path("api/v1/", include("apps.core.api.urls")),
    path("api/v1/", include("apps.accounts.api.urls")),
    path("api/v1/", include("apps.records.api.urls")),
    path("api/v1/", include("apps.documents.api.urls")),
    path("api/v1/", include("apps.consent.api.urls")),
    path("api/v1/", include("apps.integrations.api.urls")),
    path("api/v1/", include("apps.analytics.api.urls")),

    # OpenAPI schema and documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
