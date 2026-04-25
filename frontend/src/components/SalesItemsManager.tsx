import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  getSalesItems,
  createSalesItem,
  updateSalesItem,
  deleteSalesItem,
  SalesItem,
} from '../api/salesItemsApi';

const SalesItemsManager: React.FC = () => {
  const [items, setItems] = useState<SalesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [editingItem, setEditingItem] = useState<SalesItem | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SalesItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const fetchedItems = await getSalesItems();
      setItems(fetchedItems);
      setError(null);
    } catch (err: any) {
      console.error('Error loading sales items:', err);
      setError(err.response?.data?.error || 'Failed to load sales items');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      setError('Item name cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await createSalesItem({ name: newItemName.trim() });
      setSuccess('Item added successfully');
      setNewItemName('');
      await loadItems();
    } catch (err: any) {
      console.error('Error adding item:', err);
      setError(err.response?.data?.error || 'Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (item: SalesItem) => {
    setEditingItem(item);
    setEditItemName(item.name);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditItemName('');
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editItemName.trim()) {
      setError('Item name cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await updateSalesItem(editingItem.id, { name: editItemName.trim() });
      setSuccess('Item updated successfully');
      setEditingItem(null);
      setEditItemName('');
      await loadItems();
    } catch (err: any) {
      console.error('Error updating item:', err);
      setError(err.response?.data?.error || 'Failed to update item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (item: SalesItem) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setSubmitting(true);
      setError(null);
      await deleteSalesItem(itemToDelete.id);
      setSuccess('Item deleted successfully');
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      await loadItems();
    } catch (err: any) {
      console.error('Error deleting item:', err);
      setError(err.response?.data?.error || 'Failed to delete item');
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: 'add' | 'edit') => {
    if (e.key === 'Enter' && !submitting) {
      e.preventDefault();
      if (action === 'add' && newItemName.trim()) {
        handleAddItem();
      } else if (action === 'edit' && editItemName.trim()) {
        handleSaveEdit();
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Manage Sales Items
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Add items to the dropdown list for quick selection when creating sales transactions.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Add new item */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            fullWidth
            label="New Item Name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, 'add')}
            disabled={submitting}
            placeholder="e.g., Product A, Service B"
          />
          <Button
            variant="contained"
            onClick={handleAddItem}
            disabled={submitting || !newItemName.trim()}
            sx={{ minWidth: { xs: '100%', sm: '100px' } }}
          >
            Add
          </Button>
        </Box>

        {/* Items list */}
        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            No items added yet. Add your first item above.
          </Typography>
        ) : (
          <List>
            {items.map((item) => (
              <ListItem
                key={item.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'center' },
                  gap: { xs: 1, sm: 0 },
                  py: { xs: 2, sm: 1 },
                }}
                secondaryAction={
                  editingItem?.id === item.id ? (
                    <Box sx={{ display: 'flex', gap: 1, position: { xs: 'static', sm: 'absolute' }, right: { sm: 16 } }}>
                      <Button
                        size="small"
                        onClick={handleSaveEdit}
                        disabled={submitting || !editItemName.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        size="small"
                        onClick={handleCancelEdit}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 0.5, position: { xs: 'static', sm: 'absolute' }, right: { sm: 16 } }}>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleEditClick(item)}
                        disabled={submitting}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteClick(item)}
                        disabled={submitting}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )
                }
              >
                {editingItem?.id === item.id ? (
                  <TextField
                    fullWidth
                    value={editItemName}
                    onChange={(e) => setEditItemName(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'edit')}
                    disabled={submitting}
                    autoFocus
                    sx={{ mr: { xs: 0, sm: 2 } }}
                  />
                ) : (
                  <ListItemText primary={item.name} sx={{ pr: { xs: 0, sm: 10 } }} />
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" disabled={submitting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesItemsManager;
