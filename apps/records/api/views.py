from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.records.models import Encounter, Observation, Medication, LabResult
from apps.accounts.models import Patient
from .serializers import (
    EncounterListSerializer, EncounterDetailSerializer,
    ObservationSerializer, MedicationSerializer, LabResultSerializer,
)


class IsPatientOwnerOrProvider(permissions.BasePermission):
    """Allow access if the user owns the record or has active consent."""
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == "sys_admin":
            return True
        if hasattr(obj, "patient"):
            patient = obj.patient
        elif isinstance(obj, Patient):
            patient = obj
        else:
            return False
        if hasattr(user, "patient_profile") and user.patient_profile == patient:
            return True
        if user.role == "provider":
            from apps.consent.models import Consent
            return Consent.objects.filter(
                patient=patient,
                granted_to_provider__user=user,
                is_active=True,
            ).exists()
        return False


class EncounterViewSet(viewsets.ModelViewSet):
    lookup_field = "uuid"
    permission_classes = [permissions.IsAuthenticated, IsPatientOwnerOrProvider]

    def get_serializer_class(self):
        if self.action == "list":
            return EncounterListSerializer
        return EncounterDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "sys_admin":
            return Encounter.objects.all()
        if hasattr(user, "patient_profile"):
            return Encounter.objects.filter(patient=user.patient_profile)
        if user.role == "provider" and hasattr(user, "provider_profile"):
            from apps.consent.models import Consent
            patient_ids = Consent.objects.filter(
                granted_to_provider=user.provider_profile,
                is_active=True,
            ).values_list("patient_id", flat=True)
            return Encounter.objects.filter(patient_id__in=patient_ids)
        return Encounter.objects.none()

    def perform_create(self, serializer):
        """Allow patient UUID in the 'patient' field for self-reported data entry."""
        patient_value = self.request.data.get("patient")
        if patient_value and hasattr(self.request.user, "patient_profile"):
            serializer.save(patient=self.request.user.patient_profile)
        else:
            serializer.save()


class ObservationViewSet(viewsets.ModelViewSet):
    serializer_class = ObservationSerializer
    lookup_field = "uuid"

    def get_queryset(self):
        user = self.request.user
        if user.role == "sys_admin":
            return Observation.objects.all()
        if hasattr(user, "patient_profile"):
            return Observation.objects.filter(encounter__patient=user.patient_profile)
        return Observation.objects.none()


class MedicationViewSet(viewsets.ModelViewSet):
    serializer_class = MedicationSerializer
    lookup_field = "uuid"

    def get_queryset(self):
        user = self.request.user
        if user.role == "sys_admin":
            return Medication.objects.all()
        if hasattr(user, "patient_profile"):
            return Medication.objects.filter(encounter__patient=user.patient_profile)
        return Medication.objects.none()


class LabResultViewSet(viewsets.ModelViewSet):
    serializer_class = LabResultSerializer
    lookup_field = "uuid"

    def get_queryset(self):
        user = self.request.user
        if user.role == "sys_admin":
            return LabResult.objects.all()
        if hasattr(user, "patient_profile"):
            return LabResult.objects.filter(encounter__patient=user.patient_profile)
        return LabResult.objects.none()
