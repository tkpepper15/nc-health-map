"""
Pydantic schemas for data export functionality.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum


class ExportFormat(str, Enum):
    """Supported export formats."""
    CSV = "csv"
    EXCEL = "excel"
    JSON = "json"
    GEOJSON = "geojson"


class ExportDataType(str, Enum):
    """Types of data that can be exported."""
    COUNTIES = "counties"
    HEALTHCARE_METRICS = "healthcare_metrics"
    HCVI_SCORES = "hcvi_scores"
    MEDICAID_DATA = "medicaid_data"
    FULL_DATASET = "full_dataset"


class ExportRequest(BaseModel):
    """Request model for data exports."""
    data_type: ExportDataType = Field(..., description="Type of data to export")
    format: ExportFormat = Field(default=ExportFormat.CSV, description="Export format")
    
    # Filtering options
    counties: Optional[List[str]] = Field(None, description="List of FIPS codes to include")
    date_range: Optional[Dict[str, date]] = Field(None, description="Date range filter")
    vulnerability_categories: Optional[List[str]] = Field(None, description="Filter by vulnerability level")
    rural_only: Optional[bool] = Field(None, description="Include only rural counties")
    
    # Column selection
    columns: Optional[List[str]] = Field(None, description="Specific columns to include")
    include_geometry: bool = Field(False, description="Include geographic data")
    
    # Metadata options
    include_metadata: bool = Field(True, description="Include data source and quality information")
    include_calculations: bool = Field(False, description="Include intermediate calculation columns")


class ExportResponse(BaseModel):
    """Response model for export requests."""
    export_id: str = Field(..., description="Unique identifier for this export")
    status: str = Field(..., description="Export status (pending/processing/completed/failed)")
    file_url: Optional[str] = Field(None, description="URL to download the exported file")
    file_name: str = Field(..., description="Name of the exported file")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    
    # Export details
    data_type: ExportDataType = Field(..., description="Type of data exported")
    format: ExportFormat = Field(..., description="Export format")
    record_count: Optional[int] = Field(None, description="Number of records exported")
    column_count: Optional[int] = Field(None, description="Number of columns exported")
    
    # Timestamps
    requested_at: datetime = Field(..., description="When export was requested")
    completed_at: Optional[datetime] = Field(None, description="When export was completed")
    expires_at: Optional[datetime] = Field(None, description="When download link expires")
    
    # Error information
    error_message: Optional[str] = Field(None, description="Error message if export failed")
    
    # Applied filters
    filters_applied: Dict[str, Any] = Field(default_factory=dict, description="Filters that were applied")


class ExportJobStatus(BaseModel):
    """Status check for export jobs."""
    export_id: str = Field(..., description="Export job ID")
    status: str = Field(..., description="Current status")
    progress: Optional[float] = Field(None, description="Completion percentage (0-100)")
    message: Optional[str] = Field(None, description="Status message")
    estimated_completion: Optional[datetime] = Field(None, description="Estimated completion time")


class ExportHistory(BaseModel):
    """Historical export information."""
    exports: List[ExportResponse] = Field(..., description="List of previous exports")
    total_count: int = Field(..., description="Total number of exports")
    page: int = Field(1, description="Current page")
    page_size: int = Field(50, description="Page size")


class BulkExportRequest(BaseModel):
    """Request for multiple exports in a batch."""
    exports: List[ExportRequest] = Field(..., description="List of export requests")
    notification_email: Optional[str] = Field(None, description="Email for completion notification")
    description: Optional[str] = Field(None, description="Description of this bulk export")


class BulkExportResponse(BaseModel):
    """Response for bulk export requests."""
    bulk_export_id: str = Field(..., description="Bulk export identifier")
    individual_exports: List[ExportResponse] = Field(..., description="Individual export jobs")
    status: str = Field(..., description="Overall bulk export status")
    
    # Progress tracking
    total_jobs: int = Field(..., description="Total number of export jobs")
    completed_jobs: int = Field(0, description="Number of completed jobs")
    failed_jobs: int = Field(0, description="Number of failed jobs")
    
    # Timestamps
    started_at: datetime = Field(..., description="When bulk export was started")
    estimated_completion: Optional[datetime] = Field(None, description="Estimated completion time")