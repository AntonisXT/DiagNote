from fastapi import APIRouter, Depends, HTTPException
from fastapi_clerk_auth import HTTPAuthorizationCredentials  # type: ignore
from sqlalchemy.orm import Session

from backend.database import get_db, Document
from backend.dependencies import clerk_guard, get_user_id

router = APIRouter(prefix="/api", tags=["documents"])


@router.get("/documents")
def list_documents(
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
    db: Session = Depends(get_db),
):
    user_id = get_user_id(creds.credentials)
    docs = (
        db.query(Document)
        .filter(Document.clerk_user_id == user_id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return [
        {
            "id": d.id,
            "name": d.name,
            "patient": d.patient_name,
            "date": d.created_at.strftime("%Y-%m-%d"),
            "type": d.type,
            "format": d.format,
            "size": f"{max(1, d.size_bytes // 1024)} KB" if d.size_bytes else "< 1 KB",
        }
        for d in docs
    ]


@router.delete("/documents/{doc_id}")
def delete_document(
    doc_id: int,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
    db: Session = Depends(get_db),
):
    user_id = get_user_id(creds.credentials)
    doc = (
        db.query(Document)
        .filter(Document.id == doc_id, Document.clerk_user_id == user_id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return {"ok": True}
