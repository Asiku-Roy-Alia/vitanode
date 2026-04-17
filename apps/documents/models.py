"""
Documents: Patient document uploads (PDFs, images, scanned records).
Supports the patient health wallet concept from the business plan.
"""
import uuid
import hashlib
from django.db import models
from apps.core.models import TimeStampedModel


class Document(TimeStampedModel):
    """
    A document uploaded by or on behalf of a patient.
    Documents are stored in S3-compatible object storage.
    File hash ensures deduplication and integrity verification.
    """
    DOCUMENT_TYPES = [
        ("lab_report", "Lab Report"),
        ("prescription", "Prescription"),
        ("discharge_summary", "Discharge Summary"),
        ("referral_letter", "Referral Letter"),
        ("imaging", "Imaging / Radiology"),
        ("insurance_card", "Insurance Card"),
        ("immunization", "Immunization Record"),
        ("consent_form", "Consent Form"),
        ("other", "Other"),
    ]
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    patient = models.ForeignKey("accounts.Patient", on_delete=models.CASCADE, related_name="documents")
    encounter = models.ForeignKey(
        "records.Encounter", on_delete=models.SET_NULL, null=True, blank=True, related_name="documents"
    )
    document_type = models.CharField(max_length=32, choices=DOCUMENT_TYPES, default="other")
    title = models.CharField(max_length=255, blank=True, default="")
    description = models.TextField(blank=True, default="")
    mime_type = models.CharField(max_length=64, default="application/pdf")
    file = models.FileField(upload_to="patient_documents/%Y/%m/")
    file_uri = models.URLField(blank=True, default="", help_text="External URI if stored in S3")
    file_hash = models.CharField(max_length=64, unique=True, help_text="SHA-256 hash for deduplication")
    file_size_bytes = models.PositiveIntegerField(default=0)
    uploaded_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="uploaded_documents"
    )
    is_verified = models.BooleanField(default=False, help_text="Verified by a health worker")
    verified_by = models.ForeignKey(
        "accounts.Provider", on_delete=models.SET_NULL, null=True, blank=True, related_name="verified_documents"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.document_type}: {self.title}"

    def compute_hash(self, file_content):
        self.file_hash = hashlib.sha256(file_content).hexdigest()
        return self.file_hash
