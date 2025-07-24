import { render, screen } from '@testing-library/react';
import ConfirmDialog from '../ConfirmDialog';
import { describe, it, expect, vi } from 'vitest';

describe('ConfirmDialog', () => {
  it('does not render when open is false', () => {
    render(
      <ConfirmDialog
        open={false}
        title="Test Title"
        message="Test Message"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    // Should not find the dialog title or message
    expect(screen.queryByText('Test Title')).toBeNull();
    expect(screen.queryByText('Test Message')).toBeNull();
  });
});
