import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Entity, formatEntityName } from '../utils/debtTrackerUtils';

interface EntitySelectorProps {
  senderEntity: Entity | null;
  receiverEntity: Entity | null;
  onSenderSelect: (entity: Entity | null) => void;
  onReceiverSelect: (entity: Entity | null) => void;
}

const ENTITIES: Entity[] = ['lev', 'danik', '2masters'];

const EntitySelector: React.FC<EntitySelectorProps> = ({
  senderEntity,
  receiverEntity,
  onSenderSelect,
  onReceiverSelect,
}) => {
  const handleSenderClick = (entity: Entity) => {
    if (senderEntity === entity) {
      // Deselect if already selected
      onSenderSelect(null);
    } else {
      onSenderSelect(entity);
    }
  };

  const handleReceiverClick = (entity: Entity) => {
    if (receiverEntity === entity) {
      // Deselect if already selected
      onReceiverSelect(null);
    } else {
      onReceiverSelect(entity);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
        {/* Left column (sender) */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {ENTITIES.map((entity) => {
              const isSelected = senderEntity === entity;
              const isDisabled = receiverEntity === entity;
              
              // Determine background color based on selection state
              let backgroundColor = 'transparent';
              let opacity = 1;
              if (isSelected) {
                // This is the selected entity - dark grey
                backgroundColor = '#9e9e9e';
              } else if (senderEntity !== null) {
                // Another entity is selected in this column - lighter grey with transparency
                backgroundColor = '#e8e8e8';
                opacity = 0.4;
              }
              
              return (
                <Button
                  key={entity}
                  variant="outlined"
                  onClick={() => handleSenderClick(entity)}
                  disabled={isDisabled}
                  sx={{
                    borderColor: '#000',
                    color: '#000',
                    backgroundColor,
                    opacity,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: isDisabled ? 'none' : 'scale(1.02)',
                      backgroundColor: isDisabled ? backgroundColor : '#757575',
                      borderColor: '#000',
                      opacity: isDisabled ? opacity : 1,
                    },
                    '&:focus': {
                      transform: isDisabled ? 'none' : 'scale(1.02)',
                    },
                    '&.Mui-disabled': {
                      borderColor: '#000',
                      color: '#000',
                      backgroundColor,
                      opacity,
                    },
                  }}
                >
                  {formatEntityName(entity)}
                </Button>
              );
            })}
          </Box>
        </Box>

        {/* Right column (receiver) */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {ENTITIES.map((entity) => {
              const isSelected = receiverEntity === entity;
              const isDisabled = senderEntity === entity;
              
              // Determine background color based on selection state
              let backgroundColor = 'transparent';
              let opacity = 1;
              if (isSelected) {
                // This is the selected entity - dark grey
                backgroundColor = '#9e9e9e';
              } else if (isDisabled || receiverEntity !== null) {
                // Entity is disabled (selected on left) OR another entity is selected in this column - lighter grey with transparency
                backgroundColor = '#e8e8e8';
                opacity = 0.4;
              }
              
              return (
                <Button
                  key={entity}
                  variant="outlined"
                  onClick={() => handleReceiverClick(entity)}
                  disabled={isDisabled}
                  sx={{
                    borderColor: '#000',
                    color: '#000',
                    backgroundColor,
                    opacity,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: isDisabled ? 'none' : 'scale(1.02)',
                      backgroundColor: isDisabled ? backgroundColor : '#757575',
                      borderColor: '#000',
                      opacity: isDisabled ? opacity : 1,
                    },
                    '&:focus': {
                      transform: isDisabled ? 'none' : 'scale(1.02)',
                    },
                    '&.Mui-disabled': {
                      borderColor: '#000',
                      color: '#000',
                      backgroundColor,
                      opacity,
                    },
                  }}
                >
                  {formatEntityName(entity)}
                </Button>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default EntitySelector;
