import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { ProductProvider } from './context/ProductContext.tsx';
import { OrderProvider } from './context/OrderContext.tsx';
import { AICopilotProvider } from './context/AICopilotContext.tsx';
import { WishlistProvider } from './context/WishlistContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { ReturnProvider } from './context/ReturnContext.tsx';
import { CouponProvider } from './context/CouponContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { NavigationProgressProvider } from './context/NavigationProgressContext.tsx';
import { StoryProvider } from './context/StoryContext.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationProgressProvider>
    <AuthProvider>
      <ToastProvider>
        <ProductProvider>
          <StoryProvider>
            <WishlistProvider>
              <CartProvider>
                <OrderProvider>
                  <NotificationProvider>
                    <ReturnProvider>
                      <CouponProvider>
                        <AICopilotProvider>
                          {children}
                        </AICopilotProvider>
                      </CouponProvider>
                    </ReturnProvider>
                  </NotificationProvider>
                </OrderProvider>
              </CartProvider>
            </WishlistProvider>
          </StoryProvider>
        </ProductProvider>
      </ToastProvider>
    </AuthProvider>
  </NavigationProgressProvider>
);

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </HashRouter>
  </React.StrictMode>
);