from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.product import Product
from app.models.category import Category
from app.models.user import User
from app.schemas.product_schema import ProductCreate, ProductUpdate, ProductResponse
from app.auth.dependencies import get_current_user, get_optional_user, require_role
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/api/products", tags=["Product Management"])

@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).all()
    return [{"id": c.id, "name": c.name, "description": c.description, "standard_units": c.standard_units} for c in cats]

@router.get("", response_model=List[ProductResponse])
@router.get("/", response_model=List[ProductResponse])
def list_products(
    q: Optional[str] = None,
    category_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if q:
        search = f"%{q}%"
        query = query.filter(
            (Product.product_name.ilike(search)) |
            (Product.brand.ilike(search)) |
            (Product.batch_number.ilike(search)) |
            (Product.manufacturer_name.ilike(search))
        )
    if category_id:
        query = query.filter(Product.category_id == category_id)

    return query.order_by(Product.id.desc()).offset(offset).limit(limit).all()

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    req: ProductCreate,
    request: Request,
    current_user: User = Depends(require_role(["Admin", "Inspector", "Manufacturer", "Seller"])),
    db: Session = Depends(get_db)
):
    product = Product(
        product_name=req.product_name,
        brand=req.brand,
        category_id=req.category_id,
        manufacturer_id=current_user.id if current_user.role == "Manufacturer" else None,
        manufacturer_name=req.manufacturer_name,
        manufacturer_address=req.manufacturer_address,
        packer_name=req.packer_name,
        importer_name=req.importer_name,
        country_of_origin=req.country_of_origin or "India",
        batch_number=req.batch_number,
        manufacturing_date=req.manufacturing_date,
        expiry_date=req.expiry_date,
        net_quantity=req.net_quantity,
        unit=req.unit,
        mrp=req.mrp,
        mrp_declaration_text=req.mrp_declaration_text,
        unit_sale_price=req.unit_sale_price,
        customer_care_email=req.customer_care_email,
        customer_care_phone=req.customer_care_phone,
        customer_care_address=req.customer_care_address,
        pdp_dimensions=req.pdp_dimensions,
        image_path=req.image_path,
        label_image_path=req.label_image_path
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    log_audit_event(
        db=db,
        action="CREATE_PRODUCT",
        entity="PRODUCT",
        entity_id=product.id,
        user=current_user,
        ip_address=request.client.host if request.client else "127.0.0.1",
        details=f"Created product: {product.product_name}"
    )

    return product

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    req: ProductUpdate,
    request: Request,
    current_user: User = Depends(require_role(["Admin", "Inspector", "Manufacturer"])),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # If manufacturer, verify ownership or allow admin/inspector
    if current_user.role == "Manufacturer" and product.manufacturer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot edit a product registered by another manufacturer")

    update_data = req.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(product, field, val)

    db.commit()
    db.refresh(product)

    log_audit_event(
        db=db,
        action="UPDATE_PRODUCT",
        entity="PRODUCT",
        entity_id=product.id,
        user=current_user,
        ip_address=request.client.host if request.client else "127.0.0.1",
        details=f"Updated product: {product.product_name}"
    )

    return product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    request: Request,
    current_user: User = Depends(require_role(["Admin"])),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    log_audit_event(
        db=db,
        action="DELETE_PRODUCT",
        entity="PRODUCT",
        entity_id=product.id,
        user=current_user,
        ip_address=request.client.host if request.client else "127.0.0.1",
        details=f"Admin deleted product: {product.product_name}"
    )

    db.delete(product)
    db.commit()
    return None
