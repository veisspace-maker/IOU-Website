import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import EntitySelector from './EntitySelector';
import { Entity } from '../utils/debtTrackerV2Utils';

describe('EntitySelector', () => {
  const mockOnSenderSelect = vi.fn();
  const mockOnReceiverSelect = vi.fn();

  beforeEach(() => {
    mockOnSenderSelect.mockClear();
    mockOnReceiverSelect.mockClear();
  });

  describe('Initial render', () => {
    test('should render two columns with all entity options', () => {
      render(
        <EntitySelector
          senderEntity={null}
          receiverEntity={null}
          onSenderSelect={mockOnSenderSelect}
          onReceiverSelect={mockOnReceiverSelect}
        />
      );

      // Check column headers
      expect(screen.getByText('Sender')).toBeInTheDocument();
      expect(screen.getByText('Receiver')).toBeInTheDocument();

      // Check all entities are displayed with proper formatting
      const levButtons = screen.getAllByText('Lev');
      const danikButtons = screen.getAllByText('Danik');
      const mastersButtons = screen.getAllByText('2 Masters');

      expect(levButtons).toHaveLength(2); // One in each column
      expect(danikButtons).toHaveLength(2);
      expect(mastersButtons).toHaveLength(2);
    });

    test('should have all options enabled when nothing is selected', () => {
      render(
        <EntitySelector
          senderEntity={null}
          receiverEntity={null}
          onSenderSelect={mockOnSenderSelect}
          onReceiverSelect={mockOnReceiverSelect}
        />
      );

      const buttons = screen.getAllByRole('button');
      // Filter out the title buttons if any
      const entityButtons = buttons.filter(btn => 
        btn.textContent === 'Lev' || 
        btn.textContent === 'Danik' || 
        btn.textContent === '2 Masters'
      );

      entityButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Selection state', () => {
    test('should call onSenderSelect when sender entity is clicked', () => {
      render(
        <EntitySelector
          senderEntity={null}
          receiverEntity={null}
          onSenderSelect={mockOnSenderSelect}
          onReceiverSelect={mockOnReceiverSelect}
        />
      );

      const levButtons = screen.getAllByText('Lev');
      fireEvent.click(levButtons[0]); // Click first Lev button (sender column)

      expect(mockOnSenderSelect).toHaveBeenCalledWith('lev');
    });

    test('should call onReceiverSelect when receiver entity is clicked', () => {
      render(
        <EntitySelector
          senderEntity={null}
          receiverEntity={null}
          onSenderSelect={mockOnSenderSelect}
          onReceiverSelect={mockOnReceiverSelect}
        />
      );

      const danikButtons = screen.getAllByText('Danik');
      fireEvent.click(danikButtons[1]); // Click second Danik button (receiver column)

      expect(mockOnReceiverSelect).toHaveBeenCalledWith('danik');
    });

    test('should deselect when clicking the same entity again', () => {
      render(
        <EntitySelector
          senderEntity={'lev' as Entity}
          receiverEntity={null}
          onSenderSelect={mockOnSenderSelect}
          onReceiverSelect={mockOnReceiverSelect}
        />
      );

      const levButtons = screen.getAllByText('Lev');
      fireEvent.click(levButtons[0]); // Click selected Lev button

      expect(mockOnSenderSelect).toHaveBeenCalledWith(null);
    });
  });

  describe('Dimming logic - same column', () => {
    test('should dim other options in sender column when one is selected', () => {
      const { container } = render(
        <EntitySelector
          senderEntity={'lev' as Entity}
          receiverEntity={null}
          onSenderSelect={mockOnSenderSelect}
          onReceiverSelect={mockOnReceiverSelect}
        />
      );

      // Get all buttons in the sender column (first column)
      const senderColumn = container.querySelectorAll('.MuiBox-root')[2]; // Third Box is sender column
      const senderButtons = senderColumn.querySelectorAll('button');

      // Find Lev button (selected) and others
      const levButton = Array.from(senderButtons).find(btn => btn.textContent === 'Lev');
      const danikButton = Array.from(senderButtons).find(btn => btn.textContent === 'Danik');
      const mastersButton = Array.from(senderButtons).find(btn => btn.textContent === '2 Masters');

      // Selected button should not be dimmed (opacity 1)
      expect(levButton).toHaveStyle({ opacity: '1' });
      
      // Other buttons in same column should be dimmed (opacity 0.3)
      expect(danikButton).toHaveStyle({ opacity: '0.3' });
      expect(mastersButton).toHaveStyle({ opacity: '0.3' });
    });

    test('should dim other options in receiver column when one is selected', () => {
      const { container } = render(
        <EntitySelector
          senderEntity={null}
          receiverEntity={'danik' as Entity}
          onSenderSelect={mockOnSenderSelect}
          onReceiverSelect={mockOnReceiverSelect}
        />
      );

      // Get all buttons in the receiver column (second column)
      const receiverColumn = container.querySelectorAll('.MuiBox-root')[4]; // Fifth Box is receiver column
      const receiverButtons = receiverColumn.querySelectorAll('button');

      // Find Danik button (selected) and others
      const danikButton = Array.from(receiverButtons).find(btn => btn.textContent === 'Danik');
      const levButton = Array.from(receiverButtons).find(btn => btn.textContent === 'Lev');
      const mastersButton = Array.from(receiverButtons).find(btn => btn.textContent === '2 Masters');

      // Selected button should not be dimmed
      expect(danikButton).toHaveStyle({ opacity: '1' });
      
      // Other buttons in same column should be dimmed
      expect(levButton).toHaveStyle({ opacity: '0.3' });
      expect(mastersButton).toHaveStyle({ opacity: '0.3' });
    });
  });

  describe('Cross-column dimming', () => {
    test('should dim and disable same entity in receiver column when selected in sender column', () => {
      render(
        <EntitySelector
          senderEntity={'lev' as Entity}
          receiverEntity={null}
          onSenderSelect={mockOnSenderSelect}
          onReceiverSelect={mockOnReceiverSelect}
        />
      );

      const levButtons = screen.getAllByText('Lev');
      const receiverLevButton = levButtons[1]; // Second Lev button is in receiver column

      expect(receiverLevButton).toBeDisabled();
      expect(receiverLevButton).toHaveStyle({ opacity: '0.3' });
    });

    test('should dim and disable same entity in sender column when selected in receiver column', () => {
      render(
        <EntitySelector
          senderEntity={null}
          receiverEntity={'2masters' as Entity}
          onSenderSelect={mockOnSenderSelect}
          onReceiverSelect={mockOnReceiverSelect}
        />
      );

      const mastersButtons = screen.getAllByText('2 Masters');
      const senderMastersButton = mastersButtons[0]; // First 2 Masters button is in sender column

      expect(senderMastersButton).toBeDisabled();
      expect(senderMastersButton).toHaveStyle({ opacity: '0.3' });
    });

    test('should prevent clicking disabled entity in opposite column', () => {
      render(
        <EntitySelector
          senderEntity={'danik' as Entity}
          receiverEntity={null}
          onSenderSelect={mockOnSenderSelect}
          onReceiverSelect={mockOnReceiverSelect}
        />
      );

      const danikButtons = screen.getAllByText('Danik');
      const receiverDanikButton = danikButtons[1];

      fireEvent.click(receiverDanikButton);

      // Should not call onReceiverSelect because button is disabled
      expect(mockOnReceiverSelect).not.toHaveBeenCalled();
    });
  });

  describe('Entity name formatting', () => {
    test('should display "2 Masters" for 2masters entity', () => {
      render(
        <EntitySelector
          senderEntity={null}
          receiverEntity={null}
          onSenderSelect={mockOnSenderSelect}
          onReceiverSelect={mockOnReceiverSelect}
        />
      );

      const mastersButtons = screen.getAllByText('2 Masters');
      expect(mastersButtons).toHaveLength(2);
    });

    test('should display capitalized names for lev and danik', () => {
      render(
        <EntitySelector
          senderEntity={null}
          receiverEntity={null}
          onSenderSelect={mockOnSenderSelect}
          onReceiverSelect={mockOnReceiverSelect}
        />
      );

      expect(screen.getAllByText('Lev')).toHaveLength(2);
      expect(screen.getAllByText('Danik')).toHaveLength(2);
    });
  });
});
