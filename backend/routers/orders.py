from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import get_db
from services import order_service

router = APIRouter(
    prefix="/orders",
    tags=["orders"]
)

def format_order(order: models.Order) -> schemas.Order:
    items = []
    for item in order.items:
        items.append(schemas.OrderItem(
            id=item.id,
            order_id=item.order_id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            product_name=item.product.name if item.product else "Deleted Product",
            product_sku=item.product.sku if item.product else "N/A"
        ))
    return schemas.Order(
        id=order.id,
        customer_id=order.customer_id,
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=items,
        customer_name=order.customer.full_name if order.customer else "Deleted Customer",
        customer_email=order.customer.email if order.customer else "N/A"
    )

@router.post("", response_model=schemas.Order, status_code=status.HTTP_201_CREATED)
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    try:
        new_order = order_service.create_order(db, order_data)
        return format_order(new_order)
    except order_service.EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except order_service.InsufficientStockException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during order creation: {str(e)}"
        )

@router.get("", response_model=List[schemas.Order])
def get_orders(db: Session = Depends(get_db)):
    db_orders = db.query(models.Order).order_by(models.Order.id.desc()).all()
    return [format_order(order) for order in db_orders]

@router.get("/{order_id}", response_model=schemas.Order)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )
    return format_order(order)

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    try:
        order_service.cancel_and_delete_order(db, order_id)
        return None
    except order_service.EntityNotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during order cancellation: {str(e)}"
        )
