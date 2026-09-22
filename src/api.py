from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.product import ProductManager
from src.supplier import SupplierManager
from src.purchase import PurchaseManager
from src.sales import SalesManager
from src.database import Database

from backend.src.auth import (
    create_access_token,
    decode_access_token,
    get_user_by_email,
    get_user_by_id,
    hash_password,
    normalize_email,
    public_user,
    validate_email,
    verify_password,
)


app = FastAPI(
    title="Inventory Management API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

product_manager = ProductManager()
supplier_manager = SupplierManager()
purchase_manager = PurchaseManager()
sales_manager = SalesManager()


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


# =========================
# SALES API
# =========================

from src.sales import SalesManager

sales_manager = SalesManager()


class SaleItem(BaseModel):
    product_id: int
    quantity: int


class SaleCreate(BaseModel):
    customer_name: str | None = None
    items: list[SaleItem]


@app.get("/api/sales")
def get_sales():
    sales = sales_manager.get_sales()
    return {
        "success": True,
        "sales": sales or []
    }


@app.get("/api/sales/{sale_id}")
def get_sale(sale_id: int):
    sale = sales_manager.get_sale_details(sale_id)

    if sale is None:
        return {
            "success": False,
            "message": "Sale not found."
        }

    return {
        "success": True,
        "sale": sale
    }


@app.post("/api/sales")
def create_sale(sale: SaleCreate):
    try:
        if not sale.items:
            return {
                "success": False,
                "message": "At least one sale item is required."
            }

        sale_id = sales_manager.create_sale(
            customer_name=sale.customer_name,
            items=[item.model_dump() for item in sale.items]
        )

        if sale_id is False:
            return {
                "success": False,
                "message": "Failed to create sale."
            }

        return {
            "success": True,
            "message": "Sale created successfully",
            "sale_id": sale_id
        }

    except Exception as error:
        return {
            "success": False,
            "message": str(error)
        }


@app.get("/api/reports/sales")
def get_sales_report():
    report = sales_manager.sales_report()
    return {
        "success": True,
        "report": report or []
    }


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str
    remember: bool = True

class ProfileUpdateRequest(BaseModel):
    name: str
    email: str

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


def current_user_from_token(authorization: str | None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated."
        )

    payload = decode_access_token(authorization[7:].strip())
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session.")

    user = get_user_by_id(int(user_id))

    if not user or not user["is_active"]:
        raise HTTPException(
            status_code=401,
            detail="Account is inactive or unavailable."
        )

    return user


@app.post("/api/auth/register")
def register(data: RegisterRequest):
    name = data.name.strip()
    email = normalize_email(data.email)

    if len(name) < 2:
        return {
            "success": False,
            "message": "Name must contain at least 2 characters."
        }

    if not validate_email(email):
        return {
            "success": False,
            "message": "Enter a valid email address."
        }

    if len(data.password) < 8:
        return {
            "success": False,
            "message": "Password must be at least 8 characters."
        }

    if get_user_by_email(email):
        return {
            "success": False,
            "message": "An account with this email already exists."
        }

    db = Database()

    user_id = db.execute(
        "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)",
        (name, email, hash_password(data.password)),
    )

    if user_id is None:
        return {
            "success": False,
            "message": "Unable to create account."
        }

    user = get_user_by_id(int(user_id))
    token = create_access_token(int(user_id), email)

    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "user": public_user(user)
    }


@app.post("/api/auth/login")
def login(data: LoginRequest):
    email = normalize_email(data.email)
    user = get_user_by_email(email)

    if not user or not verify_password(
        data.password,
        user["password_hash"]
    ):
        return {
            "success": False,
            "message": "Incorrect email or password."
        }

    if not user["is_active"]:
        return {
            "success": False,
            "message": "This account is inactive."
        }

    token = create_access_token(
        user["user_id"],
        user["email"]
    )

    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "user": public_user(user)
    }


@app.get("/api/auth/me")
def me(authorization: str | None = Header(default=None)):
    return {
        "success": True,
        "user": public_user(
            current_user_from_token(authorization)
        )
    }


@app.put("/api/auth/profile")
def update_profile(
    data: ProfileUpdateRequest,
    authorization: str | None = Header(default=None)
):
    user = current_user_from_token(authorization)

    name = data.name.strip()
    email = normalize_email(data.email)

    if len(name) < 2 or not validate_email(email):
        return {
            "success": False,
            "message": "Enter a valid name and email."
        }

    existing = get_user_by_email(email)

    if existing and existing["user_id"] != user["user_id"]:
        return {
            "success": False,
            "message": "That email is already in use."
        }

    db = Database()

    result = db.execute(
        "UPDATE users SET name = %s, email = %s WHERE user_id = %s",
        (name, email, user["user_id"])
    )

    if result is None:
        return {
            "success": False,
            "message": "Unable to update profile."
        }

    updated = get_user_by_id(user["user_id"])

    return {
        "success": True,
        "user": public_user(updated)
    }


@app.post("/api/auth/change-password")
def change_password(
    data: PasswordChangeRequest,
    authorization: str | None = Header(default=None)
):
    user = current_user_from_token(authorization)

    if not verify_password(
        data.current_password,
        user["password_hash"]
    ):
        return {
            "success": False,
            "message": "Current password is incorrect."
        }

    if len(data.new_password) < 8:
        return {
            "success": False,
            "message": "New password must be at least 8 characters."
        }

    db = Database()

    result = db.execute(
        "UPDATE users SET password_hash = %s WHERE user_id = %s",
        (
            hash_password(data.new_password),
            user["user_id"]
        )
    )

    if result is None:
        return {
            "success": False,
            "message": "Unable to change password."
        }

    return {
        "success": True,
        "message": "Password changed successfully."
    }


@app.post("/api/auth/logout")
def logout():
    return {
        "success": True,
        "message": "Signed out successfully."
    }