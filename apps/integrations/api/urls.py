from django.urls import path
from .views import FHIRPatientView, FHIREncounterView, FHIRBundleView

urlpatterns = [
    path("fhir/Patient/<uuid:patient_uuid>/", FHIRPatientView.as_view(), name="fhir-patient"),
    path("fhir/Encounter/<uuid:encounter_uuid>/", FHIREncounterView.as_view(), name="fhir-encounter"),
    path("fhir/Patient/<uuid:patient_uuid>/everything/", FHIRBundleView.as_view(), name="fhir-bundle-patient"),
    path("fhir/Bundle/", FHIRBundleView.as_view(), name="fhir-bundle-ingest"),
]
