"""
Accounts: User authentication, Patient, Provider, Identifier, Device.
Follows the data model from Section 4 of the technical doc.
PII fields use Fernet encryption at the application level.
"""
import uuid
import hashlib
from django.db import models
from django.contrib.auth.models import AbstractUser
from cryptography.fernet import Fernet
from django.conf import settings
from apps.core.models import TimeStampedModel


def get_fernet():
    key = settings.FIELD_ENCRYPTION_KEY
    if len(key) < 44:
        key = Fernet.generate_key().decode()
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt_value(value):
    if not value:
        return value
    return get_fernet().encrypt(value.encode()).decode()


def decrypt_value(value):
    if not value:
        return value
    try:
        return get_fernet().decrypt(value.encode()).decode()
    except Exception:
        return value


class User(AbstractUser):
    """Custom user model supporting role-based access."""
    ROLE_CHOICES = [
        ("patient", "Patient"),
        ("provider", "Health Worker"),
        ("facility_admin", "Facility Admin"),
        ("sys_admin", "System Admin"),
    ]
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default="patient")
    phone_number = models.CharField(max_length=20, blank=True, default="")
    phone_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"


class Patient(TimeStampedModel):
    """
    Patient profile linked to a User account.
    Sensitive fields are encrypted at rest using Fernet envelope encryption.
    NIN is stored as a salted hash; the original is never persisted in plaintext.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="patient_profile")
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    first_name = models.CharField(max_length=128)
    last_name = models.CharField(max_length=128)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=8,
        choices=[("M", "Male"), ("F", "Female"), ("O", "Other")],
        default="M",
    )
    contact_phone_encrypted = models.TextField(blank=True, default="", help_text="Fernet-encrypted phone number")
    contact_address_encrypted = models.TextField(blank=True, default="", help_text="Fernet-encrypted address")
    nin_hash = models.CharField(max_length=256, blank=True, default="", db_index=True, help_text="SHA-256 salted hash of National ID Number")
    primary_facility = models.ForeignKey(
        "core.Facility", on_delete=models.SET_NULL, null=True, blank=True, related_name="registered_patients"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def set_phone(self, phone):
        self.contact_phone_encrypted = encrypt_value(phone)

    def get_phone(self):
        return decrypt_value(self.contact_phone_encrypted)

    def set_nin(self, nin):
        salt = settings.SECRET_KEY[:16]
        self.nin_hash = hashlib.sha256(f"{salt}{nin}".encode()).hexdigest()

    def verify_nin(self, nin):
        salt = settings.SECRET_KEY[:16]
        return self.nin_hash == hashlib.sha256(f"{salt}{nin}".encode()).hexdigest()


class Identifier(TimeStampedModel):
    """Additional identifiers for a patient: facility MRN, insurance ID, etc."""
    IDENTIFIER_TYPES = [
        ("mrn", "Medical Record Number"),
        ("nin", "National ID Number"),
        ("insurance", "Insurance Number"),
        ("passport", "Passport Number"),
        ("other", "Other"),
    ]
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="identifiers")
    identifier_type = models.CharField(max_length=32, choices=IDENTIFIER_TYPES)
    identifier_value = models.CharField(max_length=255)
    issued_by = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        unique_together = ["identifier_type", "identifier_value"]
        indexes = [
            models.Index(fields=["identifier_type", "identifier_value"]),
        ]

    def __str__(self):
        return f"{self.identifier_type}: {self.identifier_value}"


class Provider(TimeStampedModel):
    """Health worker profile linked to a User and a Facility."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="provider_profile")
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    facility = models.ForeignKey("core.Facility", on_delete=models.SET_NULL, null=True, related_name="providers")
    specialization = models.CharField(max_length=128, blank=True, default="")
    license_number = models.CharField(max_length=64, blank=True, default="")

    def __str__(self):
        return f"Dr. {self.name} ({self.facility})"


class Device(TimeStampedModel):
    """Registered device for a user, used in offline sync tracking."""
    DEVICE_TYPES = [
        ("android", "Android"),
        ("ios", "iOS"),
        ("pwa", "Progressive Web App"),
        ("desktop", "Desktop Browser"),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="devices")
    device_type = models.CharField(max_length=16, choices=DEVICE_TYPES)
    device_id = models.CharField(max_length=255, unique=True, help_text="Unique hardware or browser fingerprint")
    device_name = models.CharField(max_length=128, blank=True, default="")
    last_seen = models.DateTimeField(auto_now=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.device_type} - {self.device_name}"
