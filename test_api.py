"""
Smoke test: validates all core API endpoints are responding correctly.
Run with: python test_api.py
"""
import os
import sys
import django
import json

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myhealth.settings")
django.setup()

from django.test.client import Client

client = Client()

def test(label, method, url, expected_status, data=None, token=None):
    headers = {"content_type": "application/json"}
    if token:
        headers["HTTP_AUTHORIZATION"] = f"Bearer {token}"
    if method == "GET":
        resp = client.get(url, **{k: v for k, v in headers.items() if k.startswith("HTTP")})
    elif method == "POST":
        resp = client.post(url, data=json.dumps(data) if data else "{}", **headers)
    status_ok = resp.status_code == expected_status
    icon = "PASS" if status_ok else "FAIL"
    print(f"  [{icon}] {label}: {method} {url} -> {resp.status_code} (expected {expected_status})")
    if not status_ok:
        try:
            print(f"        Response: {resp.content[:200].decode()}")
        except:
            pass
    return resp

print("\n=== MyHealth Uganda API Smoke Tests ===\n")

# Health check
test("Health check", "GET", "/health/", 200)

# Auth: register a new patient
resp = test("Patient registration", "POST", "/api/v1/auth/register/", 201, {
    "username": "test.patient.smoke",
    "email": "smoke@test.com",
    "password": "TestPass1234!",
    "password_confirm": "TestPass1234!",
    "first_name": "Smoke",
    "last_name": "Test",
})

# Auth: obtain JWT token
resp = test("JWT token obtain", "POST", "/api/v1/auth/token/", 200, {
    "username": "test.patient.smoke",
    "password": "TestPass1234!",
})
token_data = json.loads(resp.content)
patient_token = token_data.get("access", "")

# Auth: obtain provider token
resp = test("Provider JWT token", "POST", "/api/v1/auth/token/", 200, {
    "username": "dr.mukasa",
    "password": "demo1234",
})
provider_token = json.loads(resp.content).get("access", "")

# Auth: obtain admin token
resp = test("Admin JWT token", "POST", "/api/v1/auth/token/", 200, {
    "username": "admin",
    "password": "admin1234",
})
admin_token = json.loads(resp.content).get("access", "")

# Profile
test("Get profile", "GET", "/api/v1/auth/profile/", 200, token=patient_token)

# Patient records
test("List patients", "GET", "/api/v1/patients/", 200, token=patient_token)

# Encounters
test("List encounters", "GET", "/api/v1/encounters/", 200, token=patient_token)

# Observations
test("List observations", "GET", "/api/v1/observations/", 200, token=patient_token)

# Medications
test("List medications", "GET", "/api/v1/medications/", 200, token=patient_token)

# Lab results
test("List lab results", "GET", "/api/v1/lab-results/", 200, token=patient_token)

# Documents
test("List documents", "GET", "/api/v1/documents/", 200, token=patient_token)

# Consents
test("List consents", "GET", "/api/v1/consents/", 200, token=patient_token)

# Analytics (admin only)
test("Analytics summary", "GET", "/api/v1/admin/analytics/summary/", 200, token=admin_token)

# API docs
test("OpenAPI schema", "GET", "/api/schema/", 200)
test("Swagger UI", "GET", "/api/docs/", 200)

# FHIR endpoints (use a known patient)
from apps.accounts.models import Patient
p = Patient.objects.first()
if p:
    test("FHIR Patient", "GET", f"/api/v1/fhir/Patient/{p.uuid}/", 200, token=admin_token)
    enc = p.encounters.first()
    if enc:
        test("FHIR Encounter", "GET", f"/api/v1/fhir/Encounter/{enc.uuid}/", 200, token=admin_token)
    test("FHIR Bundle ($everything)", "GET", f"/api/v1/fhir/Patient/{p.uuid}/everything/", 200, token=admin_token)

# QR sharing flow
from apps.accounts.models import Patient as P2
patient_user_patient = P2.objects.filter(user__username="test.patient.smoke").first()
if patient_user_patient:
    resp = test("Generate QR token", "POST", f"/api/v1/patients/{patient_user_patient.uuid}/qr/", 201,
                data={"scope": ["encounters", "lab_results"], "ttl_minutes": 15},
                token=patient_token)
    if resp.status_code == 201:
        qr_data = json.loads(resp.content)
        tkn = qr_data["token"]
        test("Verify QR token (provider)", "POST", f"/api/v1/qr/{tkn}/verify/", 200, token=provider_token)

print("\n=== Smoke Tests Complete ===\n")
