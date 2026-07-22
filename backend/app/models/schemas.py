from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class Document(BaseModel):
    id: str
    title: str
    doc_type: str
    equipment_ids: list[str] = []
    trust_score: float = 0.8
    freshness: str = "current"  # current | outdated | superseded
    verified: bool = False
    signed: bool = False
    superseded_by: Optional[str] = None
    summary: str = ""
    content: str = ""
    page_count: int = 1
    uploaded_at: str = ""
    entities: dict[str, Any] = Field(default_factory=dict)


class AssetEvent(BaseModel):
    id: str
    equipment_id: str
    date: str
    event_type: str
    summary: str
    document_id: Optional[str] = None
    severity: str = "info"  # info | warning | critical


class Equipment(BaseModel):
    id: str
    tag: str
    name: str
    equipment_class: str
    section: str
    department: str
    status: str = "healthy"  # healthy | warning | critical
    health_score: int = 80
    maintenance_due_days: Optional[int] = None
    open_incidents: int = 0
    twin_x: float = 0
    twin_y: float = 0
    description: str = ""


class GraphNode(BaseModel):
    id: str
    label: str
    kind: str
    meta: dict[str, Any] = {}


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relation: str
    confidence: float = 0.9


class Conflict(BaseModel):
    id: str
    entity: str
    field: str
    values: list[dict[str, Any]]
    severity: str = "high"
    summary: str = ""


class KnowledgeGap(BaseModel):
    id: str
    equipment_id: str
    missing_doc_type: str
    severity: str = "medium"
    message: str = ""


class Recommendation(BaseModel):
    id: str
    priority: str  # HIGH | MEDIUM | LOW
    title: str
    detail: str
    equipment_id: Optional[str] = None
    action_type: str = "general"
    approved: bool = False


class ChatRequest(BaseModel):
    message: str
    mode: str = "engineer"  # engineer | maintenance | safety | compliance | manager | auditor
    equipment_id: Optional[str] = None
    image_b64: Optional[str] = None


class DecisionCard(BaseModel):
    recommended_action: str
    risk: str
    business_impact: str
    evidence_count: int
    affected_assets: int
    compliance: dict[str, str] = Field(default_factory=dict)
    confidence: float = 0.0
    followups: list[str] = []


class ExplainWhy(BaseModel):
    evidence: list[str] = []
    confidence: float = 0.0
    reasoning_path: list[str] = []
    graph_hops: list[str] = []
    documents_used: list[dict[str, Any]] = []
    conflicts: list[str] = []
    evidence_heatmap: list[dict[str, Any]] = []


class ChatResponse(BaseModel):
    answer: str
    mode: str
    context_equipment_id: Optional[str] = None
    decision_card: Optional[DecisionCard] = None
    explain: Optional[ExplainWhy] = None
    impact_radius: list[str] = []
    related_equipment: list[str] = []


class KnowledgeHealth(BaseModel):
    knowledge_health: int
    coverage: int
    compliance: int
    missing_documents: int
    critical_gaps: int
    knowledge_freshness: int
    drift_score: int = 0


class SimulateRequest(BaseModel):
    equipment_id: str
    scenario: str = "postpone_maintenance"


class PlantTwinResponse(BaseModel):
    sections: list[dict[str, Any]]
    equipment: list[Equipment]


class UploadProgress(BaseModel):
    stage: str
    detail: str
    nodes: int = 0
    edges: int = 0
    done: bool = False
