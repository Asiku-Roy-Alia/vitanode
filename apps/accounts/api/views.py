from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Count
from apps.accounts.models import Patient, Provider, Identifier, Device
from .serializers import (
    UserRegistrationSerializer, UserProfileSerializer,
    PatientSerializer, PatientSummarySerializer,
    ProviderSerializer, IdentifierSerializer, DeviceSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/ - Patient self-registration."""
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        Patient.objects.create(
            user=user,
            first_name=user.first_name,
            last_name=user.last_name,
        )
        return Response(
            {"message": "Registration successful.", "uuid": str(user.uuid)},
            status=status.HTTP_201_CREATED,
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/auth/profile/ - Current user profile."""
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user


class PatientViewSet(viewsets.ModelViewSet):
    """CRUD for patient profiles. Patients can only access their own record."""
    serializer_class = PatientSerializer
    lookup_field = "uuid"

    def get_queryset(self):
        user = self.request.user
        if user.role in ("sys_admin", "facility_admin"):
            return Patient.objects.all()
        return Patient.objects.filter(user=user)

    @action(detail=True, methods=["get"], url_path="summary")
    def summary(self, request, uuid=None):
        patient = self.get_object()
        patient.total_encounters = patient.encounters.count()
        patient.total_documents = patient.documents.count()
        serializer = PatientSummarySerializer(patient)
        return Response(serializer.data)


class ProviderViewSet(viewsets.ModelViewSet):
    serializer_class = ProviderSerializer
    queryset = Provider.objects.all()
    lookup_field = "uuid"


class IdentifierViewSet(viewsets.ModelViewSet):
    serializer_class = IdentifierSerializer

    def get_queryset(self):
        return Identifier.objects.filter(patient__user=self.request.user)

    def perform_create(self, serializer):
        patient = Patient.objects.get(user=self.request.user)
        serializer.save(patient=patient)


class DeviceViewSet(viewsets.ModelViewSet):
    serializer_class = DeviceSerializer

    def get_queryset(self):
        return Device.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
