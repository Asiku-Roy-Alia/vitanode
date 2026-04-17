from rest_framework import serializers
from apps.consent.models import Consent, ShareToken


class ConsentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consent
        fields = [
            "uuid", "patient", "granted_to_provider", "granted_to_facility",
            "scope", "purpose", "expires_at", "is_active", "revoked_at", "created_at",
        ]
        read_only_fields = ["uuid", "revoked_at", "created_at"]


class ShareTokenCreateSerializer(serializers.Serializer):
    scope = serializers.ListField(child=serializers.CharField(), default=["full"])
    ttl_minutes = serializers.IntegerField(default=10, min_value=1, max_value=1440)


class ShareTokenResponseSerializer(serializers.ModelSerializer):
    qr_url = serializers.SerializerMethodField()

    class Meta:
        model = ShareToken
        fields = ["token", "scope", "expires_at", "qr_url", "is_single_use"]

    def get_qr_url(self, obj):
        return f"https://myhealth.ug/qr/{obj.token}"


class ShareTokenVerifySerializer(serializers.Serializer):
    token = serializers.CharField()
