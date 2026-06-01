from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import models
import schemas

class InsufficientStockException(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)

class EntityNotFoundException(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)

def create_order(db: Session, order_data: schemas.OrderCreate) -> models.Order:
    """
    Creates a new Order in the database.
    
    Business Logic:
    1. Verifies that the specified customer exists.
    2. Iterates through all requested line items to:
       - Validate that each product exists.
       - Enforce stock sufficiency (raises InsufficientStockException if requested > in stock).
       - Record the current unit price of each product at ordering time.
       - Decrement the product's quantity in stock.
    3. Calculates the total order amount on the backend to prevent price tampering.
    4. Persists the Order and OrderItem records in an atomic transaction.
    """
    # 1. Verify Customer exists
    customer = db.query(models.Customer).filter(models.Customer.id == order_data.customer_id).first()
    if not customer:
        raise EntityNotFoundException(f"Customer with ID {order_data.customer_id} does not exist.")

    # We will accumulate items and calculate total inside a try-except to ensure database integrity
    order_items = []
    total_amount = 0.0

    # Process items
    for item in order_data.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise EntityNotFoundException(f"Product with ID {item.product_id} does not exist.")

        # Check stock sufficiency
        if product.quantity_in_stock < item.quantity:
            raise InsufficientStockException(
                f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). "
                f"Requested: {item.quantity}, Available: {product.quantity_in_stock}"
            )

        # Calculate pricing
        item_price = product.price
        subtotal = item_price * item.quantity
        total_amount += subtotal

        # Create OrderItem object
        db_item = models.OrderItem(
            product_id=product.id,
            quantity=item.quantity,
            unit_price=item_price
        )
        order_items.append(db_item)

        # Deduct stock
        product.quantity_in_stock -= item.quantity

    # 2. Create the main Order
    db_order = models.Order(
        customer_id=order_data.customer_id,
        total_amount=total_amount
    )
    db.add(db_order)
    db.flush()  # Populates db_order.id

    # 3. Associate items and write to DB
    for db_item in order_items:
        db_item.order_id = db_order.id
        db.add(db_item)

    db.commit()
    db.refresh(db_order)
    return db_order

def cancel_and_delete_order(db: Session, order_id: int) -> bool:
    """
    Cancels and deletes an Order from the database.
    
    Business Logic (Stock Restoration):
    1. Fetches the Order by ID.
    2. Restores the inventory level of all products linked to the order items 
       (incrementing Product.quantity_in_stock by OrderItem.quantity).
    3. Deletes the Order from the database (cascade deletes linked OrderItems).
    4. Commits the changes atomically.
    """
    # Fetch order
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise EntityNotFoundException(f"Order with ID {order_id} not found.")

    # Restore stock for each item
    for item in order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            product.quantity_in_stock += item.quantity

    # Delete order (cascade deletes order items due to relationship setting)
    db.delete(order)
    db.commit()
    return True
