import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss']
})
export class ProductsPage implements OnInit {
  productService = inject(ProductService);
  cartService = inject(CartService);
  route = inject(ActivatedRoute);

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];
  brands: string[] = [];

  searchQuery = '';
  selectedCategory = 'ALL';
  selectedBrand = 'ALL';
  onlyDeals = false;
  onlyInStock = false;
  sortBy = 'featured';

  router = inject(Router);

  ngOnInit(): void {
    this.productService.categories$.subscribe(cats => {
      this.categories = cats;
      this.applyFilters();
    });

    this.productService.products$.subscribe(prods => {
      this.allProducts = prods;
      this.brands = Array.from(new Set(prods.map(p => p.brand))).sort();
      this.applyFilters();
    });

    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectedCategory = params['category'];
      }
      if (params['q']) {
        this.searchQuery = params['q'];
      }
      if (params['brand']) {
        this.selectedBrand = params['brand'];
      }
      this.applyFilters();
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  selectBrand(brand: string): void {
    this.selectedBrand = brand;
    this.applyFilters();
  }

  toggleDeals(): void {
    this.onlyDeals = !this.onlyDeals;
    this.applyFilters();
  }

  toggleInStock(): void {
    this.onlyInStock = !this.onlyInStock;
    this.applyFilters();
  }

  applyFilters(): void {
    let prods = [...this.allProducts];

    // Category filter
    if (this.selectedCategory !== 'ALL') {
      prods = prods.filter(p => p.category === this.selectedCategory);
    }

    // Brand filter
    if (this.selectedBrand !== 'ALL') {
      prods = prods.filter(p => p.brand === this.selectedBrand);
    }

    // Deals Only filter (>= 20% OFF)
    if (this.onlyDeals) {
      prods = prods.filter(p => (p.discountPercentage || 0) >= 20);
    }

    // In Stock Only
    if (this.onlyInStock) {
      prods = prods.filter(p => p.inStock && p.stock > 0);
    }

    // Search query filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      prods = prods.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.tamilName && p.tamilName.toLowerCase().includes(q)) ||
        Object.values(p.specs).some(val => val.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (this.sortBy === 'price-asc') {
      prods.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'price-desc') {
      prods.sort((a, b) => b.price - a.price);
    } else if (this.sortBy === 'rating') {
      prods.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    this.filteredProducts = prods;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = 'ALL';
    this.selectedBrand = 'ALL';
    this.onlyDeals = false;
    this.onlyInStock = false;
    this.sortBy = 'featured';
    this.applyFilters();
  }

  getSpecKeys(specs: { [key: string]: string }): string[] {
    return Object.keys(specs).slice(0, 2);
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
  }

  buyNow(product: Product): void {
    this.cartService.addToCart(product, 1, false);
    this.router.navigate(['/cart']);
  }
}
