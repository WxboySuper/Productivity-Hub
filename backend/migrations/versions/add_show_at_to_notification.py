"""add show_at to notification

Revision ID: add_show_at_to_notification
Revises: fc9950b76522
Create Date: 2025-07-09 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_show_at_to_notification'
down_revision = 'fc9950b76522'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('notification', sa.Column('show_at', sa.DateTime(), nullable=True))

def downgrade():
    op.drop_column('notification', 'show_at')
