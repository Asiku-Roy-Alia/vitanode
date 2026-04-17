from rest_framework import serializers
from apps.core.models import Facility


class FacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Facility
        fields = [
            "uuid", "name", "code", "address", "district",
            "latitude", "longitude", "contact_phone", "contact_email",
            "facility_type", "is_active", "created_at",
        ]
        read_only_fields = ["uuid", "created_at"]
