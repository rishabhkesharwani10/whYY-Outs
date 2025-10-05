import { useContext } from 'react';
import { CartStateContext, CartActionsContext } from '../context/CartContext.tsx';

export const useCartState = () => {
  const context = useContext(CartStateContext);
  if (context === undefined) {
    throw new Error('useCartState must be used within a CartProvider');
  }
  return context;
};

export const useCartActions = () => {
  const context = useContext(CartActionsContext);
  if (context === undefined) {
    throw new Error('useCartActions must be used within a CartProvider');
  }
  return context;
};
