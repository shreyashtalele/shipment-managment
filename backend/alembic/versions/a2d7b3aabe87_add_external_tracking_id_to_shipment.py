"""Add external_tracking_id to Shipment

Revision ID: a2d7b3aabe87
Revises: f4da203644d8
Create Date: 2025-07-08 22:38:46.519805
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# Revision identifiers, used by Alembic.
revision: str = 'a2d7b3aabe87'
down_revision: Union[str, Sequence[str], None] = 'f4da203644d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Apply the migration: Add external_tracking_id and cast IDs to UUID."""
    # Add new column for external tracking ID
    op.add_column('shipments', sa.Column('external_tracking_id', sa.String(), nullable=True))

    # Convert shipment_id and tracking_id columns to UUID safely
    op.execute("ALTER TABLE shipments ALTER COLUMN shipment_id TYPE UUID USING shipment_id::uuid")
    op.execute("ALTER TABLE shipments ALTER COLUMN tracking_id TYPE UUID USING tracking_id::uuid")

    # Add index on external_tracking_id
    op.create_index(op.f('ix_shipments_external_tracking_id'), 'shipments', ['external_tracking_id'], unique=False)


def downgrade() -> None:
    """Revert the migration: Remove external_tracking_id and cast IDs back to text."""
    # Drop index on external_tracking_id
    op.drop_index(op.f('ix_shipments_external_tracking_id'), table_name='shipments')

    # Revert UUID fields back to string (text)
    op.execute("ALTER TABLE shipments ALTER COLUMN tracking_id TYPE VARCHAR USING tracking_id::text")
    op.execute("ALTER TABLE shipments ALTER COLUMN shipment_id TYPE VARCHAR USING shipment_id::text")

    # Drop external_tracking_id column
    op.drop_column('shipments', 'external_tracking_id')
