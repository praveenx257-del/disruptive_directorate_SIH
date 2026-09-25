from pydantic import BaseModel, Field


class LiveEvaluationRequest(BaseModel):

    state: str

    ida: str

    category: str

    work_description: str = Field(
        min_length=1,
        description="Description of the proposed work"
    )

    recommended_amt: float = Field(
        gt=0,
        description="Recommended amount in INR"
    )

    disbursed_amt: float = Field(
        default=0.0,
        ge=0,
        description="Amount disbursed/spent so far in INR"
    )

    payment_tx_count: int = Field(
        default=0,
        ge=0
    )

    vendor_name: str = "Unknown"

    has_images: bool = False

    execution_days: int = 0

    is_completed: bool = False