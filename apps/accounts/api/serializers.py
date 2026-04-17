from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.accounts.models import Patient, Provider, Identifier, Device

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password_confirm", "first_name", "last_name", "phone_number"]

    def validate(self, data):
        if data["password"] != data.pop("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            phone_number=validated_data.get("phone_number", ""),
            role="patient",
        )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["uuid", "username", "email", "first_name", "last_name", "role", "phone_number", "phone_verified"]
        read_only_fields = ["uuid", "role", "phone_verified"]


class PatientSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    nin = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Patient
        fields = [
            "uuid", "first_name", "last_name", "date_of_birth", "gender",
            "phone", "nin", "primary_facility", "created_at",
        ]
        read_only_fields = ["uuid", "created_at"]

    def create(self, validated_data):
        phone = validated_data.pop("phone", "")
        nin = validated_data.pop("nin", "")
        patient = Patient.objects.create(**validated_data)
        if phone:
            patient.set_phone(phone)
        if nin:
            patient.set_nin(nin)
        patient.save()
        return patient

    def update(self, instance, validated_data):
        phone = validated_data.pop("phone", None)
        nin = validated_data.pop("nin", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if phone is not None:
            instance.set_phone(phone)
        if nin is not None:
            instance.set_nin(nin)
        instance.save()
        return instance


class PatientSummarySerializer(serializers.ModelSerializer):
    """Read-only summary for the patient health wallet view."""
    total_encounters = serializers.IntegerField(read_only=True)
    total_documents = serializers.IntegerField(read_only=True)
    recent_encounters = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            "uuid", "first_name", "last_name", "date_of_birth", "gender",
            "total_encounters", "total_documents", "recent_encounters",
        ]

    def get_recent_encounters(self, obj):
        from apps.records.api.serializers import EncounterListSerializer
        recent = obj.encounters.all()[:5]
        return EncounterListSerializer(recent, many=True).data


class ProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Provider
        fields = ["uuid", "name", "facility", "specialization", "license_number"]
        read_only_fields = ["uuid"]


class IdentifierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Identifier
        fields = ["id", "identifier_type", "identifier_value", "issued_by", "created_at"]
        read_only_fields = ["created_at"]


class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ["id", "device_type", "device_id", "device_name", "last_seen", "last_sync_at", "is_active"]
        read_only_fields = ["last_seen"]
