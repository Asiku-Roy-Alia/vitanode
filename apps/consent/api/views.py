import io
import base64
import qrcode
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.consent.models import Consent, ShareToken
from apps.accounts.models import Patient
from .serializers import (
    ConsentSerializer, ShareTokenCreateSerializer,
    ShareTokenResponseSerializer, ShareTokenVerifySerializer,
)


class ConsentViewSet(viewsets.ModelViewSet):
    serializer_class = ConsentSerializer
    lookup_field = "uuid"

    def get_queryset(self):
        user = self.request.user
        if user.role == "sys_admin":
            return Consent.objects.all()
        if hasattr(user, "patient_profile"):
            return Consent.objects.filter(patient=user.patient_profile)
        if user.role == "provider" and hasattr(user, "provider_profile"):
            return Consent.objects.filter(granted_to_provider=user.provider_profile)
        return Consent.objects.none()

    @action(detail=True, methods=["post"], url_path="revoke")
    def revoke(self, request, uuid=None):
        consent = self.get_object()
        consent.revoke()
        return Response({"message": "Consent revoked."})


class GenerateQRView(APIView):
    """
    POST /api/v1/patients/{patient_uuid}/qr/
    Patient generates a QR code for a provider to scan.
    Returns the token, expiry, and a base64-encoded QR image.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, patient_uuid):
        try:
            patient = Patient.objects.get(uuid=patient_uuid, user=request.user)
        except Patient.DoesNotExist:
            return Response({"error": "Patient not found."}, status=404)

        serializer = ShareTokenCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        share_token = ShareToken.generate(
            patient=patient,
            scope=serializer.validated_data["scope"],
            ttl_minutes=serializer.validated_data["ttl_minutes"],
        )

        qr_url = f"https://myhealth.ug/qr/{share_token.token}"
        img = qrcode.make(qr_url)
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()

        return Response({
            "token": share_token.token,
            "qr_url": qr_url,
            "qr_image_base64": qr_base64,
            "expires_at": share_token.expires_at.isoformat(),
            "scope": share_token.scope,
        }, status=status.HTTP_201_CREATED)


class VerifyQRView(APIView):
    """
    POST /api/v1/qr/{token}/verify/
    Provider scans QR and gets scoped access to patient records.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, token):
        try:
            share_token = ShareToken.objects.get(token=token)
        except ShareToken.DoesNotExist:
            return Response({"error": "Invalid token."}, status=404)

        if not share_token.is_valid():
            return Response({"error": "Token has expired or already been used."}, status=400)

        if not hasattr(request.user, "provider_profile"):
            return Response({"error": "Only providers can verify QR tokens."}, status=403)

        consent = share_token.redeem(request.user.provider_profile)
        if not consent:
            return Response({"error": "Token could not be redeemed."}, status=400)

        return Response({
            "message": "Access granted.",
            "patient_uuid": str(share_token.patient.uuid),
            "patient_name": f"{share_token.patient.first_name} {share_token.patient.last_name}",
            "scope": consent.scope,
            "expires_at": consent.expires_at.isoformat(),
        })
