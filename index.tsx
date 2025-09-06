
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as ReactRouterDOM from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { ProductProvider } from './context/ProductContext.tsx';
import { OrderProvider } from './context/OrderContext.tsx';
import { AICopilotProvider } from './context/AICopilotContext.tsx';
import { WishlistProvider } from './context/WishlistContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { ReturnProvider } from './context/ReturnContext.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ReactRouterDOM.HashRouter>
      <AuthProvider>
        <ProductProvider>
          <WishlistProvider>
            <CartProvider>
              <OrderProvider>
                <NotificationProvider>
                  <ReturnProvider>
                    <AICopilotProvider>
                      <App />
                    </AICopilotProvider>
                  </ReturnProvider>
                </NotificationProvider>
              </OrderProvider>
            </CartProvider>
          </WishlistProvider>
        </ProductProvider>
      </AuthProvider>
    </ReactRouterDOM.HashRouter>
  </React.StrictMode>
);