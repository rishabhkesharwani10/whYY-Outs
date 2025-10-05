import { useContext } from 'react';
import { CouponContext } from '../context/CouponContext.tsx';

export const useCoupons = () => {
  const context = useContext(CouponContext);
  if (context === undefined) {
    throw new Error('useCoupons must be used within a CouponProvider');
  }
  return context;
};