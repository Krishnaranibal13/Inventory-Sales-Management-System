from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.product import ProductManager
from src.supplier import SupplierManager
from src.purchase import PurchaseManager


app = FastAPI(
    title="Inventory Management API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

product_manager = ProductManager()
supplier_manager = SupplierManager()
purchase_manager = PurchaseManager()


class ProductCreate(BaseModel):
    name: str
    category: str
    price: float
    quantity: int
    reorder_level: int
    supplier_id: int | None = None


class ProductUpdate(BaseModel):
    name: str
    category: str
    price: float
    reorder_level: int


class SupplierCreate(BaseModel):
    name: str
    company: str | None = None
    phone: str | None = None
    email: str | None = None


class SupplierUpdate(BaseModel):
    name: str
    company: str | None = None
    phone: str | None = None
    email: str | None = None


class PurchaseItem(BaseModel):
    product_id: int
    quantity: int
    unit_cost: float


class PurchaseCreate(BaseModel):
    supplier_id: int
    items: list[PurchaseItem]


@app.get("/")
def root():
    return {"message": "Inventory Management API is running"}


# =========================================================
# PRODUCTS
# =========================================================

@app.get("/api/products")
def get_products():
    products = product_manager.get_all_products()
    return {"success": True, "products": products or []}


@app.post("/api/products")
def create_product(product: ProductCreate):
    product_id = product_manager.add_product(
        name=product.name,
        category=product.category,
        price=product.price,
        quantity=product.quantity,
        reorder_level=product.reorder_level,
        supplier_id=product.supplier_id
    )
    if product_id is None:
        return {"success": False, "message": "Failed to create product."}
    return {
        "success": True,
        "message": "Product created successfully",
        "product_id": product_id
    }


@app.put("/api/products/{product_id}")
def update_product(product_id: int, product: ProductUpdate):
    result = product_manager.update_product(
        product_id=product_id,
        name=product.name,
        category=product.category,
        price=product.price,
        reorder_level=product.reorder_level
    )
    if result is None:
        return {"success": False, "message": "Failed to update product."}
    return {
        "success": True,
        "message": "Product updated successfully",
        "product_id": product_id
    }


@app.delete("/api/products/{product_id}")
def delete_product(product_id: int):
    result = product_manager.delete_product(product_id)
    if result is None:
        return {
            "success": False,
            "message": "Unable to delete product. It may be linked with purchase or sales history."
        }
    return {
        "success": True,
        "message": "Product deleted successfully",
        "product_id": product_id
    }


# =========================================================
# SUPPLIERS
# =========================================================

@app.get("/api/suppliers")
def get_suppliers():
    suppliers = supplier_manager.get_all_suppliers()
    return {"success": True, "suppliers": suppliers or []}


@app.get("/api/suppliers/{supplier_id}")
def get_supplier(supplier_id: int):
    supplier = supplier_manager.get_supplier(supplier_id)
    if supplier is None:
        return {"success": False, "message": "Supplier not found."}
    return {"success": True, "supplier": supplier}


@app.post("/api/suppliers")
def create_supplier(supplier: SupplierCreate):
    supplier_id = supplier_manager.add_supplier(
        name=supplier.name.strip(),
        company=supplier.company.strip() if supplier.company else None,
        phone=supplier.phone.strip() if supplier.phone else None,
        email=supplier.email.strip() if supplier.email else None
    )
    if supplier_id is None:
        return {"success": False, "message": "Failed to create supplier."}
    return {
        "success": True,
        "message": "Supplier created successfully",
        "supplier_id": supplier_id
    }


@app.put("/api/suppliers/{supplier_id}")
def update_supplier(supplier_id: int, supplier: SupplierUpdate):
    result = supplier_manager.update_supplier(
        supplier_id=supplier_id,
        name=supplier.name.strip(),
        company=supplier.company.strip() if supplier.company else None,
        phone=supplier.phone.strip() if supplier.phone else None,
        email=supplier.email.strip() if supplier.email else None
    )
    if result is None:
        return {"success": False, "message": "Failed to update supplier."}
    return {
        "success": True,
        "message": "Supplier updated successfully",
        "supplier_id": supplier_id
    }


@app.delete("/api/suppliers/{supplier_id}")
def delete_supplier(supplier_id: int):
    result = supplier_manager.delete_supplier(supplier_id)
    if result is None:
        return {
            "success": False,
            "message": "Unable to delete supplier. It may be linked with purchase history."
        }
    return {
        "success": True,
        "message": "Supplier deleted successfully",
        "supplier_id": supplier_id
    }


# =========================================================
# PURCHASES
# =========================================================

@app.get("/api/purchases")
def get_purchases():
    purchases = purchase_manager.get_purchases()
    return {
        "success": True,
        "purchases": purchases or []
    }


@app.get("/api/purchases/{purchase_id}")
def get_purchase(purchase_id: int):
    purchase = purchase_manager.get_purchase_details(purchase_id)

    if purchase is None:
        return {
            "success": False,
            "message": "Purchase not found."
        }

    return {
        "success": True,
        "purchase": purchase
    }


@app.post("/api/purchases")
def create_purchase(purchase: PurchaseCreate):
    try:
        if not purchase.items:
            return {
                "success": False,
                "message": "At least one purchase item is required."
            }

        purchase_id = purchase_manager.create_purchase(
            supplier_id=purchase.supplier_id,
            items=[
                item.model_dump()
                for item in purchase.items
            ]
        )

        if purchase_id is False:
            return {
                "success": False,
                "message": "Failed to create purchase."
            }

        return {
            "success": True,
            "message": "Purchase created successfully",
            "purchase_id": purchase_id
        }

    except Exception as error:
        return {
            "success": False,
            "message": str(error)
        }

