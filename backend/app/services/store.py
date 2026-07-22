"""Seeded industrial knowledge store for ForgeMind AI demo."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from app.models.schemas import (
    AssetEvent,
    Conflict,
    Document,
    Equipment,
    GraphEdge,
    GraphNode,
    KnowledgeGap,
    KnowledgeHealth,
    Recommendation,
)


def _docs() -> list[Document]:
    return [
        Document(
            id="doc-manual-p102",
            title="Pump P-102 OEM Manual",
            doc_type="manual",
            equipment_ids=["eq-p102"],
            trust_score=0.96,
            freshness="current",
            verified=True,
            signed=True,
            summary="OEM operating limits: design pressure 120 PSI. Seal and bearing maintenance intervals.",
            content=(
                "Centrifugal pump P-102. Design discharge pressure: 120 PSI. "
                "Bearing lubrication every 90 days. Mechanical seal inspection quarterly. "
                "Do not operate above 120 PSI continuous."
            ),
            page_count=42,
            uploaded_at="2021-03-12",
        ),
        Document(
            id="doc-insp-p102-2023",
            title="Inspection Report P-102 — Seal Leakage",
            doc_type="inspection",
            equipment_ids=["eq-p102"],
            trust_score=0.88,
            freshness="current",
            verified=True,
            signed=True,
            summary="Observed seal leakage; recorded operating pressure 150 PSI.",
            content=(
                "Inspection of Pump P-102. Seal leakage observed at coupling side. "
                "Operating pressure measured at 150 PSI during run. Vibration elevated. "
                "Recommend seal kit replacement and pressure review."
            ),
            page_count=6,
            uploaded_at="2023-06-18",
        ),
        Document(
            id="doc-maint-p102-2024",
            title="Work Order WO-8841 Bearing Replacement",
            doc_type="maintenance",
            equipment_ids=["eq-p102"],
            trust_score=0.82,
            freshness="current",
            verified=True,
            signed=True,
            summary="Bearing replaced. Notes mention pressure around 140 PSI.",
            content=(
                "WO-8841: Replaced drive-end bearing on P-102. "
                "Technician noted process pressure approximately 140 PSI. "
                "Spare seal kit not available. Estimated downtime 6 hours."
            ),
            page_count=3,
            uploaded_at="2024-02-09",
        ),
        Document(
            id="doc-incident-p102-2025",
            title="Near Miss Report NM-221 — Cooling Line Surge",
            doc_type="incident",
            equipment_ids=["eq-p102", "eq-v12"],
            trust_score=0.91,
            freshness="current",
            verified=True,
            signed=True,
            summary="Near miss during cooling line pressure surge linked to P-102.",
            content=(
                "Near miss: pressure surge on cooling line downstream of P-102 and V-12. "
                "Operator evacuated temporarily. Root indicators: delayed PM, missing vibration report, "
                "pressure readings inconsistent with OEM manual."
            ),
            page_count=5,
            uploaded_at="2025-01-14",
        ),
        Document(
            id="doc-compliance-p102",
            title="Compliance Finding CF-77 — Overpressure Evidence Gap",
            doc_type="compliance",
            equipment_ids=["eq-p102"],
            trust_score=0.79,
            freshness="current",
            verified=False,
            signed=False,
            summary="OISD evidence package incomplete for P-102 overpressure events.",
            content=(
                "Compliance finding: Factory Act inspection log present. "
                "OISD pressure integrity evidence incomplete. PESO hazardous area dossier OK. "
                "Missing calibrated vibration report for rotating equipment class."
            ),
            page_count=4,
            uploaded_at="2025-03-02",
        ),
        Document(
            id="doc-sop-cooling",
            title="SOP-CL-04 Cooling Circuit Operations",
            doc_type="sop",
            equipment_ids=["eq-p102", "eq-v12", "eq-c8"],
            trust_score=0.93,
            freshness="current",
            verified=True,
            signed=True,
            summary="Operating procedure for cooling circuit Section A.",
            content=(
                "SOP for Cooling Circuit Section A including P-102, V-12, C-8. "
                "Start/stop sequence, isolation, and emergency depressurization. "
                "Evacuation procedure referenced but filed separately — verify linkage."
            ),
            page_count=18,
            uploaded_at="2022-11-01",
        ),
        Document(
            id="doc-old-insp",
            title="Legacy Inspection P-102 (2019)",
            doc_type="inspection",
            equipment_ids=["eq-p102"],
            trust_score=0.41,
            freshness="outdated",
            verified=False,
            signed=False,
            superseded_by="doc-insp-p102-2023",
            summary="Superseded inspection; missing signature.",
            content="Legacy inspection notes. Incomplete signature block. Superseded by 2023 report.",
            page_count=2,
            uploaded_at="2019-08-20",
        ),
        Document(
            id="doc-oisd-excerpt",
            title="OISD Pressure Integrity Excerpt",
            doc_type="regulation",
            equipment_ids=[],
            trust_score=0.98,
            freshness="current",
            verified=True,
            signed=True,
            summary="Regulatory excerpt for pressure-containing equipment.",
            content=(
                "OISD guidance: maintain design pressure integrity evidence, "
                "calibrated instruments, and documented deviation control for rotating pumps."
            ),
            page_count=12,
            uploaded_at="2020-01-01",
        ),
        Document(
            id="doc-factory-act",
            title="Factories Act — Relevant Duties Excerpt",
            doc_type="regulation",
            equipment_ids=[],
            trust_score=0.97,
            freshness="current",
            verified=True,
            signed=True,
            summary="Statutory safety duties excerpt for plant machinery.",
            content="Factories Act duties: maintain machinery in safe condition; record inspections; train operators.",
            page_count=8,
            uploaded_at="2020-01-01",
        ),
        Document(
            id="doc-peso",
            title="PESO Hazardous Area Notes",
            doc_type="regulation",
            equipment_ids=["eq-p102"],
            trust_score=0.95,
            freshness="current",
            verified=True,
            signed=True,
            summary="PESO classification notes for cooling pump area.",
            content="PESO: area classification maintained. Electrical equipment certified for zone. Dossier current.",
            page_count=7,
            uploaded_at="2021-06-15",
        ),
        Document(
            id="doc-comp-failures",
            title="Compressor Failure Lessons Pack 2022-2025",
            doc_type="incident",
            equipment_ids=["eq-c8"],
            trust_score=0.86,
            freshness="current",
            verified=True,
            signed=True,
            summary="Cross-incident lessons: bearing wear dominant cause.",
            content=(
                "Across compressor incidents 2022-2025: most common cause bearing wear. "
                "Average downtime 11 hours. Same contractor involved in 3 of 5 events. "
                "Preventive: vibration route + bearing PM cadence reduction to 60 days."
            ),
            page_count=9,
            uploaded_at="2025-04-01",
        ),
    ]


def _equipment() -> list[Equipment]:
    return [
        Equipment(
            id="eq-p102",
            tag="P-102",
            name="Cooling Water Pump",
            equipment_class="pump",
            section="Section A",
            department="Cooling",
            status="critical",
            health_score=58,
            maintenance_due_days=12,
            open_incidents=2,
            twin_x=180,
            twin_y=160,
            description="Primary cooling circulation pump",
        ),
        Equipment(
            id="eq-v12",
            tag="V-12",
            name="Isolation Valve",
            equipment_class="valve",
            section="Section A",
            department="Cooling",
            status="critical",
            health_score=62,
            maintenance_due_days=20,
            open_incidents=1,
            twin_x=300,
            twin_y=160,
            description="Downstream isolation valve on cooling line",
        ),
        Equipment(
            id="eq-b3",
            tag="B-3",
            name="Utility Boiler",
            equipment_class="boiler",
            section="Section B",
            department="Utilities",
            status="warning",
            health_score=74,
            maintenance_due_days=45,
            open_incidents=0,
            twin_x=480,
            twin_y=220,
            description="Plant utility boiler",
        ),
        Equipment(
            id="eq-c8",
            tag="C-8",
            name="Process Compressor",
            equipment_class="compressor",
            section="Section A",
            department="Process",
            status="healthy",
            health_score=88,
            maintenance_due_days=60,
            open_incidents=0,
            twin_x=180,
            twin_y=280,
            description="Process gas compressor",
        ),
    ]


def _events() -> list[AssetEvent]:
    return [
        AssetEvent("ev-1", "eq-p102", "2021-03-12", "installed", "Pump P-102 installed and commissioned", "doc-manual-p102", "info"),
        AssetEvent("ev-2", "eq-p102", "2022-05-04", "maintenance", "Scheduled lubrication and alignment check", "doc-sop-cooling", "info"),
        AssetEvent("ev-3", "eq-p102", "2023-06-18", "seal_leakage", "Seal leakage observed; pressure 150 PSI", "doc-insp-p102-2023", "warning"),
        AssetEvent("ev-4", "eq-p102", "2023-07-02", "inspection", "Follow-up inspection after seal leak", "doc-insp-p102-2023", "info"),
        AssetEvent("ev-5", "eq-p102", "2024-02-09", "bearing_replacement", "Drive-end bearing replaced (WO-8841)", "doc-maint-p102-2024", "warning"),
        AssetEvent("ev-6", "eq-p102", "2025-01-14", "near_miss", "Cooling line surge near miss NM-221", "doc-incident-p102-2025", "critical"),
        AssetEvent("ev-7", "eq-p102", "2025-03-02", "compliance_issue", "OISD evidence gap CF-77 logged", "doc-compliance-p102", "critical"),
        AssetEvent("ev-8", "eq-v12", "2022-08-01", "installed", "Valve V-12 installed", "doc-sop-cooling", "info"),
        AssetEvent("ev-9", "eq-v12", "2025-01-14", "near_miss", "Involved in cooling line surge", "doc-incident-p102-2025", "critical"),
        AssetEvent("ev-10", "eq-c8", "2023-11-20", "bearing_wear", "Compressor bearing wear event", "doc-comp-failures", "warning"),
    ]


def _nodes() -> list[GraphNode]:
    nodes = [
        GraphNode("eq-p102", "Pump P-102", "equipment", {"status": "critical"}),
        GraphNode("eq-v12", "Valve V-12", "equipment", {"status": "critical"}),
        GraphNode("eq-b3", "Boiler B-3", "equipment", {"status": "warning"}),
        GraphNode("eq-c8", "Compressor C-8", "equipment", {"status": "healthy"}),
        GraphNode("line-cooling", "Cooling Line", "process", {}),
        GraphNode("line-prod", "Production Line", "process", {}),
        GraphNode("dept-cooling", "Cooling Dept", "department", {}),
        GraphNode("reg-oisd", "OISD", "regulation", {}),
        GraphNode("reg-fa", "Factories Act", "regulation", {}),
        GraphNode("reg-peso", "PESO", "regulation", {}),
    ]
    for d in _docs():
        nodes.append(GraphNode(d.id, d.title, "document", {"trust": d.trust_score}))
    for e in _events():
        nodes.append(GraphNode(e.id, e.summary[:40], "event", {"date": e.date, "type": e.event_type}))
    return nodes


def _edges() -> list[GraphEdge]:
    return [
        GraphEdge("e1", "eq-p102", "eq-v12", "CONNECTED_TO", 0.97),
        GraphEdge("e2", "eq-v12", "line-cooling", "FEEDS", 0.94),
        GraphEdge("e3", "line-cooling", "eq-c8", "SUPPORTS", 0.88),
        GraphEdge("e4", "eq-c8", "line-prod", "FEEDS", 0.91),
        GraphEdge("e5", "eq-p102", "dept-cooling", "OWNED_BY", 0.99),
        GraphEdge("e6", "eq-p102", "doc-manual-p102", "DESCRIBED_BY", 0.96),
        GraphEdge("e7", "eq-p102", "doc-insp-p102-2023", "INSPECTED_IN", 0.93),
        GraphEdge("e8", "eq-p102", "doc-maint-p102-2024", "MAINTAINED_IN", 0.9),
        GraphEdge("e9", "eq-p102", "doc-incident-p102-2025", "INCIDENT_IN", 0.95),
        GraphEdge("e10", "eq-p102", "doc-compliance-p102", "FLAGGED_IN", 0.87),
        GraphEdge("e11", "doc-incident-p102-2025", "eq-v12", "INVOLVES", 0.92),
        GraphEdge("e12", "eq-p102", "reg-oisd", "SUBJECT_TO", 0.85),
        GraphEdge("e13", "eq-p102", "reg-fa", "SUBJECT_TO", 0.9),
        GraphEdge("e14", "eq-p102", "reg-peso", "SUBJECT_TO", 0.84),
        GraphEdge("e15", "ev-3", "eq-p102", "OCCURRED_ON", 0.99),
        GraphEdge("e16", "ev-6", "eq-p102", "OCCURRED_ON", 0.99),
        GraphEdge("e17", "ev-5", "doc-maint-p102-2024", "DOCUMENTED_IN", 0.94),
        GraphEdge("e18", "doc-insp-p102-2023", "doc-manual-p102", "CONFLICTS_WITH", 0.78),
        GraphEdge("e19", "doc-maint-p102-2024", "doc-manual-p102", "CONFLICTS_WITH", 0.72),
        GraphEdge("e20", "eq-c8", "doc-comp-failures", "LESSONS_IN", 0.89),
        GraphEdge("e21", "line-cooling", "line-prod", "IMPACTS", 0.8),
        GraphEdge("e22", "eq-b3", "line-prod", "SUPPORTS", 0.7),
    ]


def _conflicts() -> list[Conflict]:
    return [
        Conflict(
            id="cf-pressure-p102",
            entity="P-102",
            field="operating_pressure_psi",
            values=[
                {"document_id": "doc-manual-p102", "value": "120 PSI", "source": "OEM Manual"},
                {"document_id": "doc-insp-p102-2023", "value": "150 PSI", "source": "Inspection"},
                {"document_id": "doc-maint-p102-2024", "value": "140 PSI", "source": "Maintenance WO"},
            ],
            severity="high",
            summary="Design pressure 120 PSI conflicts with inspection 150 PSI and maintenance 140 PSI.",
        )
    ]


def _gaps() -> list[KnowledgeGap]:
    return [
        KnowledgeGap(
            id="gap-vib-p102",
            equipment_id="eq-p102",
            missing_doc_type="vibration_report",
            severity="critical",
            message="Pump P-102 has manual, inspection, and maintenance records but no vibration report.",
        ),
        KnowledgeGap(
            id="gap-evac",
            equipment_id="eq-p102",
            missing_doc_type="evacuation_procedure",
            severity="high",
            message="Safety SOP exists but linked evacuation procedure is missing for Cooling Section A.",
        ),
    ]


def _recommendations() -> list[Recommendation]:
    return [
        Recommendation("rec-1", "HIGH", "Replace mechanical seal on P-102", "Seal leakage history + pressure conflict elevates failure risk.", "eq-p102", "maintenance"),
        Recommendation("rec-2", "MEDIUM", "Upload vibration report for P-102", "Critical knowledge gap blocking predictive coverage.", "eq-p102", "documentation"),
        Recommendation("rec-3", "MEDIUM", "Reconcile pressure conflict (120/140/150 PSI)", "Cross-document conflict undermines operating envelope trust.", "eq-p102", "compliance"),
        Recommendation("rec-4", "LOW", "Archive superseded 2019 inspection", "Trust score 41%; superseded and unsigned.", "eq-p102", "governance"),
        Recommendation("rec-5", "HIGH", "Schedule compressor bearing PM cadence review", "Lessons pack shows bearing wear as dominant failure mode.", "eq-c8", "maintenance"),
    ]


class KnowledgeStore:
    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self.documents = {d.id: d for d in _docs()}
        self.equipment = {e.id: e for e in _equipment()}
        self.events = _events()
        self.nodes = {n.id: n for n in _nodes()}
        self.edges = _edges()
        self.conflicts = _conflicts()
        self.gaps = _gaps()
        self.recommendations = _recommendations()
        self.upload_jobs: dict[str, list[dict[str, Any]]] = {}
        self.query_log: list[dict[str, Any]] = []
        self.notifications = [
            {"id": "n1", "type": "conflict", "message": "Pressure conflict detected on P-102", "ts": "2025-03-02T10:00:00"},
            {"id": "n2", "type": "maintenance", "message": "P-102 maintenance due in 12 days", "ts": "2025-07-01T08:00:00"},
            {"id": "n3", "type": "health", "message": "Knowledge Health decreased after compliance finding", "ts": "2025-03-02T11:00:00"},
            {"id": "n4", "type": "gap", "message": "Missing vibration report for P-102", "ts": "2025-03-03T09:00:00"},
        ]
        self.graph_stats = {"nodes": len(self.nodes), "edges": len(self.edges)}

    def knowledge_health(self) -> KnowledgeHealth:
        missing = len(self.gaps)
        critical = len([g for g in self.gaps if g.severity == "critical"])
        outdated = len([d for d in self.documents.values() if d.freshness != "current"])
        total_docs = max(len(self.documents), 1)
        coverage = int(100 - (missing * 8))
        compliance = 91 if critical else 96
        freshness = int(100 - (outdated / total_docs) * 40)
        drift = 18 if self.conflicts else 5
        health = int((coverage + compliance + freshness) / 3 - drift / 4)
        return KnowledgeHealth(
            knowledge_health=max(0, min(100, health)),
            coverage=max(0, min(100, coverage)),
            compliance=compliance,
            missing_documents=missing,
            critical_gaps=critical,
            knowledge_freshness=max(0, min(100, freshness)),
            drift_score=drift,
        )

    def impact_radius(self, equipment_id: str) -> list[str]:
        # BFS via edges
        seen = {equipment_id}
        order = [equipment_id]
        frontier = [equipment_id]
        while frontier:
            cur = frontier.pop(0)
            for edge in self.edges:
                nxt = None
                if edge.source == cur and edge.target not in seen:
                    nxt = edge.target
                elif edge.target == cur and edge.source not in seen:
                    nxt = edge.source
                if nxt and self.nodes.get(nxt) and self.nodes[nxt].kind in {"equipment", "process", "regulation"}:
                    seen.add(nxt)
                    order.append(nxt)
                    frontier.append(nxt)
        labels = []
        for nid in order:
            node = self.nodes.get(nid)
            if node:
                labels.append(node.label)
        # Always append downtime framing for demo
        if "Downtime" not in labels:
            labels.append("Estimated Downtime")
        return labels[:8]

    def timeline(self, equipment_id: str) -> list[AssetEvent]:
        return sorted([e for e in self.events if e.equipment_id == equipment_id], key=lambda x: x.date)

    def snapshot(self) -> dict[str, Any]:
        return {
            "documents": len(self.documents),
            "equipment": len(self.equipment),
            "events": len(self.events),
            "nodes": len(self.nodes),
            "edges": len(self.edges),
            "conflicts": len(self.conflicts),
            "gaps": len(self.gaps),
        }


store = KnowledgeStore()
