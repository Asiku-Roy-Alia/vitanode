from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, ProfileView, PatientViewSet, ProviderViewSet, IdentifierViewSet, DeviceViewSet

router = DefaultRouter()
router.register(r"patients", PatientViewSet, basename="patient")
router.register(r"providers", ProviderViewSet, basename="provider")
router.register(r"identifiers", IdentifierViewSet, basename="identifier")
router.register(r"devices", DeviceViewSet, basename="device")

urlpatterns = [
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/profile/", ProfileView.as_view(), name="profile"),
    path("", include(router.urls)),
]
