from rest_framework import viewsets, permissions, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.documents.models import Document
from .serializers import DocumentSerializer, DocumentListSerializer


class DocumentViewSet(viewsets.ModelViewSet):
    lookup_field = "uuid"
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_serializer_class(self):
        if self.action == "list":
            return DocumentListSerializer
        return DocumentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "sys_admin":
            return Document.objects.all()
        if hasattr(user, "patient_profile"):
            return Document.objects.filter(patient=user.patient_profile)
        return Document.objects.none()

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, uuid=None):
        doc = self.get_object()
        if doc.file_uri:
            return Response({"download_url": doc.file_uri})
        if doc.file:
            return Response({"download_url": request.build_absolute_uri(doc.file.url)})
        return Response({"error": "File not available"}, status=404)
