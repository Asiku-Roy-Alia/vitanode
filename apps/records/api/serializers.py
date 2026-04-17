from rest_framework import serializers
from apps.records.models import Encounter, Observation, Medication, LabResult


class ObservationSerializer(serializers.ModelSerializer):
    encounter = serializers.SlugRelatedField(
        slug_field="uuid", queryset=Encounter.objects.all()
    )

    class Meta:
        model = Observation
        fields = [
            "uuid", "encounter", "observation_type", "code", "display_name",
            "value_numeric", "value_text", "unit", "reference_range",
            "status", "recorded_at",
        ]
        read_only_fields = ["uuid"]


class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = [
            "uuid", "encounter", "name", "generic_name", "dose", "dose_unit",
            "frequency", "route", "duration_days", "start_date", "end_date",
            "prescriber_notes", "is_dispensed",
        ]
        read_only_fields = ["uuid"]


class LabResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabResult
        fields = [
            "uuid", "encounter", "test_name", "test_code", "result_value",
            "result_numeric", "unit", "reference_range", "is_abnormal",
            "result_file_uri", "status", "recorded_at", "verified_by",
        ]
        read_only_fields = ["uuid"]


class EncounterListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views and summaries."""
    facility_name = serializers.CharField(source="facility.name", read_only=True, default="")
    provider_name = serializers.CharField(source="provider.name", read_only=True, default="")

    class Meta:
        model = Encounter
        fields = [
            "uuid", "encounter_type", "status", "chief_complaint",
            "facility_name", "provider_name", "start_time", "end_time",
        ]


class EncounterDetailSerializer(serializers.ModelSerializer):
    """Full encounter with nested observations, medications, and lab results."""
    observations = ObservationSerializer(many=True, read_only=True)
    medications = MedicationSerializer(many=True, read_only=True)
    lab_results = LabResultSerializer(many=True, read_only=True)
    facility_name = serializers.CharField(source="facility.name", read_only=True, default="")
    provider_name = serializers.CharField(source="provider.name", read_only=True, default="")

    class Meta:
        model = Encounter
        fields = [
            "uuid", "patient", "provider", "facility", "encounter_type", "status",
            "chief_complaint", "notes", "diagnosis_codes", "start_time", "end_time",
            "facility_name", "provider_name",
            "observations", "medications", "lab_results", "created_at",
        ]
        read_only_fields = ["uuid", "created_at"]
        extra_kwargs = {
            "patient": {"required": False, "allow_null": True},
            "provider": {"required": False, "allow_null": True},
            "facility": {"required": False, "allow_null": True},
        }
