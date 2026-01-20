from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DbSession, CurrentUser
from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagResponse

router = APIRouter()


@router.get("/", response_model=list[TagResponse])
async def get_tags(db: DbSession, current_user: CurrentUser):
    """Get all tags for current user"""
    result = await db.execute(
        select(Tag).where(Tag.user_id == current_user.id).order_by(Tag.name)
    )
    return result.scalars().all()


@router.post("/", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(tag_data: TagCreate, db: DbSession, current_user: CurrentUser):
    """Create a new tag"""
    # Check if tag name already exists
    result = await db.execute(
        select(Tag).where(Tag.user_id == current_user.id, Tag.name == tag_data.name)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Tag name already exists")

    tag = Tag(user_id=current_user.id, name=tag_data.name, color=tag_data.color)
    db.add(tag)
    await db.commit()
    await db.refresh(tag)

    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(tag_id: int, db: DbSession, current_user: CurrentUser):
    """Delete a tag"""
    result = await db.execute(
        select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id)
    )
    tag = result.scalar_one_or_none()

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    await db.delete(tag)
    await db.commit()
