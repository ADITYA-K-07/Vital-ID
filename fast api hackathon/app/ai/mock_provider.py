import re
from collections import Counter
from typing import Any

from app.schemas.ai import AnalyzePatientResponse, RiskItem, UrgencyLevel
from app.schemas.diagnosis import SimilarCaseItem, SimilarCasesResponse
from app.schemas.forum import (
    ForumCaseMatchResponse,
    ForumMatchedDoctorItem,
    ForumSimilarCaseItem,
)
from app.schemas.notes import NotesAnalyzeResponse
from app.schemas.patterns import PatternDetectResponse, RiskFlag
from app.utils.datetime import utc_now_iso


class MockClinicalAIProvider:
    critical_keywords = {"chest pain", "stroke", "sepsis", "bleeding", "hypoxia"}
    high_keywords = {"shortness of breath", "tachycardia", "uncontrolled sugar", "hypertension"}

    symptom_keywords = {
        "headache": "Headache",
        "dizziness": "Dizziness",
        "fatigue": "Fatigue",
        "shortness of breath": "Shortness of breath",
        "fever": "Fever",
        "cough": "Cough",
        "pain": "Pain",
        "tachycardia": "Rapid heart rate",
        "bp": "Blood pressure concerns",
    }

    condition_keywords = {
        "asthma": "Asthma flare-up",
        "hypertension": "Hypertension",
        "tachycardia": "Cardiac rhythm concern",
        "diabetes": "Diabetes complication",
        "infection": "Possible infection",
        "anxiety": "Stress or anxiety response",
    }

    async def analyze_patient(self, patient_bundle: dict[str, Any]) -> dict[str, Any]:
        patient = patient_bundle["patient"]
        records = patient_bundle["records"]
        alerts = patient_bundle["alerts"]
        prescriptions = patient_bundle.get("prescriptions", [])

        combined_text = " ".join(
            filter(
                None,
                [
                    *(record.get("diagnosis") or "" for record in records),
                    *(record.get("notes") or "" for record in records),
                    *(record.get("doctor_notes") or "" for record in records),
                    *(alert.get("message") or alert.get("description") or "" for alert in alerts),
                ],
            )
        ).lower()

        risks: list[RiskItem] = []
        urgency = UrgencyLevel.LOW

        highest_alert = self._highest_alert_severity(alerts)
        if highest_alert:
            urgency = self._max_urgency(urgency, highest_alert)
            risks.append(
                RiskItem(
                    title="Recent clinical alerts require attention",
                    severity=highest_alert,
                    reason="One or more patient alerts were recently raised in the system.",
                )
            )

        if any(keyword in combined_text for keyword in self.critical_keywords):
            urgency = self._max_urgency(urgency, UrgencyLevel.CRITICAL)
            risks.append(
                RiskItem(
                    title="Potential acute deterioration signal",
                    severity=UrgencyLevel.CRITICAL,
                    reason="Clinical notes include high-risk terms that may indicate urgent review is needed.",
                )
            )
        elif any(keyword in combined_text for keyword in self.high_keywords):
            urgency = self._max_urgency(urgency, UrgencyLevel.HIGH)
            risks.append(
                RiskItem(
                    title="Elevated monitoring risk",
                    severity=UrgencyLevel.HIGH,
                    reason="Historical notes suggest elevated clinical follow-up risk.",
                )
            )

        patient_age = patient.get("age")
        if isinstance(patient_age, int) and patient_age >= 65 and len(records) >= 3:
            urgency = self._max_urgency(urgency, UrgencyLevel.MEDIUM)
            risks.append(
                RiskItem(
                    title="Complex chronic care profile",
                    severity=UrgencyLevel.MEDIUM,
                    reason="Older patient with multiple records may need tighter care coordination.",
                )
            )

        if records and not prescriptions:
            urgency = self._max_urgency(urgency, UrgencyLevel.MEDIUM)
            risks.append(
                RiskItem(
                    title="Treatment follow-through gap",
                    severity=UrgencyLevel.MEDIUM,
                    reason="Clinical history exists but no active prescriptions were found in the aggregated profile.",
                )
            )

        if not risks:
            risks.append(
                RiskItem(
                    title="No major risk pattern detected",
                    severity=UrgencyLevel.LOW,
                    reason="Available records do not show obvious high-risk trends in the current snapshot.",
                )
            )

        recommendations = self._build_recommendations(urgency=urgency, alerts=alerts, prescriptions=prescriptions)
        summary = self._build_summary(patient_name=patient.get("full_name") or patient.get("name") or "Patient", urgency=urgency, risks=risks)

        return AnalyzePatientResponse(
            patient_id=patient["id"],
            summary=summary,
            risks=risks,
            recommendations=recommendations,
            urgency_level=urgency,
            timestamp=utc_now_iso(),
            source="mock-heuristic",
            stored_insight_id=None,
            alert_created=False,
        ).model_dump(mode="json")

    async def analyze_notes(
        self,
        *,
        notes: str,
        patient_name: str | None = None,
    ) -> NotesAnalyzeResponse:
        normalized = notes.lower()
        symptoms = [label for keyword, label in self.symptom_keywords.items() if keyword in normalized]
        conditions = [label for keyword, label in self.condition_keywords.items() if keyword in normalized]

        severity = "low"
        if any(keyword in normalized for keyword in self.critical_keywords):
            severity = "high"
        elif any(keyword in normalized for keyword in self.high_keywords):
            severity = "medium"

        next_steps = [
            "Review the note alongside the latest patient vitals.",
            "Confirm symptom duration, onset, and progression with the patient.",
        ]
        if severity == "high":
            next_steps.append("Escalate to immediate clinician review.")
        elif severity == "medium":
            next_steps.append("Schedule timely follow-up and monitor for worsening symptoms.")
        else:
            next_steps.append("Document the finding and continue routine monitoring.")

        if patient_name:
            next_steps.append(f"Reconcile the note against {patient_name}'s existing record before acting.")

        return NotesAnalyzeResponse(
            symptoms=symptoms or ["No obvious symptom keywords detected"],
            possible_conditions=conditions or ["General clinical review recommended"],
            suggested_next_steps=next_steps,
            severity=severity,
        )

    async def detect_patterns(
        self,
        *,
        patient_name: str,
        records: list[dict[str, Any]],
    ) -> PatternDetectResponse:
        conditions = Counter()
        all_notes: list[str] = []
        for record in records:
            condition = str(record.get("condition") or "").strip()
            if condition:
                conditions[condition] += 1
            note = str(record.get("notes") or "").strip()
            if note:
                all_notes.append(note)

        joined_notes = " ".join(all_notes).lower()
        patterns: list[str] = []
        risk_flags: list[RiskFlag] = []
        recommendations: list[str] = []

        for condition, count in conditions.most_common(3):
            if count > 1:
                patterns.append(f"Recurring {condition} mentioned across {count} records.")

        bp_values = self._extract_bp_values(joined_notes)
        if bp_values:
            avg_systolic = sum(value[0] for value in bp_values) / len(bp_values)
            if avg_systolic >= 140:
                patterns.append("Blood pressure trend is elevated across recorded notes.")
                risk_flags.append(RiskFlag(flag="Elevated blood pressure trend", color="red"))
                recommendations.append("Review antihypertensive adherence and recent BP measurements.")

        if "shortness of breath" in joined_notes or "chest pain" in joined_notes:
            risk_flags.append(RiskFlag(flag="Cardiorespiratory symptom recurrence", color="red"))
            recommendations.append("Prioritize clinician review for recurring cardiopulmonary symptoms.")

        if "fatigue" in joined_notes or "dizziness" in joined_notes:
            risk_flags.append(RiskFlag(flag="Ongoing symptomatic complaints", color="yellow"))
            recommendations.append("Compare symptom recurrence with recent vitals and medication changes.")

        if not patterns:
            patterns.append("No strong longitudinal pattern was detected from the supplied records.")

        if not recommendations:
            recommendations.append("Continue longitudinal monitoring and review changes at the next visit.")

        summary = (
            f"{patient_name} has {len(patterns)} notable history pattern(s). "
            f"Highest concern level is {'high' if any(flag.color == 'red' for flag in risk_flags) else 'moderate' if risk_flags else 'low'}."
        )

        return PatternDetectResponse(
            patterns=patterns,
            risk_flags=risk_flags,
            recommendations=recommendations,
            summary=summary,
        )

    async def find_similar_cases(
        self,
        *,
        symptoms: str,
        history: str,
        current_diagnosis: str,
    ) -> SimilarCasesResponse:
        summary = " ".join(part for part in [symptoms, history, current_diagnosis] if part).lower()
        labels = []
        if "seizure" in summary:
            labels = ["Refractory seizure pattern", "Neurology escalation", "Imaging correlation"]
        elif "rash" in summary or "joint" in summary:
            labels = ["Autoimmune overlap consideration", "Inflammatory markers", "Rheumatology workup"]
        else:
            labels = ["Complex differential review", "Longitudinal symptom matching", "Specialist input"]

        similar_cases = [
            SimilarCaseItem(case_id=index + 1, description=f"Comparable case signal: {label}.")
            for index, label in enumerate(labels)
        ]

        suggested_diagnosis = current_diagnosis.strip() or "Further differential review needed"

        return SimilarCasesResponse(
            similar_cases=similar_cases,
            common_patterns=labels,
            suggested_diagnosis=suggested_diagnosis,
            confidence=74,
            references=[
                "Review prior notes for overlooked recurring symptoms.",
                "Compare current history against previous treatment response.",
                "Escalate to specialty review if clinical uncertainty persists.",
            ],
        )

    async def match_forum_case(
        self,
        *,
        title: str,
        specialty: str,
        description: str,
    ) -> ForumCaseMatchResponse:
        normalized = " ".join([title, specialty, description]).lower()
        if "seizure" in normalized or "neuro" in normalized:
            specialty_seed = "Neurology"
            case_theme = "Cortical dysplasia workup"
        elif "rash" in normalized or "joint" in normalized or "autoimmune" in normalized:
            specialty_seed = "Rheumatology"
            case_theme = "Autoimmune overlap syndrome review"
        else:
            specialty_seed = specialty or "General Medicine"
            case_theme = "Multidisciplinary diagnostic review"

        return ForumCaseMatchResponse(
            matched_doctors=[
                ForumMatchedDoctorItem(
                    name="Dr. Asha Menon",
                    specialty=specialty_seed,
                    hospital="Apollo Clinical Centre",
                    country="India",
                    reason="Frequently manages complex referrals in this specialty area.",
                ),
                ForumMatchedDoctorItem(
                    name="Dr. Daniel Brooks",
                    specialty=specialty_seed,
                    hospital="St. Mary's Teaching Hospital",
                    country="United Kingdom",
                    reason="Strong tertiary-care experience with unresolved diagnostic cases.",
                ),
                ForumMatchedDoctorItem(
                    name="Dr. Sofia Alvarez",
                    specialty=specialty_seed,
                    hospital="University Hospital Madrid",
                    country="Spain",
                    reason="Known for multidisciplinary case conferences and rare presentations.",
                ),
            ],
            similar_cases=[
                ForumSimilarCaseItem(
                    case_id="CASE-4812",
                    title=case_theme,
                    specialty=specialty_seed,
                    description="Prior case with overlapping symptom progression and incomplete initial response to treatment.",
                    resolution="Expanded specialty workup clarified the diagnosis and guided targeted therapy.",
                ),
                ForumSimilarCaseItem(
                    case_id="CASE-4387",
                    title="Atypical presentation requiring second-line review",
                    specialty=specialty_seed,
                    description="Patient presentation looked nonspecific until imaging and longitudinal history were reviewed together.",
                    resolution="Escalated review changed the working diagnosis and improved the treatment plan.",
                ),
                ForumSimilarCaseItem(
                    case_id="CASE-4021",
                    title="Delayed diagnosis after broad differential screening",
                    specialty=specialty_seed,
                    description="Multiple common causes were excluded before a less frequent etiology emerged.",
                    resolution="Focused follow-up testing confirmed the diagnosis and narrowed management decisions.",
                ),
            ],
        )

    def _build_summary(self, *, patient_name: str, urgency: UrgencyLevel, risks: list[RiskItem]) -> str:
        top_risk = risks[0].title if risks else "no major risk pattern detected"
        return (
            f"{patient_name} has {len(risks)} highlighted care signals. "
            f"Highest urgency is {urgency.value}. Primary focus: {top_risk}."
        )

    def _build_recommendations(
        self,
        *,
        urgency: UrgencyLevel,
        alerts: list[dict[str, Any]],
        prescriptions: list[dict[str, Any]],
    ) -> list[str]:
        recommendations = ["Review the aggregated patient history before making care decisions."]
        if urgency in {UrgencyLevel.HIGH, UrgencyLevel.CRITICAL}:
            recommendations.append("Prioritize clinician review and contact the patient promptly if symptoms are active.")
        if alerts:
            recommendations.append("Reconcile open alerts with the latest encounter details and vitals.")
        if not prescriptions:
            recommendations.append("Confirm whether the medication list is complete or if treatment is missing from the record.")
        else:
            recommendations.append("Validate medication adherence and recent prescription changes with the patient.")
        return recommendations

    def _highest_alert_severity(self, alerts: list[dict[str, Any]]) -> UrgencyLevel | None:
        severity_order = {
            "low": UrgencyLevel.LOW,
            "medium": UrgencyLevel.MEDIUM,
            "high": UrgencyLevel.HIGH,
            "critical": UrgencyLevel.CRITICAL,
        }
        levels = [
            severity_order.get(
                (alert.get("severity") or alert.get("priority") or "").lower()
            )
            for alert in alerts
        ]
        levels = [level for level in levels if level is not None]
        if not levels:
            return None
        return max(levels, key=self._urgency_rank)

    def _max_urgency(self, left: UrgencyLevel, right: UrgencyLevel) -> UrgencyLevel:
        return left if self._urgency_rank(left) >= self._urgency_rank(right) else right

    def _urgency_rank(self, urgency: UrgencyLevel) -> int:
        ranks = {
            UrgencyLevel.LOW: 1,
            UrgencyLevel.MEDIUM: 2,
            UrgencyLevel.HIGH: 3,
            UrgencyLevel.CRITICAL: 4,
        }
        return ranks[urgency]

    def _extract_bp_values(self, text: str) -> list[tuple[int, int]]:
        matches = re.findall(r"(\d{2,3})\s*/\s*(\d{2,3})", text)
        return [(int(sys), int(dia)) for sys, dia in matches]
