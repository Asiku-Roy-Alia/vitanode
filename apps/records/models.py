"""
Records: Encounter, Observation, Medication, LabResult.
These form the core clinical data model as specified in Section 4.
"""
import uuid
from django.db import models
from apps.core.models import TimeStampedModel


class Encounter(TimeStampedModel):
    """
    A clinical encounter between a patient and provider at a facility.
    Maps to FHIR Encounter resource.
    """
    ENCOUNTER_TYPES = [
        ("outpatient", "Outpatient Visit"),
        ("inpatient", "Inpatient Admission"),
        ("emergency", "Emergency Visit"),
        ("referral", "Referral"),
        ("lab_only", "Lab Visit Only"),
        ("pharmacy", "Pharmacy Visit"),
        ("anc", "Antenatal Care"),
        ("immunization", "Immunization"),
        ("chronic_review", "Chronic Care Review"),
    ]
    STATUS_CHOICES = [
        ("in_progress", "In Progress"),
        ("finished", "Finished"),
        ("cancelled", "Cancelled"),
    ]
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    patient = models.ForeignKey("accounts.Patient", on_delete=models.CASCADE, related_name="encounters")
    provider = models.ForeignKey("accounts.Provider", on_delete=models.SET_NULL, null=True, blank=True, related_name="encounters")
    facility = models.ForeignKey("core.Facility", on_delete=models.SET_NULL, null=True, blank=True, related_name="encounters")
    encounter_type = models.CharField(max_length=32, choices=ENCOUNTER_TYPES, default="outpatient")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="in_progress")
    chief_complaint = models.TextField(blank=True, default="")
    notes = models.TextField(blank=True, default="")
    diagnosis_codes = models.JSONField(default=list, blank=True, help_text="List of ICD-10 codes")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-start_time"]
        indexes = [
            models.Index(fields=["patient", "start_time"]),
            models.Index(fields=["facility", "start_time"]),
        ]

    def __str__(self):
        return f"{self.encounter_type} - {self.patient} ({self.start_time:%Y-%m-%d})"


class Observation(TimeStampedModel):
    """
    Clinical observation recorded during an encounter.
    Maps to FHIR Observation resource. Covers vitals, symptoms, findings.
    """
    STATUS_CHOICES = [
        ("preliminary", "Preliminary"),
        ("final", "Final"),
        ("amended", "Amended"),
        ("cancelled", "Cancelled"),
    ]
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    encounter = models.ForeignKey(Encounter, on_delete=models.CASCADE, related_name="observations")
    observation_type = models.CharField(max_length=64, help_text="Category: vital_sign, symptom, finding, social_history")
    code = models.CharField(max_length=32, help_text="LOINC or local code for the observation")
    display_name = models.CharField(max_length=255, blank=True, default="")
    value_numeric = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    value_text = models.TextField(blank=True, default="")
    unit = models.CharField(max_length=32, blank=True, default="")
    reference_range = models.CharField(max_length=64, blank=True, default="")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="final")
    recorded_at = models.DateTimeField()

    class Meta:
        ordering = ["-recorded_at"]

    def __str__(self):
        val = self.value_numeric if self.value_numeric is not None else self.value_text
        return f"{self.display_name}: {val} {self.unit}"


class Medication(TimeStampedModel):
    """
    Medication prescribed or dispensed during an encounter.
    Maps to FHIR MedicationRequest resource.
    """
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    encounter = models.ForeignKey(Encounter, on_delete=models.CASCADE, related_name="medications")
    name = models.CharField(max_length=255)
    generic_name = models.CharField(max_length=255, blank=True, default="")
    dose = models.CharField(max_length=64)
    dose_unit = models.CharField(max_length=32, blank=True, default="")
    frequency = models.CharField(max_length=64, help_text="Dosing frequency, for example: twice daily")
    route = models.CharField(max_length=32, blank=True, default="oral")
    duration_days = models.PositiveIntegerField(null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    prescriber_notes = models.TextField(blank=True, default="")
    is_dispensed = models.BooleanField(default=False)

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.name} {self.dose} - {self.frequency}"


class LabResult(TimeStampedModel):
    """
    Laboratory test result linked to an encounter.
    Maps to FHIR DiagnosticReport resource.
    """
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("preliminary", "Preliminary"),
        ("final", "Final"),
        ("amended", "Amended"),
    ]
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    encounter = models.ForeignKey(Encounter, on_delete=models.CASCADE, related_name="lab_results")
    test_name = models.CharField(max_length=255)
    test_code = models.CharField(max_length=32, blank=True, default="", help_text="LOINC code")
    result_value = models.CharField(max_length=255, blank=True, default="")
    result_numeric = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    unit = models.CharField(max_length=32, blank=True, default="")
    reference_range = models.CharField(max_length=64, blank=True, default="")
    is_abnormal = models.BooleanField(default=False)
    result_file_uri = models.URLField(blank=True, default="", help_text="Link to PDF or image of the result")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="final")
    recorded_at = models.DateTimeField()
    verified_by = models.ForeignKey(
        "accounts.Provider", on_delete=models.SET_NULL, null=True, blank=True, related_name="verified_labs"
    )

    class Meta:
        ordering = ["-recorded_at"]

    def __str__(self):
        return f"{self.test_name}: {self.result_value} {self.unit}"
