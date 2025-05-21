import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface InventoryItem {
  _id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  threshold: number;
  lastUpdated: Date;
  supplier: string;
}

interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItem: (item: Omit<InventoryItem, '_id' | 'lastUpdated'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      items: [],
      loading: false,
      error: null,
      fetchItems: async () => {
        set({ loading: true });
        try {
          const response = await fetch('/api/inventory');
          const data = await response.json();
          set({ items: data, loading: false });
        } catch (error) {
          set({ error: 'Failed to fetch items', loading: false });
        }
      },
      addItem: async (item) => {
        set({ loading: true });
        try {
          const response = await fetch('/api/inventory', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item),
          });
          const newItem = await response.json();
          set((state) => ({ items: [...state.items, newItem], loading: false }));
        } catch (error) {
          set({ error: 'Failed to add item', loading: false });
        }
      },
      updateItem: async (id, updates) => {
        set({ loading: true });
        try {
          const response = await fetch(`/api/inventory/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          });
          const updatedItem = await response.json();
          set((state) => ({
            items: state.items.map((item) =>
              item._id === id ? { ...item, ...updatedItem } : item
            ),
            loading: false,
          }));
        } catch (error) {
          set({ error: 'Failed to update item', loading: false });
        }
      },
      deleteItem: async (id) => {
        set({ loading: true });
        try {
          await fetch(`/api/inventory/${id}`, {
            method: 'DELETE',
          });
          set((state) => ({
            items: state.items.filter((item) => item._id !== id),
            loading: false,
          }));
        } catch (error) {
          set({ error: 'Failed to delete item', loading: false });
        }
      },
    }),
    {
      name: 'inventory-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);