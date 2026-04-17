"""
MyHealth Uganda - Investor Demo Walkthrough
============================================
This script simulates the complete patient journey for a live demo.
Run it while the server is running to see the platform in action.

Usage: python demo_walkthrough.py
"""
import os
import sys
import json
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myhealth.settings")
django.setup()

from django.test.client import Client

client = Client()
BASE = ""

def header(text):
    print(f"\n{'='*70}")
    print(f"  {text}")
    print(f"{'='*70}\n")

def step(num, text):
    print(f"  Step {num}: {text}")

def show_json(data, indent=4, max_keys=None):
    if max_keys and isinstance(data, dict):
        trimmed = {k: data[k] for k in list(data.keys())[:max_keys]}
        if len(data) > max_keys:
            trimmed["..."] = f"({len(data) - max_keys} more fields)"
        data = trimmed
    print(f"    {json.dumps(data, indent=indent, default=str)}")

def api(method, url, data=None, token=None):
    headers = {"content_type": "application/json"}
    if token:
        headers["HTTP_AUTHORIZATION"] = f"Bearer {token}"
    if method == "POST":
        resp = client.post(url, data=json.dumps(data) if data else "{}", **headers)
    else:
        resp = client.get(url, **{k: v for k, v in headers.items() if k.startswith("HTTP")})
    return json.loads(resp.content) if resp.content else {}

# ============================================================
header("MYHEALTH UGANDA - LIVE INVESTOR DEMO")
print("  This walkthrough demonstrates the complete patient journey:")
print("  registration, record viewing, QR sharing, and FHIR export.\n")

# STEP 1: Patient Registration
header("1. PATIENT REGISTRATION")
step(1, "A new patient registers on the MyHealth app")
reg_data = api("POST", "/api/v1/auth/register/", {
    "username": "demo.amina.nakato",
    "email": "amina@example.com",
    "password": "SecurePass2024!",
    "password_confirm": "SecurePass2024!",
    "first_name": "Amina",
    "last_name": "Nakato",
    "phone_number": "+256701234567",
})
print(f"    Registration response:")
show_json(reg_data)

# STEP 2: Authentication
header("2. SECURE AUTHENTICATION")
step(2, "Patient logs in and receives a JWT token")
token_data = api("POST", "/api/v1/auth/token/", {
    "username": "demo.amina.nakato",
    "password": "SecurePass2024!",
})
patient_token = token_data.get("access", "")
print(f"    Access token: {patient_token[:50]}...")
print(f"    Refresh token: {token_data.get('refresh', '')[:50]}...")

# STEP 3: View Profile
header("3. PATIENT HEALTH WALLET")
step(3, "Patient views their profile and health summary")
profile = api("GET", "/api/v1/auth/profile/", token=patient_token)
print(f"    Patient profile:")
show_json(profile)

# Get a demo patient with actual data
from apps.accounts.models import Patient
demo_patient = Patient.objects.filter(encounters__isnull=False).first()
demo_user = demo_patient.user
demo_token_data = api("POST", "/api/v1/auth/token/", {
    "username": demo_user.username, "password": "demo1234",
})
demo_token = demo_token_data.get("access", "")

step(4, f"Viewing health wallet for {demo_patient.first_name} {demo_patient.last_name}")
summary = api("GET", f"/api/v1/patients/{demo_patient.uuid}/summary/", token=demo_token)
print(f"    Health wallet summary:")
show_json(summary, max_keys=8)

# STEP 4: Clinical Records
header("4. CLINICAL RECORDS")
step(5, "Viewing recent encounters")
encounters = api("GET", "/api/v1/encounters/", token=demo_token)
enc_list = encounters.get("results", [])
print(f"    Total encounters: {encounters.get('count', 0)}")
if enc_list:
    print(f"    Most recent encounter:")
    show_json(enc_list[0])

step(6, "Viewing lab results")
labs = api("GET", "/api/v1/lab-results/", token=demo_token)
lab_list = labs.get("results", [])
print(f"    Total lab results: {labs.get('count', 0)}")
if lab_list:
    print(f"    Latest lab result:")
    show_json(lab_list[0])

step(7, "Viewing medications")
meds = api("GET", "/api/v1/medications/", token=demo_token)
med_list = meds.get("results", [])
print(f"    Active medications: {meds.get('count', 0)}")
if med_list:
    print(f"    Current medication:")
    show_json(med_list[0])

# STEP 5: QR Sharing
header("5. QR-BASED INSTANT SHARING")
step(8, "Patient generates a QR code to share records with a new doctor")
qr_result = api("POST", f"/api/v1/patients/{demo_patient.uuid}/qr/", {
    "scope": ["encounters", "lab_results", "medications"],
    "ttl_minutes": 15,
}, token=demo_token)
print(f"    QR token generated:")
print(f"    URL: {qr_result.get('qr_url', '')}")
print(f"    Expires: {qr_result.get('expires_at', '')}")
print(f"    Scope: {qr_result.get('scope', [])}")
print(f"    QR image: (base64 PNG, {len(qr_result.get('qr_image_base64', ''))} bytes)")

step(9, "Doctor scans the QR code and verifies access")
provider_token_data = api("POST", "/api/v1/auth/token/", {
    "username": "dr.mukasa", "password": "demo1234",
})
provider_token = provider_token_data.get("access", "")
verify_result = api("POST", f"/api/v1/qr/{qr_result['token']}/verify/", token=provider_token)
print(f"    Verification result:")
show_json(verify_result)

# STEP 6: FHIR Export
header("6. FHIR INTEROPERABILITY")
step(10, "Exporting patient data as a standard FHIR Bundle")
admin_token = api("POST", "/api/v1/auth/token/", {
    "username": "admin", "password": "admin1234",
}).get("access", "")
bundle = api("GET", f"/api/v1/fhir/Patient/{demo_patient.uuid}/everything/", token=admin_token)
print(f"    FHIR Bundle type: {bundle.get('type', '')}")
print(f"    Total resources: {bundle.get('total', 0)}")
resource_types = {}
for entry in bundle.get("entry", []):
    rt = entry.get("resource", {}).get("resourceType", "Unknown")
    resource_types[rt] = resource_types.get(rt, 0) + 1
print(f"    Resources by type: {json.dumps(resource_types)}")

# STEP 7: Analytics
header("7. ADMIN DASHBOARD ANALYTICS")
step(11, "System-wide KPIs for monitoring and reporting")
analytics = api("GET", "/api/v1/admin/analytics/summary/", token=admin_token)
print(f"    Platform KPIs:")
show_json(analytics)

# Final summary
header("DEMO COMPLETE")
print("  MyHealth Uganda demonstrates:")
print("  1. Secure patient registration and JWT authentication")
print("  2. Patient-owned health wallet with full clinical history")
print("  3. Instant QR-based sharing with time-limited, scoped access")
print("  4. FHIR-compliant data export for EMR interoperability")
print("  5. Immutable audit trail for every data access")
print("  6. Real-time analytics dashboard for platform monitoring")
print()
print("  Ready for pilot deployment at 2 health facilities.")
print("  Target: validate with real patients and clinicians over 4 months.")
print()
print(f"  API docs: http://localhost:8000/api/docs/")
print(f"  Admin panel: http://localhost:8000/admin/")
print()

# Cleanup demo user
from django.contrib.auth import get_user_model
User = get_user_model()
User.objects.filter(username="demo.amina.nakato").delete()
