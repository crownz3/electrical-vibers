import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage)
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/products/products.page').then(m => m.ProductsPage)
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./pages/product-detail/product-detail.page').then(m => m.ProductDetailPage)
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.page').then(m => m.CartPage)
  },
  {
    path: 'book-service',
    loadComponent: () => import('./pages/book-service/book-service.page').then(m => m.BookServicePage)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPage)
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
