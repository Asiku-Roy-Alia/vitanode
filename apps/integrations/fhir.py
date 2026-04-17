"""
FHIR resource mapping: local Django models to FHIR JSON.
Implements the pragmatic compatibility layer from Section 7.
This is not a fully certified FHIR server but provides export and import
mappings for core resources: Patient, Encounter, Observation, DiagnosticReport.
"""
from datetime import date


def patient_to_fhir(patient):
    """Map a Patient model instance to a FHIR Patient resource dict."""
    resource = {
        "resourceType": "Patient",
        "id": str(patient.uuid),
        "active": patient.is_active,
        "name": [{
            "use": "official",
            "family": patient.last_name,
            "given": [patient.first_name],
        }],
        "gender": {"M": "male", "F": "female", "O": "other"}.get(patient.gender, "unknown"),
    }
    if patient.date_of_birth:
        resource["birthDate"] = patient.date_of_birth.isoformat()
    return resource


def encounter_to_fhir(encounter):
    """Map an Encounter model instance to a FHIR Encounter resource dict."""
    status_map = {
        "in_progress": "in-progress",
        "finished": "finished",
        "cancelled": "cancelled",
    }
    resource = {
        "resourceType": "Encounter",
        "id": str(encounter.uuid),
        "status": status_map.get(encounter.status, "unknown"),
        "class": {
            "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            "code": "AMB" if encounter.encounter_type == "outpatient" else "IMP",
        },
        "subject": {"reference": f"Patient/{encounter.patient.uuid}"},
        "period": {
            "start": encounter.start_time.isoformat(),
        },
    }
    if encounter.end_time:
        resource["period"]["end"] = encounter.end_time.isoformat()
    if encounter.facility:
        resource["serviceProvider"] = {
            "reference": f"Organization/{encounter.facility.uuid}",
            "display": encounter.facility.name,
        }
    return resource


def observation_to_fhir(observation):
    """Map an Observation model instance to a FHIR Observation resource dict."""
    resource = {
        "resourceType": "Observation",
        "id": str(observation.uuid),
        "status": observation.status,
        "code": {
            "coding": [{"code": observation.code, "display": observation.display_name}],
        },
        "subject": {"reference": f"Patient/{observation.encounter.patient.uuid}"},
        "encounter": {"reference": f"Encounter/{observation.encounter.uuid}"},
        "effectiveDateTime": observation.recorded_at.isoformat(),
    }
    if observation.value_numeric is not None:
        resource["valueQuantity"] = {
            "value": float(observation.value_numeric),
            "unit": observation.unit,
        }
    elif observation.value_text:
        resource["valueString"] = observation.value_text
    return resource


def lab_result_to_fhir(lab_result):
    """Map a LabResult to a FHIR DiagnosticReport resource dict."""
    resource = {
        "resourceType": "DiagnosticReport",
        "id": str(lab_result.uuid),
        "status": lab_result.status,
        "code": {
            "coding": [{"code": lab_result.test_code, "display": lab_result.test_name}],
        },
        "subject": {"reference": f"Patient/{lab_result.encounter.patient.uuid}"},
        "encounter": {"reference": f"Encounter/{lab_result.encounter.uuid}"},
        "effectiveDateTime": lab_result.recorded_at.isoformat(),
        "conclusion": lab_result.result_value,
    }
    return resource


def fhir_bundle(resources, bundle_type="searchset"):
    """Wrap a list of FHIR resource dicts in a FHIR Bundle."""
    return {
        "resourceType": "Bundle",
        "type": bundle_type,
        "total": len(resources),
        "entry": [{"resource": r} for r in resources],
    }
