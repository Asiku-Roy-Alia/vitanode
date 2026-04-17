from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from apps.accounts.models import Patient
from apps.records.models import Encounter, Observation, LabResult
from apps.integrations.fhir import (
    patient_to_fhir, encounter_to_fhir, observation_to_fhir,
    lab_result_to_fhir, fhir_bundle,
)


class FHIRPatientView(APIView):
    """GET /api/v1/fhir/Patient/{id} - Export patient as FHIR resource."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, patient_uuid):
        try:
            patient = Patient.objects.get(uuid=patient_uuid)
        except Patient.DoesNotExist:
            return Response({"error": "Patient not found"}, status=404)
        return Response(patient_to_fhir(patient))


class FHIREncounterView(APIView):
    """GET /api/v1/fhir/Encounter/{id} - Export encounter as FHIR resource."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, encounter_uuid):
        try:
            encounter = Encounter.objects.select_related("patient", "facility").get(uuid=encounter_uuid)
        except Encounter.DoesNotExist:
            return Response({"error": "Encounter not found"}, status=404)
        return Response(encounter_to_fhir(encounter))


class FHIRBundleView(APIView):
    """
    GET /api/v1/fhir/Patient/{id}/everything - Export all patient data as FHIR Bundle.
    POST /api/v1/fhir/Bundle/ - Accept inbound FHIR Bundle from facility EMR.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, patient_uuid):
        try:
            patient = Patient.objects.get(uuid=patient_uuid)
        except Patient.DoesNotExist:
            return Response({"error": "Patient not found"}, status=404)

        resources = [patient_to_fhir(patient)]
        for enc in Encounter.objects.filter(patient=patient).select_related("facility"):
            resources.append(encounter_to_fhir(enc))
        for obs in Observation.objects.filter(encounter__patient=patient):
            resources.append(observation_to_fhir(obs))
        for lab in LabResult.objects.filter(encounter__patient=patient):
            resources.append(lab_result_to_fhir(lab))

        return Response(fhir_bundle(resources))

    def post(self, request):
        """Accept a FHIR Bundle and map entries to local models."""
        bundle = request.data
        if bundle.get("resourceType") != "Bundle":
            return Response({"error": "Expected a FHIR Bundle"}, status=400)

        processed = 0
        errors = []
        for entry in bundle.get("entry", []):
            resource = entry.get("resource", {})
            rtype = resource.get("resourceType")
            # Stub: in production, each resource type maps to a local model create/update
            processed += 1

        return Response({
            "message": f"Processed {processed} resources.",
            "errors": errors,
        }, status=status.HTTP_201_CREATED)
