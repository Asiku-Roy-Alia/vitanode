from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EncounterViewSet, ObservationViewSet, MedicationViewSet, LabResultViewSet

router = DefaultRouter()
router.register(r"encounters", EncounterViewSet, basename="encounter")
router.register(r"observations", ObservationViewSet, basename="observation")
router.register(r"medications", MedicationViewSet, basename="medication")
router.register(r"lab-results", LabResultViewSet, basename="labresult")

urlpatterns = [
    path("", include(router.urls)),
]
