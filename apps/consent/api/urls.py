from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConsentViewSet, GenerateQRView, VerifyQRView

router = DefaultRouter()
router.register(r"consents", ConsentViewSet, basename="consent")

urlpatterns = [
    path("", include(router.urls)),
    path("patients/<uuid:patient_uuid>/qr/", GenerateQRView.as_view(), name="generate-qr"),
    path("qr/<str:token>/verify/", VerifyQRView.as_view(), name="verify-qr"),
]
